import { generateText, type CoreTool, type GenerateTextResult, type Message } from 'ai';
import ignore from 'ignore';
import type { IProviderSetting } from '~/types/model';
import { IGNORE_PATTERNS, type FileMap } from './constants';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { createFilesContext, extractCurrentContext, extractPropertiesFromMessage, simplifyBoltActions } from './utils';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';
import { createSummary } from './create-summary';

// Métricas de uso
const cumulativeUsage = {
  completionTokens: 0,
  promptTokens: 0,
  totalTokens: 0
};

// Cache com TTL
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const MAX_CACHE_SIZE = 100; // Limite máximo de itens no cache
const contextCache = new Map<string, {
  timestamp: number;
  files: FileMap;
  metrics?: {
    processTime: number;
    tokensUsed: number;
  };
}>();

// Métricas de cache
let cacheHits = 0;
let cacheMisses = 0;

// Common patterns to ignore, similar to .gitignore

const ig = ignore().add(IGNORE_PATTERNS);
const logger = createScopedLogger('select-context');

// Função para extrair a essência da mensagem
function extractMessageEssence(message: any): string {
  let text = '';
  
  if (typeof message === 'string') {
    text = message;
  } else if (Array.isArray(message)) {
    text = message
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join(' ');
  } else if (typeof message === 'object') {
    text = message.content || message.text || JSON.stringify(message);
  }
  
  // Remove informações de modelo/provider
  text = text.replace(/\[Model:[^\]]+\]/g, '')
            .replace(/\[Provider:[^\]]+\]/g, '')
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
            
  return text;
}

// Função para gerar hash simples da string
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Função para verificar similaridade semântica usando LLM
async function checkSemanticSimilarity(
  currentMessage: string,
  cachedMessages: Array<{key: string, message: string, timestamp: number}>,
  modelDetails: any,
  provider: any,
  serverEnv: any,
  apiKeys?: Record<string, string>,
  providerSettings?: Record<string, IProviderSetting>
): Promise<string | null> {
  if (cachedMessages.length === 0) return null;

  // Ordena mensagens do cache por timestamp (mais recentes primeiro)
  const recentMessages = cachedMessages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5); // Pega as 5 mais recentes

  const prompt = `
    Você é um assistente especializado em análise semântica.
    
    MENSAGEM ATUAL:
    "${currentMessage}"
    
    MENSAGENS EM CACHE:
    ${recentMessages.map((m, i) => `${i + 1}. "${m.message}"`).join('\n')}
    
    TAREFA:
    Analise se a mensagem atual é semanticamente similar a alguma das mensagens em cache.
    Considere similar se:
    1. O objetivo/intenção é o mesmo
    2. As ações solicitadas são equivalentes
    3. O contexto é similar
    
    RESPONDA APENAS com o número da mensagem similar (1-5) ou "nenhuma" se não houver similaridade suficiente.
    `;

  try {
    const resp = await generateText({
      prompt,
      model: provider.getModelInstance({
        model: modelDetails.name,
        serverEnv,
        apiKeys,
        providerSettings,
      }),
    });

    const answer = resp.text.trim().toLowerCase();
    
    if (answer === 'nenhuma') return null;
    
    // Extrai o número da resposta (1-5)
    const matchIndex = parseInt(answer) - 1;
    if (matchIndex >= 0 && matchIndex < recentMessages.length) {
      return recentMessages[matchIndex].key;
    }
  } catch (error) {
    logger.error('Erro ao verificar similaridade semântica:', error);
  }
  
  return null;
}

export async function selectContext(props: {
  messages: Message[];
  env?: Env;
  apiKeys?: Record<string, string>;
  files: FileMap;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  summary: string;
  onFinish?: (resp: GenerateTextResult<Record<string, CoreTool<any, any>>, never>) => void;
}) {
  const startTime = performance.now();
  const { messages, env: serverEnv, apiKeys, files, providerSettings, summary: existingSummary, onFinish } = props;
  
  // Log inicial com métricas
  logger.debug('Iniciando selectContext');
  logger.debug(`Métricas de Cache - Hits: ${cacheHits}, Misses: ${cacheMisses}, Taxa de acerto: ${(cacheHits/(cacheHits+cacheMisses)*100).toFixed(2)}%`);
  logger.debug(`Tamanho atual do cache: ${contextCache.size} itens`);

  let summary = existingSummary;
  
  // Cria summary se não existir
  if (!summary && messages.length > 0) {
    logger.debug('Gerando novo summary do chat');
    const summaryStartTime = performance.now();
    
    try {
      summary = await createSummary({
        messages: [...messages],
        env: serverEnv,
        apiKeys,
        providerSettings,
        promptId: props.promptId,
        contextOptimization: props.contextOptimization,
        onFinish(resp) {
          if (resp.usage) {
            logger.debug('createSummary token usage', JSON.stringify(resp.usage));
            cumulativeUsage.completionTokens += resp.usage.completionTokens || 0;
            cumulativeUsage.promptTokens += resp.usage.promptTokens || 0;
            cumulativeUsage.totalTokens += resp.usage.totalTokens || 0;
          }
        },
      });
      
      const summaryTime = performance.now() - summaryStartTime;
      logger.debug(`Summary gerado em ${summaryTime.toFixed(2)}ms`);
    } catch (error) {
      logger.error('Erro ao gerar summary:', error);
      summary = 'Failed to generate summary';
    }
  } else {
    logger.debug('Usando summary existente');
  }
  
  // Otimiza a chave de cache usando apenas dados essenciais
  const lastMessage = messages[messages.length - 1]?.content || '';
  const filesKey = Object.keys(files).sort().join(',');
  
  // Extrai essência da mensagem e gera hash dos arquivos
  const messageEssence = extractMessageEssence(lastMessage);
  const filesHash = simpleHash(filesKey);
  
  const cacheKey = JSON.stringify({
    message: messageEssence,
    files: filesHash
  });

  // Verifica cache exato primeiro
  let cachedItem = contextCache.get(cacheKey);
  
  if (!cachedItem) {
    let currentModel = DEFAULT_MODEL;
    let currentProvider = DEFAULT_PROVIDER.name;
    const processedMessages = messages.map((message) => {
      if (message.role === 'user') {
        const { model, provider, content } = extractPropertiesFromMessage(message);
        currentModel = model;
        currentProvider = provider;
        return { ...message, content };
      } else if (message.role == 'assistant') {
        let content = message.content;
        content = simplifyBoltActions(content);
        content = content.replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '');
        content = content.replace(/<think>.*?<\/think>/s, '');
        return { ...message, content };
      }
      return message;
    });

    const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
    const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
    let modelDetails = staticModels.find((m) => m.name === currentModel);

    if (!modelDetails) {
      const modelsList = [
        ...(provider.staticModels || []),
        ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
          apiKeys,
          providerSettings,
          serverEnv: serverEnv as any,
        })),
      ];

      if (!modelsList.length) {
        throw new Error(`No models found for provider ${provider.name}`);
      }

      modelDetails = modelsList.find((m) => m.name === currentModel);

      if (!modelDetails) {
        modelDetails = modelsList[0];
      }
    }

    // Se não encontrou cache exato, tenta encontrar similar
    if (contextCache.size > 0) {
      logger.debug('Cache exato não encontrado, verificando similaridade semântica...');
      
      // Coleta todas as mensagens em cache para análise semântica
      const cachedMessages = Array.from(contextCache.entries()).map(([key, value]) => ({
        key,
        message: JSON.parse(key).message,
        timestamp: value.timestamp
      }));
      
      const similarCacheKey = await checkSemanticSimilarity(
        messageEssence,
        cachedMessages,
        modelDetails,
        provider,
        serverEnv,
        apiKeys,
        providerSettings
      );
      
      if (similarCacheKey) {
        logger.debug('Encontrada mensagem semanticamente similar no cache!');
        cachedItem = contextCache.get(similarCacheKey);
      }
    }
  }

  if (cachedItem) {
    const now = Date.now();
    const cacheAge = now - cachedItem.timestamp;
    
    if (cacheAge <= CACHE_TTL) {
      cacheHits++;
      logger.debug('Cache válido, retornando arquivos em cache');
      logger.debug(`Arquivos em cache: ${Object.keys(cachedItem.files).join(', ')}`);
      if (cachedItem.metrics) {
        logger.debug(`Métricas do cache - Tokens usados: ${cachedItem.metrics.tokensUsed}, Tempo economizado: ${cachedItem.metrics.processTime.toFixed(2)}ms`);
      }
      return cachedItem.files;
    }
    
    logger.debug('Cache expirado, removendo...');
    contextCache.delete(cacheKey);
  }

  cacheMisses++;
  logger.debug('Cache miss - Necessário processar contexto');

  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;

      content = simplifyBoltActions(content);

      content = content.replace(/<div class=\\"__boltThought__\\">.*?<\/div>/s, '');
      content = content.replace(/<think>.*?<\/think>/s, '');

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  const { codeContext } = extractCurrentContext(processedMessages);

  let filePaths = getFilePaths(files || {});
  filePaths = filePaths.filter((x) => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });

  let context = '';
  const currrentFiles: string[] = [];
  const contextFiles: FileMap = {};

  if (codeContext?.type === 'codeContext') {
    const codeContextFiles: string[] = codeContext.files;
    Object.keys(files || {}).forEach((path) => {
      let relativePath = path;

      if (path.startsWith('/home/project/')) {
        relativePath = path.replace('/home/project/', '');
      }

      if (codeContextFiles.includes(relativePath)) {
        contextFiles[relativePath] = files[path];
        currrentFiles.push(relativePath);
      }
    });
    context = createFilesContext(contextFiles);
  }

  const summaryText = `Here is the summary of the chat till now: ${summary}`;
  
  // Log do summary antes do prompt
  logger.debug('Usando summary no prompt:', summaryText.substring(0, 100) + '...');

  const extractTextContent = (message: Message) =>
    Array.isArray(message.content)
      ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
      : message.content;

  const lastUserMessage = processedMessages.filter((x) => x.role == 'user').pop();

  if (!lastUserMessage) {
    throw new Error('No user message found');
  }

  // select files from the list of code file from the project that might be useful for the current request from the user
  const resp = await generateText({
    system: `
        You are a software engineer. You are working on a project. You have access to the following files:

        AVAILABLE FILES PATHS
        ---
        ${filePaths.map((path) => `- ${path}`).join('\n')}
        ---
        
        You have following code loaded in the context buffer that you can refer to:

        CURRENT CONTEXT BUFFER
        ---
        ${context}
        ---

        Now, you are given a task. You need to select the files that are relevant to the task from the list of files above.

        RESPONSE FORMAT:
        your response shoudl be in following format:
---
<updateContextBuffer>
    <includeFile path="path/to/file"/>
    <excludeFile path="path/to/file"/>
</updateContextBuffer>
---
        * Your should start with <updateContextBuffer> and end with </updateContextBuffer>. 
        * You can include multiple <includeFile> and <excludeFile> tags in the response.
        * You should not include any other text in the response.
        * You should not include any file that is not in the list of files above.
        * You should not include any file that is already in the context buffer.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        `,
    prompt: `
        ${summaryText}

        Users Question: ${extractTextContent(lastUserMessage)}

        update the context buffer with the files that are relevant to the task from the list of files above.

        CRITICAL RULES:
        * Only include relevant files in the context buffer.
        * context buffer should not include any file that is not in the list of files above.
        * context buffer is extremlly expensive, so only include files that are absolutely necessary.
        * If no changes are needed, you can leave the response empty updateContextBuffer tag.
        * Only 5 files can be placed in the context buffer at a time.
        * if the buffer is full, you need to exclude files that is not needed and include files that is relevent.

        `,
    model: provider.getModelInstance({
      model: currentModel,
      serverEnv: serverEnv || ({} as Env),
      apiKeys,
      providerSettings,
    }) as any,
  });

  const response = resp.text;
  const updateContextBuffer = response.match(/<updateContextBuffer>([\s\S]*?)<\/updateContextBuffer>/);

  if (!updateContextBuffer) {
    throw new Error('Invalid response. Please follow the response format');
  }

  const includeFiles =
    updateContextBuffer[1]
      .match(/<includeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<includeFile path="', '').replace('"', '')) || [];
  const excludeFiles =
    updateContextBuffer[1]
      .match(/<excludeFile path="(.*?)"/gm)
      ?.map((x) => x.replace('<excludeFile path="', '').replace('"', '')) || [];

  const filteredFiles: FileMap = {};
  logger.debug(`Processando ${excludeFiles.length} arquivos para excluir e ${includeFiles.length} para incluir`);
  
  excludeFiles.forEach((path) => {
    logger.debug(`Excluindo arquivo: ${path}`);
    delete contextFiles[path];
  });
  
  includeFiles.forEach((path) => {
    let fullPath = path;

    if (!path.startsWith('/home/project/')) {
      fullPath = `/home/project/${path}`;
    }

    if (!filePaths.includes(fullPath)) {
      logger.warn(`Arquivo não encontrado na lista: ${path}`);
      throw new Error(`File ${path} is not in the list of files above.`);
    }

    if (currrentFiles.includes(path)) {
      logger.debug(`Arquivo já incluído, pulando: ${path}`);
      return;
    }

    logger.debug(`Incluindo arquivo: ${path}`);
    filteredFiles[path] = files[fullPath];
  });

  if (onFinish) {
    onFinish(resp);
  }

  const processTime = performance.now() - startTime;
  const tokensUsed = resp.usage?.totalTokens || 0;

  // Salva no cache com timestamp e métricas
  logger.debug(`Salvando resultado no cache (tempo de processamento: ${processTime.toFixed(2)}ms)`);
  logger.debug(`Total de arquivos selecionados: ${Object.keys(filteredFiles).length}`);
  logger.debug(`Métricas finais - Tokens: ${tokensUsed}, Tempo: ${processTime.toFixed(2)}ms`);
  
  contextCache.set(cacheKey, {
    timestamp: Date.now(),
    files: filteredFiles,
    metrics: {
      processTime,
      tokensUsed
    }
  });

  return filteredFiles;
}

// Limpa cache periodicamente
setInterval(() => {
  const now = Date.now();
  let removidos = 0;
  let tokensTotais = 0;
  let tempoTotal = 0;
  
  for (const [key, value] of contextCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      if (value.metrics) {
        tokensTotais += value.metrics.tokensUsed;
        tempoTotal += value.metrics.processTime;
      }
      contextCache.delete(key);
      removidos++;
    }
  }
  
  if (removidos > 0) {
    logger.debug(`Limpeza de cache: ${removidos} itens removidos. Novo tamanho: ${contextCache.size}`);
    logger.debug(`Métricas dos itens removidos - Tokens totais: ${tokensTotais}, Tempo total: ${tempoTotal.toFixed(2)}ms`);
  }
}, CACHE_TTL);

export function getFilePaths(files: FileMap) {
  return Object.keys(files).filter(x => {
    const relPath = x.replace('/home/project/', '');
    return !ig.ignores(relPath);
  });
}

export function getCacheSize() {
  return contextCache.size;
}
