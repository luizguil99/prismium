import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai';

function extractPromptText(prompt: any): string {
  // Se for uma string simples, retorna ela diretamente
  if (typeof prompt === 'string') return prompt;
  
  // Se for um array de mensagens
  if (Array.isArray(prompt)) {
    // Pega apenas a última mensagem do usuário
    const lastMessage = prompt[prompt.length - 1];
    if (lastMessage && typeof lastMessage === 'object') {
      if (Array.isArray(lastMessage.content)) {
        return lastMessage.content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part.type === 'text') return part.text;
            return '';
          })
          .join('');
      }
      return String(lastMessage.content || '');
    }
    return String(lastMessage || '');
  }

  // Se for um objeto de mensagem
  if (typeof prompt === 'object') {
    if (Array.isArray(prompt.messages)) {
      // Pega a última mensagem do array
      const lastMessage = prompt.messages[prompt.messages.length - 1];
      return extractPromptText(lastMessage);
    }
    
    if (Array.isArray(prompt.content)) {
      return prompt.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part.type === 'text') return part.text;
          return '';
        })
        .join('');
    }
    
    if (prompt.content) return String(prompt.content);
  }

  // Se nada funcionar, converte para string
  return String(prompt);
}

function createDify(config: { apiKey: string; baseUrl?: string }) {
  // Mantém o estado da conversa
  let currentConversationId = '';
  let messageHistory: Array<{role: string, content: string}> = [];

  return (model: string): LanguageModelV1 => ({
    specificationVersion: 'v1',
    provider: 'Dify',
    modelId: model,
    defaultObjectGenerationMode: 'streaming' as const,
    supportedObjectGenerationModes: ['streaming'] as const,
    supportedStreamingModes: ['text-delta'] as const,

    async doGenerate(options: LanguageModelV1CallOptions) {
      try {
        const promptText = extractPromptText(options.prompt);
        console.log('Dify doGenerate - Texto extraído:', promptText);
        
        // Adiciona a mensagem ao histórico
        messageHistory.push({ role: 'user', content: promptText });
        
        const response = await fetch(`${config.baseUrl || 'https://api.dify.ai/v1'}/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {},
            query: promptText,
            response_mode: "blocking",
            conversation_id: currentConversationId,
            user: `user-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na requisição: ' + response.statusText);
        }

        const data = await response.json() as { 
          answer?: string;
          conversation_id?: string;
          message_id?: string;
          metadata?: {
            usage?: {
              total_tokens?: number;
              prompt_tokens?: number;
              completion_tokens?: number;
            }
          }
        };

        // Atualiza o ID da conversa
        if (data.conversation_id) {
          currentConversationId = data.conversation_id;
        }

        // Adiciona a resposta ao histórico
        if (data.answer) {
          messageHistory.push({ role: 'assistant', content: data.answer });
        }

        return {
          text: data.answer || '',
          finishReason: 'stop',
          usage: {
            promptTokens: data.metadata?.usage?.prompt_tokens || 0,
            completionTokens: data.metadata?.usage?.completion_tokens || 0,
            totalTokens: data.metadata?.usage?.total_tokens || 0
          },
          rawCall: { rawPrompt: options.prompt, rawSettings: {} }
        };
      } catch (error) {
        console.error('Dify error:', error);
        throw error;
      }
    },

    async doStream(options: LanguageModelV1CallOptions) {
      const stream = new TransformStream<string, LanguageModelV1StreamPart>();
      const writer = stream.writable.getWriter();

      try {
        const promptText = extractPromptText(options.prompt);
        console.log('Dify doStream - Texto extraído:', promptText);

        // Adiciona a mensagem ao histórico
        messageHistory.push({ role: 'user', content: promptText });

        const response = await fetch(`${config.baseUrl || 'https://api.dify.ai/v1'}/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {},
            query: promptText,
            response_mode: "streaming",
            conversation_id: currentConversationId,
            user: `user-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na requisição: ' + response.statusText);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        let buffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Adiciona a resposta completa ao histórico
            messageHistory.push({ role: 'assistant', content: fullResponse });
            writer.close();
            break;
          }

          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;

            try {
              const data = JSON.parse(line.slice(5)) as { 
                event: string; 
                answer?: string;
                message_id?: string;
                conversation_id?: string;
              };
              
              if (data.answer && data.answer.trim()) {
                // Atualiza o ID da conversa
                if (data.conversation_id) {
                  currentConversationId = data.conversation_id;
                }

                fullResponse += data.answer;
                
                const streamPart: LanguageModelV1StreamPart = {
                  type: 'text-delta',
                  textDelta: data.answer
                };
                
                await writer.write(streamPart);
                console.log('Dify doStream - Chunk enviado:', {
                  streamPart,
                  messageId: data.message_id,
                  conversationId: data.conversation_id
                });
              }
            } catch (error) {
              console.error('Error processing SSE message:', error);
            }
          }
        }
      } catch (error) {
        console.error('Dify streaming error:', error);
        writer.close();
        throw error;
      }

      return {
        stream: stream.readable,
        rawCall: {
          rawPrompt: options.prompt,
          rawSettings: {}
        }
      };
    }
  });
}

export default class DifyProvider extends BaseProvider {
  name = 'Dify';
  getApiKeyLink = 'https://cloud.dify.ai/settings/api-keys';

  config = {
    apiTokenKey: 'DIFY_API_KEY',
    baseUrlKey: 'DIFY_API_URL',
    baseUrl: 'https://api.dify.ai/v1'
  };

  staticModels: ModelInfo[] = [
    {
      name: 'dify-default',
      label: 'Dify Default',
      provider: 'Dify',
      maxTokenAllowed: 4096
    }
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys: options.apiKeys,
      providerSettings: options.providerSettings?.[this.name],
      serverEnv: options.serverEnv as any,
      defaultBaseUrlKey: 'DIFY_API_URL',
      defaultApiTokenKey: 'DIFY_API_KEY'
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const dify = createDify({
      apiKey,
      baseUrl: baseUrl || this.config.baseUrl
    });

    return dify(options.model);
  }
}
