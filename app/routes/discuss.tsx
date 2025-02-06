import { useState } from "react";
import { Chat } from "~/components/discussion/chat";
import { Sidebar } from "~/components/discussion/sidebar";
import { Header } from "~/components/discussion/header";
import { LLMManager } from "~/lib/modules/llm/manager";
import { toast } from "react-toastify";
import type { KeyboardEvent, ChangeEvent } from "react";
import type { Env } from "~/types/env";
import type { LanguageModelV1, LanguageModelV1CallOptions } from "ai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

  const handleSendMessage = async (message: string, context?: { images?: string[]; files?: File[] }) => {
    try {
      setIsLoading(true);
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: message }
      ];
      setMessages(newMessages);

      // Inicializa o LLM Manager
      const llmManager = LLMManager.getInstance(DEFAULT_ENV);
      const provider = llmManager.getProvider(selectedProvider);

      if (!provider) {
        throw new Error("Provider não encontrado");
      }

      // Envia a mensagem para o provider
      const model = provider.getModelInstance({
        model: selectedModel,
        serverEnv: DEFAULT_ENV,
      });

      // Formata o histórico de mensagens
      const formattedMessages = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Adiciona o contexto do sistema
      const systemMessage = {
        role: "system" as const,
        content: "Você é um assistente prestativo e amigável. Responda em português brasileiro de forma clara e concisa."
      };

      // Prepara o prompt no formato do LLM
      const prompt: LanguageModelV1CallOptions = {
        inputFormat: "messages",
        mode: {
          type: "regular"
        },
        prompt: [systemMessage, ...formattedMessages],
        providerMetadata: {
          temperature: "0.7",
          maxTokens: "1000"
        }
      };

      const response = await model.doGenerate(prompt);
      const content = response.text || response.toString();

      setMessages([
        ...newMessages,
        { role: "assistant", content }
      ]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      const llmManager = LLMManager.getInstance(DEFAULT_ENV);
      const provider = llmManager.getProvider(selectedProvider);
      
      if (provider) {
        const model = provider.getModelInstance({
          model: selectedModel,
          serverEnv: DEFAULT_ENV,
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
