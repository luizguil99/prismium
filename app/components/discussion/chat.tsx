import { useState } from "react";
import { Button } from "~/../@/components/ui/ui/button";
import { Input } from "~/../@/components/ui/ui/input";
import { classNames } from "~/utils/classNames";
import { Send, Bot, Plus, Search } from "lucide-react";
import type { KeyboardEvent, ChangeEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export function Chat({ messages = [], onSendMessage, isLoading = false }: ChatProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage?.(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {messages.map((message, i) => (
          <div
            key={i}
            className={classNames(
              "flex gap-3 max-w-3xl mx-auto group",
              {
                "justify-start": message.role === "assistant",
                "justify-end": message.role === "user"
              }
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-md bg-[#18181B] flex items-center justify-center">
                <Bot className="h-5 w-5 text-[#A1A1AA]" />
              </div>
            )}
            <div className={classNames(
              "relative rounded-2xl px-4 py-3 text-sm leading-relaxed",
              message.role === "assistant" 
                ? "bg-[#18181B] text-[#E2E2E2] max-w-2xl" 
                : "bg-[#2563EB] text-[#FAFAFA] max-w-xl"
            )}>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input área */}
      <div className="border-t border-[#1C1C1F] p-4 bg-[#101012]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#18181B] bg-transparent"
            >
              <Plus className="h-4 w-4 text-[#A1A1AA]" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                placeholder="Digite sua mensagem..."
                className="w-full bg-[#18181B] border-[#1C1C1F] text-[#E2E2E2] placeholder:text-[#71717A] focus:ring-[#2563EB] rounded-xl pr-24"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[#27272A] bg-transparent"
                >
                  <Search className="h-4 w-4 text-[#A1A1AA]" />
                </Button>
                <Button 
                  size="icon" 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-transparent hover:bg-[#2563EB] transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#FAFAFA]" />
                </Button>
              </div>
            </div>
          </div>
          {isLoading && (
            <div className="text-xs text-[#A1A1AA] mt-2 text-center">
              Gerando resposta...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
