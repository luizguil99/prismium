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
    baseUrlKey: 'DIFY_API_URL',
    apiTokenKey: 'DIFY_API_KEY',
    baseUrl: 'https://api.dify.ai/v1'
  };

  constructor() {
    super();
  }

  getProviderSettings(): IProviderSetting[] {
    return [
      {
        key: 'Dify',
        name: 'Dify API Key',
        description: 'API Key do Dify',
        required: true,
        type: 'text',
        link: this.getApiKeyLink,
      },
    ];
  }

  getModels(): ModelInfo[] {
    return [
      {
        name: 'dify',
        maxTokens: 4000,
        tokenLimit: 4000,
        supportsFunctions: false,
        supportsVision: false,
      },
    ];
  }

  createLanguageModel(options: LanguageModelV1CallOptions): LanguageModelV1 {
    const dify = (model: string) => ({
      id: model,
      stream: async (prompt: string, options: any): Promise<ReadableStream<LanguageModelV1StreamPart>> => {
        const chunks: Uint8Array[] = [];
        return new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'text', text: 'Dify response will be processed separately' });
            controller.close();
          },
        });
      },
    });

    return dify(options.model);
  }
}
