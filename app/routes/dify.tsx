import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

// Interface para as mensagens
interface Message {
  content: string;
  isUser: boolean;
}

// Interface para o formato da resposta do Dify
interface DifyResponse {
  event: string;
  answer?: string;
  conversation_id?: string;
  message_id?: string;
}

// Componente principal do chat
export default function DifyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rola para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para processar as linhas do SSE
  const processSSELine = (line: string): string | null => {
    if (!line.startsWith('data:')) return null;

    try {
      const jsonStr = line.slice(5); // Remove 'data:'
      const data: DifyResponse = JSON.parse(jsonStr);

      // Retorna apenas se for uma mensagem do agente e tiver uma resposta
      if (data.event === 'agent_message' && data.answer) {
        // Armazena o conversation_id se existir
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        return data.answer;
      }
    } catch (error) {
      console.error('Erro ao processar linha SSE:', error);
    }
    return null;
  };

  // Função para enviar mensagem
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !input.trim()) return;

    try {
      setIsProcessing(true);
      // Adiciona mensagem do usuário
      setMessages((prev) => [...prev, { content: input, isUser: true }]);
      setInput('');

      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer app-4BBwXRVvg652KwZjXRoJibOS',
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            inputs: {},
            query: input,
            response_mode: 'streaming',
            user: 'luiz',
            conversation_id: conversationId || undefined
          }),
      });

      if (!response.ok) throw new Error('Erro na requisição: ' + response.statusText);

      const reader = response.body?.getReader();
      let accumulatedResponse = '';

      if (reader) {
        // Adiciona uma mensagem vazia do assistente que será atualizada
        setMessages((prev) => [...prev, { content: '', isUser: false }]);

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('📥 Resposta completa da IA:', accumulatedResponse);
            break;
          }

          // Converte o chunk em texto e adiciona ao buffer
          buffer += new TextDecoder().decode(value);

          // Processa as linhas completas no buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Mantém a última linha incompleta no buffer

          for (const line of lines) {
            const answer = processSSELine(line.trim());
            if (answer !== null) {
              // Acumula a resposta em vez de substituir
              accumulatedResponse += answer;

              // Atualiza a última mensagem com a resposta acumulada
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  content: accumulatedResponse,
                  isUser: false,
                };
                return newMessages;
              });

              // Pequeno delay para tornar a atualização mais suave
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessages((prev) => [
        ...prev,
        {
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
          isUser: false,
        },
      ]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0E14]">
      <div className="max-w-3xl mx-auto w-full p-4 flex-1 flex flex-col">
        <div className="bg-[#1A1F2A]/60 border border-[#2A2F3A]/50 rounded-lg shadow-lg p-6 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-4 text-gray-100">Chat com Dify</h1>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 border border-[#2A2F3A]/50 rounded-lg">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.isUser ? 'bg-blue-500 text-white' : 'bg-[#1A1F2A]/60 border border-[#2A2F3A]/50 text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário */}
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1 p-2 bg-[#1A1F2A]/60 border border-[#2A2F3A]/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              placeholder="Digite sua mensagem..."
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
