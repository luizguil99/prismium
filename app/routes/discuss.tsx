import { useState } from "react";
import { Chat } from "~/components/discussion/chat";
import { Sidebar } from "~/components/discussion/sidebar";
import { Header } from "~/components/discussion/header";
import type { KeyboardEvent, ChangeEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DiscussPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("claude-3-sonnet");

  const handleSendMessage = async (message: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: message }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);
    
    // Simular resposta do LLM
    setTimeout(() => {
      setMessages([
        ...newMessages,
        { role: "assistant" as const, content: "Esta é uma resposta simulada do assistente." }
      ]);
      setIsLoading(false);
    }, 1000);
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
        />
        <Chat 
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
