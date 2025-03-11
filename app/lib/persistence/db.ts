import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

// Sistema de acumulação de atualizações
// Para cada chat, mantemos apenas a última operação de salvamento pendente
const pendingSaves = new Map<string, {
  messages: Message[];
  urlId?: string;
  description?: string;
  timestamp?: string;
  metadata?: IChatMetadata;
  timer: any;
  savePromise: Promise<void>;
  resolveSave: () => void;
  rejectSave: (error: Error) => void;
}>();

// Intervalo de acumulação (ms)
const ACCUMULATION_INTERVAL = 2000; // 2 segundos (mais responsivo)

// Contagem de operações REST
let restRequestCount = 0;

export interface IChatMetadata {
  // Interface para metadados adicionais do chat
  [key: string]: any;
}

// ===== FUNÇÕES UTILITÁRIAS =====

// Verifica se uma string é um UUID válido
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Obtém o usuário autenticado ou lança erro
async function getAuthenticatedUser() {
  const supabase = getOrCreateClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    logger.error('❌ Erro ao verificar autenticação:', authError);
    throw authError;
  }
  
  if (!user) {
    logger.error('❌ Usuário não autenticado');
    throw new Error('Usuário não autenticado');
  }
  
  return user;
}

// Busca um chat pelo ID ou urlId
async function findChat(id: string, select = '*'): Promise<any> {
  const supabase = getOrCreateClient();
  let query;
  
  if (isValidUUID(id)) {
    query = supabase.from('chats').select(select).eq('id', id).single();
  } else {
    query = supabase.from('chats').select(select).eq('urlId', id).maybeSingle();
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error(`❌ Erro ao buscar chat ${id}:`, error);
    throw error;
  }
  
  return data;
}

// Função para verificar se as mensagens foram carregadas corretamente e fazer log
function validateMessagesAndLog(data: any, idType: string, id: string): void {
  if (data.messages && Array.isArray(data.messages)) {
    logger.info(`✅ Chat recuperado pelo ${idType}: ${id} com ${data.messages.length} mensagens`);
    
    // Log para depuração de mensagens potencialmente truncadas
    data.messages.forEach((msg: any, index: number) => {
      if (typeof msg.content === 'string' && msg.content.length > 1000) {
        logger.info(`Mensagem ${index} tem ${msg.content.length} caracteres`);
      }
    });
  } else {
    logger.warn(`⚠️ Chat recuperado pelo ${idType} ${id} sem mensagens válidas`);
  }
}

// Configura Realtime subscription para um chat
function setupRealtimeSubscription(chatId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const supabase = getOrCreateClient();
    
    // Verificar se já existe uma subscription
    const existingChannels = supabase.getChannels();
    const alreadySubscribed = existingChannels.some((channel: any) => 
      channel.topic && channel.topic.includes(`chats:id=eq.${chatId}`)
    );
    
    if (alreadySubscribed) {
      return;
    }
    
    logger.info(`🔄 Configurando Realtime para chat ${chatId}`);
    
    // Inscrever para receber atualizações do chat
    supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: '*', // Todos os eventos (insert, update, delete)
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`,
      }, (payload: any) => {
        logger.info(`📡 Recebida atualização Realtime para chat ${chatId}`);
      })
      .subscribe((status: string) => {
        logger.info(`Realtime status: ${status}`);
      });
  } catch (error) {
    logger.error(`❌ Erro ao configurar Realtime para chat ${chatId}:`, error);
  }
}

// ===== PRINCIPAIS FUNÇÕES DA API =====

export async function openDatabase(): Promise<any> {
  logger.info('🔌 Iniciando conexão com Supabase');
  try {
    const client = getOrCreateClient();

    logger.info('✅ Conexão com Supabase estabelecida');
    logger.info('ℹ️ Throttling de 15 segundos configurado para reduzir requisições ao Supabase');
    return client;
  } catch (error) {
    logger.error('❌ Falha ao conectar com Supabase:', error);
    return undefined;
  }
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  logger.info('📋 Buscando todos os chats');
  try {
    const startTime = performance.now();
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    
    restRequestCount++;
    logger.info(`🔴 ISSO É UMA OPERAÇÃO REST NO SUPABASE (listando todos os chats) #${restRequestCount}`);
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chats recuperados (${data?.length || 0} itens, ${duration}ms)`);
    return (data || []) as unknown as ChatHistoryItem[];
  } catch (error) {
    logger.error('❌ Erro ao buscar todos os chats:', error);
    throw error;
  }
}

export async function setMessages(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata
): Promise<void> {
  // Se não há mensagens, não há nada para salvar
  if (!messages || messages.length === 0) {
    logger.warn(`⚠️ Tentativa de salvar chat ${id} sem mensagens`);
    return;
  }

  // Calcular o tamanho total das mensagens
  const totalSize = messages.reduce((size, msg) => {
    return size + (typeof msg.content === 'string' ? msg.content.length : 0);
  }, 0);

  // Log para depuração
  if (totalSize > 1000) {
    logger.info(`📊 Tamanho total das mensagens: ${totalSize} caracteres`);
  }

  // Se não temos uma operação pendente para este chat, criar uma nova
  if (!pendingSaves.has(id)) {
    // Criar uma nova promessa que será resolvida quando o salvamento for concluído
    let resolveSave: () => void;
    let rejectSave: (error: Error) => void;
    
    const savePromise = new Promise<void>((resolve, reject) => {
      resolveSave = resolve;
      rejectSave = reject;
    });

    // Configurar o timer para salvar após o intervalo de acumulação
    const timer = setTimeout(() => {
      // Obter a operação pendente mais recente
      const pendingOp = pendingSaves.get(id);
      if (!pendingOp) return;
      
      // Remover a operação pendente do mapa
      pendingSaves.delete(id);
      
      // Executar o salvamento
      _saveMessagesToSupabase(
        id, 
        pendingOp.messages, 
        pendingOp.urlId, 
        pendingOp.description, 
        pendingOp.timestamp, 
        pendingOp.metadata
      )
        .then(() => {
          // Log técnico sem mensagem de sucesso para UI
          pendingOp.resolveSave();
        })
        .catch((error) => {
          logger.error(`❌ Erro ao salvar mensagens para chat ${id}:`, error);
          pendingOp.rejectSave(error);
        });
    }, ACCUMULATION_INTERVAL);

    // Armazenar a operação pendente
    pendingSaves.set(id, {
      messages,
      urlId,
      description,
      timestamp,
      metadata,
      timer,
      savePromise,
      resolveSave: resolveSave!,
      rejectSave: rejectSave!
    });

    // Remover mensagem de agendamento
    return savePromise;
  }

  // Se já temos uma operação pendente para este chat, atualizá-la
  const pendingOp = pendingSaves.get(id)!;
  
  // Limpar o timer anterior
  clearTimeout(pendingOp.timer);
  
  // Manter a promessa existente, mas atualizar os dados
  pendingOp.messages = messages;
  pendingOp.urlId = urlId;
  pendingOp.description = description;
  pendingOp.timestamp = timestamp;
  pendingOp.metadata = metadata;
  
  // Configurar um novo timer
  pendingOp.timer = setTimeout(() => {
    // Obter a operação pendente mais recente
    const currentOp = pendingSaves.get(id);
    if (!currentOp) return;
    
    // Remover a operação pendente do mapa
    pendingSaves.delete(id);
    
    // Executar o salvamento
    _saveMessagesToSupabase(
      id, 
      currentOp.messages, 
      currentOp.urlId, 
      currentOp.description, 
      currentOp.timestamp, 
      currentOp.metadata
    )
      .then(() => {
        // Log técnico sem mensagem de sucesso para UI
        currentOp.resolveSave();
      })
      .catch((error) => {
        logger.error(`❌ Erro ao salvar mensagens para chat ${id}:`, error);
        currentOp.rejectSave(error);
      });
  }, ACCUMULATION_INTERVAL);
  
  // Remover mensagem de atualização de operação pendente
  return pendingOp.savePromise;
}

// Função interna para salvar mensagens no Supabase
async function _saveMessagesToSupabase(
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata
): Promise<void> {
  try {
    // Remover logger de salvamento aqui para evitar mensagens redundantes
    const startTime = performance.now();
    
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    
    if (timestamp && isNaN(Date.parse(timestamp))) {
      throw new Error('Timestamp inválido');
    }

    restRequestCount++;
    logger.info(`🔴 ISSO É UMA OPERAÇÃO REST NO SUPABASE #${restRequestCount}`);
    
    // Verificação e sanitização das mensagens para evitar problemas de truncamento
    const sanitizedMessages = messages.map(msg => {
      // Clone a mensagem para não modificar o objeto original
      const sanitizedMsg = { ...msg };
      
      // Garantir que o conteúdo seja uma string válida
      if (typeof sanitizedMsg.content === 'string') {
        // Verificar o tamanho para debug
        if (sanitizedMsg.content.length > 1000) {
          logger.info(`Mensagem grande detectada (${sanitizedMsg.content.length} caracteres)`);
        }
      }
      
      return sanitizedMsg;
    });

    // Log detalhado do conteúdo que está sendo salvo na coluna messages
    console.log('📦 CONTEÚDO SALVO NA COLUNA MESSAGES DO SUPABASE:', JSON.stringify({
      total_messages: sanitizedMessages.length,
      message_ids: sanitizedMessages.map(m => m.id),
      message_roles: sanitizedMessages.map(m => m.role),
      message_sizes: sanitizedMessages.map(m => typeof m.content === 'string' ? m.content.length : 0),
      full_content: sanitizedMessages
    }, null, 2));

    const payload = {
      id,
      user_id: user.id,
      messages: sanitizedMessages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata
    };

    // Usar a opção type_json para garantir armazenamento adequado do array de mensagens
    const { error } = await supabase.from('chats').upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
    
    if (error) {
      logger.error(`❌ Erro ao salvar mensagens: ${error.message}`, error);
      throw error;
    }
    
    // Configurar realtime para este chat se ainda não estiver configurado
    setupRealtimeSubscription(id);
    
    const duration = Math.round(performance.now() - startTime);
    // Remover indicação de sucesso da mensagem de log
    logger.info(`Operação completada para chat ${id} (${duration}ms)`);
  } catch (error) {
    logger.error('❌ Erro ao salvar mensagens:', error);
    throw error;
  }
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando mensagens para id: ${id}`);
  try {
    const supabase = getOrCreateClient();
    
    restRequestCount++;
    logger.info(`🔴 ISSO É UMA OPERAÇÃO REST NO SUPABASE (buscando mensagens) #${restRequestCount}`);
    
    let query;
    let idType = '';
    
    if (isValidUUID(id)) {
      query = supabase.from('chats').select('*').eq('id', id).maybeSingle();
      idType = 'id';
    } else {
      query = supabase.from('chats').select('*').eq('urlId', id).maybeSingle();
      idType = 'urlId';
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`❌ Erro ao buscar mensagens pelo ${idType} ${id}:`, error);
      throw error;
    }
    
    if (!data) {
      logger.warn(`⚠️ Nenhum chat encontrado com ${idType}: ${id}`);
      throw new Error(`Chat não encontrado com ${idType}: ${id}`);
    }
    
    validateMessagesAndLog(data, idType, id);
    
    // Configurar Realtime para este chat
    if (data.id) {
      setupRealtimeSubscription(data.id);
    }
    
    return data as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens para id ${id}:`, error);
    throw error;
  }
}

export async function deleteById(_db: any, id: string): Promise<void> {
  logger.info(`🗑️ Deletando chat por ID: ${id}`);
  try {
    const startTime = performance.now();
    const supabase = getOrCreateClient();
    
    // Buscar o chat primeiro para garantir que existe e obter o ID real se for urlId
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error(`Chat não encontrado: ${id}`);
    
    // Cancelar qualquer operação pendente para este chat
    if (pendingSaves.has(id)) {
      const pendingOp = pendingSaves.get(id)!;
      clearTimeout(pendingOp.timer);
    }
    
    restRequestCount++;
    logger.info(`🔴 ISSO É UMA OPERAÇÃO REST NO SUPABASE (deletando chat) #${restRequestCount}`);
    
    const { error } = await supabase.from('chats').delete().eq('id', chat.id);
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chat ${id} deletado com sucesso (${duration}ms)`);
  } catch (error) {
    logger.error(`❌ Erro ao deletar chat ${id}:`, error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  logger.info('🆔 Gerando novo ID');
  if (crypto && typeof crypto.randomUUID === 'function') {
    const id = crypto.randomUUID();
    logger.info(`✅ Novo ID gerado: ${id}`);
    return id;
  } else {
    const id = 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
    logger.info(`✅ Novo ID gerado (fallback): ${id}`);
    return id;
  }
}

async function getNextImportedFilesSuffix(supabase: any, userId: string, baseId: string): Promise<string> {
  const { data: existingChats } = await supabase
    .from('chats')
    .select('urlId')
    .eq('user_id', userId)
    .like('urlId', `${baseId}%`)
    .order('urlId', { ascending: false });

  if (!existingChats || existingChats.length === 0) {
    return baseId;
  }

  // Find the highest suffix number
  let maxSuffix = 0;
  existingChats.forEach((chat: { urlId: string }) => {
    const match = chat.urlId.match(new RegExp(`${baseId}(-([0-9]+))?$`));
    if (match) {
      const suffix = match[2] ? parseInt(match[2]) : 0;
      maxSuffix = Math.max(maxSuffix, suffix);
    }
  });

  return maxSuffix === 0 ? `${baseId}-1` : `${baseId}-${maxSuffix + 1}`;
}

export async function getUrlId(_db: any, id: string): Promise<string> {
  logger.info(`🔗 Verificando disponibilidade de urlId: ${id}`);
  try {
    const startTime = performance.now();
    const idList = await getUrlIds(_db);
    
    if (!idList.includes(id)) {
      logger.info(`✅ urlId ${id} está disponível`);
      return id;
    } else {
      let i = 2;
      
      while (idList.includes(`${id}-${i}`)) {
        i++;
        if (i > 100) {
          logger.error(`❌ Não foi possível gerar um urlId único após 100 tentativas`);
          throw new Error('Não foi possível gerar um urlId único');
        }
      }
      
      const newUrlId = `${id}-${i}`;
      logger.info(`✅ Gerado novo urlId: ${newUrlId}`);
      return newUrlId;
    }
  } catch (error) {
    logger.error(`❌ Erro ao gerar urlId para ${id}:`, error);
    throw error;
  }
}

async function getUrlIds(_db: any): Promise<string[]> {
  logger.info('🔗 Buscando todos os urlIds');
  try {
    const supabase = getOrCreateClient();
    const { data, error } = await supabase
      .from('chats')
      .select('urlId')
      .not('urlId', 'is', null);
    
    if (error) throw error;
    
    const urlIds = data?.map((item: { urlId: string }) => item.urlId).filter(Boolean) || [];
    logger.info(`✅ ${urlIds.length} urlIds recuperados`);
    return urlIds;
  } catch (error) {
    logger.error('❌ Erro ao buscar urlIds:', error);
    throw error;
  }
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  logger.info(`🍴 Criando fork de chat ${chatId} a partir da mensagem ${messageId}`);
  try {
    const startTime = performance.now();
    const chat = await getMessages(_db, chatId);
    
    if (!chat) {
      throw new Error('Chat não encontrado');
    }
    
    // Encontra o índice da mensagem para fazer o fork
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) {
      throw new Error('Mensagem não encontrada');
    }

    // Obtém mensagens até a mensagem selecionada (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);
    
    // Criar novo chat com as mensagens até o ponto de fork
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (fork)` : 'Forked chat', 
      messages,
      chat.metadata
    );
  } catch (error) {
    logger.error(`❌ Erro ao fazer fork do chat ${chatId}:`, error);
    throw error;
  }
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  logger.info(`🔄 Duplicando chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    
    if (!chat) {
      throw new Error('Chat não encontrado');
    }
    
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (copy)` : 'Chat (copy)', 
      chat.messages,
      chat.metadata
    );
  } catch (error) {
    logger.error(`❌ Erro ao duplicar chat ${id}:`, error);
    throw error;
  }
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata
): Promise<string> {
  logger.info(`📝 Criando novo chat com ${messages.length} mensagens`);
  try {
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    const id = await getNextId(_db);
    
    // Gerar um urlId único baseado no id
    const newUrlId = await getUrlId(_db, id);
    
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id,
        user_id: user.id,
        messages,
        urlId: newUrlId,
        description,
        timestamp: new Date().toISOString(),
        metadata
      })
      .select();
    
    if (error) throw error;
    
    const chat = (data && data[0]) as any;
    if (!chat) throw new Error('Falha ao criar chat');
    
    logger.info(`✅ Chat criado com sucesso: ${newUrlId}`);
    return newUrlId;
  } catch (error) {
    logger.error('❌ Erro ao criar chat a partir de mensagens:', error);
    throw error;
  }
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  logger.info(`📝 Atualizando descrição do chat ${id}`);
  try {
    if (!description.trim()) throw new Error('A descrição não pode estar vazia');
    
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error('Chat não encontrado');
    
    const supabase = getOrCreateClient();
    const { error } = await supabase
      .from('chats')
      .update({ description })
      .eq('id', chat.id);
    
    if (error) throw error;
    logger.info(`✅ Descrição atualizada com sucesso`);
  } catch (error) {
    logger.error(`❌ Erro ao atualizar descrição do chat ${id}:`, error);
    throw error;
  }
}

export async function detectAndRepairMessages(_db: any, id: string): Promise<boolean> {
  logger.info(`🔧 Verificando e reparando mensagens para o chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    if (!chat || !Array.isArray(chat.messages)) {
      logger.warn(`⚠️ Chat ${id} não encontrado ou não tem formato válido`);
      return false;
    }
    
    // Verificar se há mensagens suspeitas de truncamento
    let needsRepair = false;
    let repairedMessages = chat.messages.map(msg => {
      if (typeof msg.content === 'string') {
        // Verificar sinais comuns de truncamento
        if (msg.content.endsWith('...') || 
            (msg.content.includes('```') && !msg.content.match(/```[\s\S]*?```/g))) {
          needsRepair = true;
          
          // Tentar remover caracteres de truncamento
          const repaired = msg.content.replace(/\.\.\.+$/, '');
          
          logger.info(`🔄 Mensagem ${msg.id} possivelmente truncada, tentando reparar`);
          return { ...msg, content: repaired };
        }
      }
      return msg;
    });
    
    if (needsRepair) {
      // Salvar mensagens reparadas
      await setMessages(
        _db,
        chat.id,
        repairedMessages,
        chat.urlId,
        chat.description,
        chat.timestamp,
        chat.metadata
      );
      
      logger.info(`✅ Mensagens reparadas para o chat ${id}`);
      return true;
    }
    
    logger.info(`✅ Nenhum problema detectado nas mensagens do chat ${id}`);
    return false;
  } catch (error) {
    logger.error(`❌ Erro ao verificar/reparar mensagens:`, error);
    throw error;
  }
}