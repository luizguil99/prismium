import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai';
import { BaseProvider } from '~/lib/modules/llm/base-provider';

/**
 * Provider do Dify para integração com o sistema de LLM
 * Gerencia configurações e modelos disponíveis
 */
export default class DifyProvider extends BaseProvider {
  name = 'Dify';
  getApiKeyLink = 'https://cloud.dify.ai/settings/api-keys';

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
      throw new Error('API key not found for Dify');
    }

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
            conversation_id: '',
            user: 'user'
          })
        });

        if (!response.ok || !response.body) {
          throw new Error(`Dify API error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const stream = new ReadableStream<LanguageModelV1StreamPart>({
          async start(controller) {
            let buffer = '';
            let completionTokens = 0;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.trim() === '') continue;
                if (!line.startsWith('data: ')) continue;

                const data = JSON.parse(line.slice(6));
                if (data.event === 'message') {
                  completionTokens += 1;
                  controller.enqueue({
                    type: 'text-delta',
                    textDelta: data.answer
                  });
                }
              }
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
      }
    };
  }
}
