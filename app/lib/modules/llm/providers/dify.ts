import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DifyProvider');

/**
 * Provider do Dify para integração com o sistema de LLM
 * Gerencia configurações e modelos disponíveis
 */
export default class DifyProvider extends BaseProvider {
  name = 'Dify';
  getApiKeyLink = 'https://cloud.dify.ai/settings/api-keys';
  private conversationId: string = '';

  // Configurações base do provider
  config = {
    apiTokenKey: 'DIFY_API_KEY',
    baseUrl: 'https://api.dify.ai/v1'
  };

  // Modelos disponíveis
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
      providerSettings: options.providerSettings,
      serverEnv: options.serverEnv,
      defaultBaseUrlKey: 'DIFY_BASE_URL',
      defaultApiTokenKey: 'DIFY_API_KEY'
    });

    if (!apiKey) {
      logger.error('API key not found');
      throw new Error('API key not found for Dify');
    }

    // Tenta recuperar o conversation_id do localStorage
    try {
      this.conversationId = localStorage.getItem('dify_conversation_id') || '';
      logger.info('Inicializando Dify provider', { 
        conversationId: this.conversationId,
        baseUrl,
        hasApiKey: !!apiKey 
      });
    } catch (error) {
      logger.error('Erro ao recuperar conversation_id:', error);
    }

    const self = this;

    return {
      specificationVersion: 'v1',
      provider: 'dify',
      modelId: options.model,
      defaultObjectGenerationMode: 'json',
      doGenerate: async () => {
        throw new Error('Not implemented');
      },
      doStream: async (options: LanguageModelV1CallOptions) => {
        const prompt = options.prompt || '';
        logger.info('Enviando requisição para Dify:', { 
          prompt, 
          conversationId: self.conversationId,
          url: `${baseUrl}/chat-messages`
        });

        try {
          const response = await fetch(`${baseUrl}/chat-messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              inputs: {},
              query: prompt,
              response_mode: 'streaming',
              conversation_id: self.conversationId,
              user: 'luiz'
            })
          });

          logger.info('Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });

          if (!response.ok || !response.body) {
            const errorText = await response.text();
            logger.error('Erro na API do Dify:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            throw new Error(`Dify API error (${response.status}): ${errorText || response.statusText}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          const stream = new ReadableStream<LanguageModelV1StreamPart>({
            async start(controller) {
              let buffer = '';
              let completionTokens = 0;
              let accumulatedAnswer = '';
              
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    logger.info('Stream finalizado. Resposta completa:', accumulatedAnswer);
                    break;
                  }

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (!line.startsWith('data: ')) continue;

                    try {
                      const data = JSON.parse(line.slice(6));
                      logger.debug('Chunk recebido:', data);

                      if (data.event === 'agent_message' && data.answer) {
                        completionTokens += 1;
                        accumulatedAnswer += data.answer;
                        console.log('🤖 Dify Answer:', data.answer);
                        controller.enqueue({
                          type: 'text-delta',
                          textDelta: data.answer
                        });
                      }
                      // Salva o conversation_id quando disponível
                      if (data.conversation_id && !self.conversationId) {
                        self.conversationId = data.conversation_id;
                        localStorage.setItem('dify_conversation_id', data.conversation_id);
                        logger.info('Novo conversation_id salvo:', data.conversation_id);
                      }
                    } catch (e) {
                      logger.error('Erro ao processar chunk:', e);
                    }
                  }
                }
              } catch (error) {
                logger.error('Erro durante o streaming:', error);
                throw error;
              }
              
              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                usage: {
                  promptTokens: 0,
                  completionTokens
                }
              });
              controller.close();
            }
          });

          return {
            stream,
            rawCall: {
              rawPrompt: prompt,
              rawSettings: {}
            },
            rawResponse: {
              headers: Object.fromEntries(response.headers.entries())
            }
          };
        } catch (error) {
          logger.error('Erro ao fazer requisição:', error);
          throw error;
        }
      }
    };
  }

  // Método para limpar o conversation_id (útil para iniciar uma nova conversa)
  clearConversation() {
    this.conversationId = '';
    localStorage.removeItem('dify_conversation_id');
    logger.info('Conversation_id limpo');
  }
}
