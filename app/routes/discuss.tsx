import { useState } from "react";
import { Chat } from "~/components/discussion/chat";
import { Sidebar } from "~/components/discussion/sidebar";
import { Header } from "~/components/discussion/header";
import { LLMManager } from "~/lib/modules/llm/manager";
import { toast } from "react-toastify";
import { generateId } from "~/utils/fileUtils";
import type { KeyboardEvent, ChangeEvent } from "react";
import type { Env } from "~/types/env";
import type { LanguageModelV1, LanguageModelV1CallOptions } from "ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

const DEFAULT_ENV: Record<string, string> = {
  ANTHROPIC_API_KEY: import.meta.env.ANTHROPIC_API_KEY as string || "",
  OPENAI_API_KEY: import.meta.env.OPENAI_API_KEY as string || "",
  GROQ_API_KEY: import.meta.env.GROQ_API_KEY as string || "",
  MISTRAL_API_KEY: import.meta.env.MISTRAL_API_KEY as string || "",
  PERPLEXITY_API_KEY: import.meta.env.PERPLEXITY_API_KEY as string || "",
  TOGETHER_API_KEY: import.meta.env.TOGETHER_API_KEY as string || "",
  GOOGLE_API_KEY: import.meta.env.GOOGLE_API_KEY as string || "",
  GOOGLE_CSE_ID: import.meta.env.GOOGLE_CSE_ID as string || "",
  SERPER_API_KEY: import.meta.env.SERPER_API_KEY as string || "",
  SERPAPI_API_KEY: import.meta.env.SERPAPI_API_KEY as string || "",
  BROWSERLESS_API_KEY: import.meta.env.BROWSERLESS_API_KEY as string || "",
  BING_API_KEY: import.meta.env.BING_API_KEY as string || "",
  BING_ENDPOINT: import.meta.env.BING_ENDPOINT as string || "",
  AZURE_API_KEY: import.meta.env.AZURE_API_KEY as string || "",
  AZURE_ENDPOINT: import.meta.env.AZURE_ENDPOINT as string || "",
  AZURE_DEPLOYMENT_NAME: import.meta.env.AZURE_DEPLOYMENT_NAME as string || "",
  AZURE_API_VERSION: import.meta.env.AZURE_API_VERSION as string || "",
  HuggingFace_API_KEY: import.meta.env.HuggingFace_API_KEY as string || "",
  OPEN_ROUTER_API_KEY: import.meta.env.OPEN_ROUTER_API_KEY as string || "",
  OLLAMA_API_BASE_URL: import.meta.env.OLLAMA_API_BASE_URL as string || "",
  OPENAI_LIKE_API_KEY: import.meta.env.OPENAI_LIKE_API_KEY as string || "",
  OPENAI_LIKE_API_BASE_URL: import.meta.env.OPENAI_LIKE_API_BASE_URL as string || "",
  TOGETHER_API_BASE_URL: import.meta.env.TOGETHER_API_BASE_URL as string || "",
  DEEPSEEK_API_KEY: import.meta.env.DEEPSEEK_API_KEY as string || "",
  LMSTUDIO_API_BASE_URL: import.meta.env.LMSTUDIO_API_BASE_URL as string || "",
  GOOGLE_GENERATIVE_AI_API_KEY: import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY as string || "",
  XAI_API_KEY: import.meta.env.XAI_API_KEY as string || "",
  AWS_BEDROCK_CONFIG: import.meta.env.AWS_BEDROCK_CONFIG as string || "",
  DEFAULT_NUM_CTX: "4096"
};

export default function DiscussPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("claude-3-sonnet");
  const [selectedProvider, setSelectedProvider] = useState("Anthropic");

  const handleSendMessage = async (message: string, context?: { images?: string[]; files?: File[]; usePrompt?: boolean }) => {
    console.log('[discuss] Iniciando handleSendMessage');
    console.log('[discuss] Contexto recebido:', context);
    
    if (!selectedProvider || !selectedModel) {
      toast.error("Selecione um provedor e modelo primeiro");
      return;
    }

    try {
      setIsLoading(true);
      
      // Cria uma nova mensagem com ID
      const newMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message
      };

      const newMessages = [...messages, newMessage];
      setMessages(newMessages);

      // Prepara os dados para enviar para a API
      const payload = {
        messages: newMessages.map(msg => ({
          ...msg,
          content: msg.id === newMessage.id 
            ? `[Model: ${selectedModel}]\n\n[Provider: ${selectedProvider}]\n\n${msg.content}`
            : msg.content
        })),
        files: context?.files || {},
        contextOptimization: true,
        usePrompt: context?.usePrompt // Passa o flag usePrompt para a API
      };

      console.log('[discuss] Payload a ser enviado:', payload);

      // Envia a requisição para a API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      // Processa a resposta em streaming
      const reader = response.body?.getReader();
      let accumulatedResponse = '';
      let currentAssistantMessage: ChatMessage | null = null;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream finalizado. Resposta acumulada:', accumulatedResponse);
              break;
            }

            // Decodifica o chunk recebido
            const chunk = new TextDecoder().decode(value);
            console.log('Chunk recebido:', chunk);
            
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim() === '') continue;

              try {
                // Extrai o conteúdo após os números iniciais (ex: 0:", 2:", etc)
                const match = line.match(/^\d+:(.+)$/);
                if (match) {
                  const content = match[1];
                  const data = JSON.parse(content);

                  // Se for um array, processa cada item
                  if (Array.isArray(data)) {
                    data.forEach(item => {
                      if (item.type === 'progress') {
                        console.log('Progresso:', item.message);
                      }
                    });
                  } 
                  // Se for texto direto
                  else if (typeof data === 'string') {
                    accumulatedResponse += data;
                    
                    // Se não tiver mensagem do assistente, cria uma nova
                    if (!currentAssistantMessage) {
                      currentAssistantMessage = {
                        id: generateId(),
                        role: 'assistant',
                        content: accumulatedResponse
                      };
                      setMessages(prev => [...prev, currentAssistantMessage!]);
                    } else {
                      // Atualiza a mensagem existente
                      setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.role === 'assistant') {
                          return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, content: accumulatedResponse }
                          ];
                        }
                        return prev;
                      });
                    }
                  }
                }
              } catch (e) {
                // Se não for JSON válido, pode ser texto direto
                if (line.startsWith('0:"')) {
                  const textContent = line.slice(3, -1); // Remove 0:" e "
                  accumulatedResponse += textContent;
                  
                  // Atualiza a mensagem
                  if (!currentAssistantMessage) {
                    currentAssistantMessage = {
                      id: generateId(),
                      role: 'assistant',
                      content: accumulatedResponse
                    };
                    setMessages(prev => [...prev, currentAssistantMessage!]);
                  } else {
                    setMessages(prev => {
                      const lastMessage = prev[prev.length - 1];
                      if (lastMessage?.role === 'assistant') {
                        return [
                          ...prev.slice(0, -1),
                          { ...lastMessage, content: accumulatedResponse }
                        ];
                      }
                      return prev;
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Erro durante o streaming:', e);
        } finally {
          reader.releaseLock();
        }
      }

    } catch (error) {
      console.error('[discuss] Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      const envVars: Record<string, string> = {
        DEFAULT_NUM_CTX: "4096",
        ANTHROPIC_API_KEY: import.meta.env.ANTHROPIC_API_KEY?.toString() || "",
        OPENAI_API_KEY: import.meta.env.OPENAI_API_KEY?.toString() || "",
        GROQ_API_KEY: import.meta.env.GROQ_API_KEY?.toString() || "",
        MISTRAL_API_KEY: import.meta.env.MISTRAL_API_KEY?.toString() || "",
        PERPLEXITY_API_KEY: import.meta.env.PERPLEXITY_API_KEY?.toString() || "",
        TOGETHER_API_KEY: import.meta.env.TOGETHER_API_KEY?.toString() || "",
        GOOGLE_API_KEY: import.meta.env.GOOGLE_API_KEY?.toString() || "",
        GOOGLE_CSE_ID: import.meta.env.GOOGLE_CSE_ID?.toString() || "",
        SERPER_API_KEY: import.meta.env.SERPER_API_KEY?.toString() || "",
        SERPAPI_API_KEY: import.meta.env.SERPAPI_API_KEY?.toString() || "",
        BROWSERLESS_API_KEY: import.meta.env.BROWSERLESS_API_KEY?.toString() || "",
        BING_API_KEY: import.meta.env.BING_API_KEY?.toString() || "",
        BING_ENDPOINT: import.meta.env.BING_ENDPOINT?.toString() || "",
        AZURE_API_KEY: import.meta.env.AZURE_API_KEY?.toString() || "",
        AZURE_ENDPOINT: import.meta.env.AZURE_ENDPOINT?.toString() || "",
        AZURE_DEPLOYMENT_NAME: import.meta.env.AZURE_DEPLOYMENT_NAME?.toString() || "",
        AZURE_API_VERSION: import.meta.env.AZURE_API_VERSION?.toString() || "",
        HuggingFace_API_KEY: import.meta.env.HuggingFace_API_KEY?.toString() || "",
        OPEN_ROUTER_API_KEY: import.meta.env.OPEN_ROUTER_API_KEY?.toString() || "",
        OLLAMA_API_BASE_URL: import.meta.env.OLLAMA_API_BASE_URL?.toString() || "",
        OPENAI_LIKE_API_KEY: import.meta.env.OPENAI_LIKE_API_KEY?.toString() || "",
        OPENAI_LIKE_API_BASE_URL: import.meta.env.OPENAI_LIKE_API_BASE_URL?.toString() || "",
        TOGETHER_API_BASE_URL: import.meta.env.TOGETHER_API_BASE_URL?.toString() || "",
        DEEPSEEK_API_KEY: import.meta.env.DEEPSEEK_API_KEY?.toString() || "",
        LMSTUDIO_API_BASE_URL: import.meta.env.LMSTUDIO_API_BASE_URL?.toString() || "",
        GOOGLE_GENERATIVE_AI_API_KEY: import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY?.toString() || "",
        XAI_API_KEY: import.meta.env.XAI_API_KEY?.toString() || "",
        AWS_BEDROCK_CONFIG: import.meta.env.AWS_BEDROCK_CONFIG?.toString() || ""
      };

      const llmManager = LLMManager.getInstance(envVars);
      const provider = llmManager.getProvider(selectedProvider);
      
      if (provider) {
        const model = provider.getModelInstance({
          model: selectedModel,
          serverEnv: envVars,
        });
        
        if (model && typeof (model as any).cancel === 'function') {
          await (model as any).cancel();
        }
      }
    } catch (error) {
      console.error('Erro ao parar geração:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#09090B] text-[#E2E2E2]">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
      />

      {/* Área principal */}
      <div className="flex flex-1 flex-col">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          selectedProvider={selectedProvider}
          onSelectProvider={setSelectedProvider}
        />
        <Chat 
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
