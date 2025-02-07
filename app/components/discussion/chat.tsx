import { useState, useRef, useEffect } from "react";
import { Button } from "~/../@/components/ui/ui/button";
import { Input } from "~/../@/components/ui/ui/input";
import { classNames } from "~/utils/classNames";
import { Send, Bot, Plus, Search, Loader2, StopCircle, Paperclip, Stars, X, Code, ArrowDown } from "lucide-react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { toast } from "react-toastify";
import { DiscussionMarkdown } from './discussion-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (message: string, context?: { images?: string[]; files?: File[]; usePrompt?: boolean }) => void;
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
  const [usePrompt, setUsePrompt] = useState(true);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout>();
  const currentMessageRef = useRef<string>("");

  // Função para verificar se precisa mostrar o botão de scroll
  const checkScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Monitora o scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  // Atualiza o estado do botão quando mensagens mudam
  useEffect(() => {
    checkScroll();
  }, [displayMessages]);

  // Atualiza as mensagens quando recebe novas
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayMessages([]);
      return;
    }

    // Se for uma nova mensagem do assistente
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // Mantém todas as mensagens anteriores
      const previousMessages = messages.slice(0, -1);
      setDisplayMessages([
        ...previousMessages,
        {
          ...lastMessage,
          content: currentMessageRef.current || lastMessage.content
        }
      ]);
    } else {
      setDisplayMessages(messages);
    }
  }, [messages]);

  // Atualiza o texto atual quando recebe chunks
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      currentMessageRef.current = lastMessage.content;
      
      // Atualiza o display com um pequeno delay para suavizar
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      streamTimeoutRef.current = setTimeout(() => {
        setDisplayMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: currentMessageRef.current
            };
          }
          return newMessages;
        });
      }, 50); // Ajuste este delay conforme necessário
    }
  }, [messages]);

  // Limpa o timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    console.log('[chat] Estado do usePrompt antes de enviar:', usePrompt);

    // Prepara o contexto com imagens se houver
    const context = {
      images: imageDataList,
      files: uploadedFiles,
      usePrompt // Inclui o estado do toggle no contexto
    };

    console.log('[chat] Enviando contexto:', context);

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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090B]">
      {/* Área de mensagens */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-[#09090B]"
      >
        <div className="max-w-3xl w-full mx-auto space-y-8">
          {displayMessages.map((message, i) => (
            <div
              key={i}
              className={classNames(
                "flex gap-4 group",
                message.role === "assistant" && i === displayMessages.length - 1
                  ? "animate-in slide-in-from-bottom-2 duration-300 ease-out"
                  : "",
                {
                  "justify-start": message.role === "assistant",
                  "justify-end": message.role === "user"
                }
              )}
            >
              <div 
                className={classNames(
                  "relative px-6 py-4 text-sm leading-relaxed break-words",
                  message.role === "assistant" 
                    ? "text-zinc-100 max-w-[calc(100%-2rem)]" 
                    : "bg-[#2563EB] text-[#FAFAFA] max-w-[85%] rounded-2xl"
                )}
              >
                {message.role === "assistant" ? (
                  <DiscussionMarkdown content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap text-zinc-100 text-[16px] leading-7">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Botão de scroll to bottom */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-32 right-8 p-2 bg-zinc-800/90 hover:bg-zinc-700/90 rounded-full shadow-lg transition-all duration-200 text-zinc-400 hover:text-zinc-200 z-50"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Input área */}
      <div className="flex-shrink-0 border-t border-zinc-800/50 p-4">
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
                  className={classNames(
                    "p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 transition-all duration-200",
                    usePrompt 
                      ? "text-blue-500 border-blue-500/30" 
                      : "text-zinc-400 hover:text-blue-500 hover:border-blue-500/30"
                  )}
                  onClick={() => {
                    console.log('[chat] Alterando usePrompt de', usePrompt, 'para', !usePrompt);
                    setUsePrompt(!usePrompt);
                  }}
                  title={usePrompt ? "Prompt do sistema ativado" : "Prompt do sistema desativado"}
                >
                  <Code className="h-4 w-4" />
                </Button>
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
