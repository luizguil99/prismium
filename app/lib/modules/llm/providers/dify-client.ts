import { workbenchStore } from '~/lib/stores/workbench';

interface DifyResponse {
  answer: string;
  conversation_id?: string;
  [key: string]: any;
}

/**
 * Cliente para comunicação com a API do Dify
 * Responsável por enviar mensagens e processar respostas
 */
export class DifyClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.dify.ai/v1';
  private conversationId: string | null = null;

  constructor(apiKey: string = 'app-4BBwXRVvg652KwZjXRoJibOS') {
    this.apiKey = apiKey;
  }

  /**
   * Processa os blocos de código em um texto
   * Extrai e salva cada bloco no workbench
   */
  private async processCodeBlocks(text: string): Promise<void> {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      
      if (code) {
        try {
          const filename = `generated_${Date.now()}.${language === 'javascript' ? 'js' : language}`;
          await workbenchStore.writeFile(filename, code);
          console.log(`✅ Código salvo em ${filename}`);
        } catch (error) {
          console.error('❌ Erro ao salvar código:', error);
        }
      }
    }
  }

  /**
   * Envia uma mensagem para a API do Dify
   * @param prompt Texto da mensagem
   * @param onMessageUpdate Callback para atualizar a UI com a resposta
   */
  public async sendMessage(
    prompt: string,
    onMessageUpdate: (content: string) => void
  ): Promise<void> {
    try {
      console.log('[DifyClient] Iniciando comunicação');
      
      const response = await fetch(`${this.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: prompt,
          response_mode: 'streaming',
          user: 'luizz',
          conversation_id: this.conversationId || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dify - Erro:', errorText);
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      let accumulatedResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Dify - Stream finalizado. Resposta completa:', accumulatedResponse);
          await this.processCodeBlocks(accumulatedResponse);
          break;
        }

        const chunk = new TextDecoder().decode(value);
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              const data = JSON.parse(jsonStr) as DifyResponse;
              
              if (data.answer) {
                accumulatedResponse += data.answer;
                console.log('📨 Dify - Chunk processado:', data.answer);
                
                // Armazena o conversation_id da primeira resposta
                if (data.conversation_id && !this.conversationId) {
                  this.conversationId = data.conversation_id;
                  console.log('💬 Dify - Nova conversa iniciada:', this.conversationId);
                }
                
                // Atualiza o conteúdo da mensagem no chat
                onMessageUpdate(accumulatedResponse);
                
                // Processa blocos de código para cada chunk
                await this.processCodeBlocks(data.answer);
              }
            } catch (e) {
              console.error('❌ Dify - Erro ao processar chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Dify - Erro:', error);
      throw error;
    }
  }
}
