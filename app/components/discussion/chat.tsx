import { useState, useRef, useEffect } from "react";
import { Button } from "~/../@/components/ui/ui/button";
import { Input } from "~/../@/components/ui/ui/input";
import { classNames } from "~/utils/classNames";
import { Send, Bot, Plus, Search, Loader2, StopCircle, Paperclip, Stars, X } from "lucide-react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (message: string, context?: { images?: string[]; files?: File[] }) => void;
  isLoading?: boolean;
  onStop?: () => void;
}

const TEXTAREA_MIN_HEIGHT = 76;
const TEXTAREA_MAX_HEIGHT = 200;

export function Chat({ messages = [], onSendMessage, isLoading = false, onStop }: ChatProps) {
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageDataList, setImageDataList] = useState<string[]>([]);
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    // Prepara o contexto com imagens se houver
    const context = {
      images: imageDataList,
      files: uploadedFiles,
    };

    // Envia a mensagem com o contexto
    onSendMessage?.(input, context);
    setInput("");
    
    // Limpa as imagens após enviar
    setImageDataList([]);
    setUploadedFiles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Image = e.target?.result as string;
          setUploadedFiles(prev => [...prev, file]);
          setImageDataList(prev => [...prev, base64Image]);
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles(prev => [...prev, file]);
            setImageDataList(prev => [...prev, base64Image]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const enhancePrompt = () => {
    setEnhancingPrompt(true);
    setTimeout(() => {
      setEnhancingPrompt(false);
      toast.success('Prompt aprimorado!');
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {messages.map((message, i) => (
          <div
            key={i}
            className={classNames(
              "flex gap-3 max-w-3xl mx-auto group animate-in slide-in-from-bottom-2 duration-300 ease-out",
              {
                "justify-start": message.role === "assistant",
                "justify-end": message.role === "user"
              }
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-md bg-zinc-900/80 flex items-center justify-center ring-1 ring-zinc-800">
                <Bot className="h-5 w-5 text-zinc-400" />
              </div>
            )}
            <div 
              className={classNames(
                "relative rounded-2xl px-4 py-3 text-sm leading-relaxed break-words",
                message.role === "assistant" 
                  ? "bg-zinc-900/80 text-zinc-100 max-w-2xl ring-1 ring-zinc-800" 
                  : "bg-[#2563EB] text-[#FAFAFA] max-w-xl"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input área */}
      <div className="border-t border-zinc-800/50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative shadow-lg border border-zinc-800/50 backdrop-blur-lg rounded-xl bg-zinc-900/20 transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/5">
            {imageDataList.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 max-h-32 overflow-y-auto">
                {imageDataList.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-zinc-800"
                    />
                    <button
                      onClick={() => {
                        setImageDataList(prev => prev.filter((_, i) => i !== index));
                        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 p-1 bg-zinc-900/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Como posso ajudar você hoje?"
              className="w-full pl-6 pt-4 pr-16 outline-none resize-none text-zinc-200 placeholder-zinc-500 bg-transparent text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30"
              style={{
                minHeight: TEXTAREA_MIN_HEIGHT,
                maxHeight: TEXTAREA_MAX_HEIGHT,
              }}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center text-sm p-4 pt-2">
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200"
                  onClick={handleFileUpload}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={classNames(
                    "p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200",
                    enhancingPrompt ? "opacity-50" : ""
                  )}
                  onClick={enhancePrompt}
                  disabled={input.length === 0 || enhancingPrompt}
                >
                  <Stars className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {input.length > 3 && (
                <div className="text-xs text-zinc-500">
                  Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-900/50 border border-zinc-800/50">Shift</kbd> +{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900/50 border border-zinc-800/50">Enter</kbd> para nova linha
                </div>
              )}
            </div>
            <div className="absolute right-4 top-4">
              {isLoading ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onStop}
                  className="hover:bg-zinc-800 bg-transparent group"
                >
                  <StopCircle className="h-4 w-4 text-zinc-400 group-hover:text-[#EF4444]" />
                </Button>
              ) : (
                <Button 
                  variant="ghost"
                  size="icon" 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-transparent hover:bg-[#2563EB] transition-colors disabled:opacity-50 group"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 text-zinc-400 group-hover:text-[#FAFAFA]" />
                  )}
                </Button>
              )}
            </div>
          </div>
          {isLoading && (
            <div className="text-xs text-zinc-500 mt-2 text-center animate-pulse">
              Gerando resposta...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
