import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GitBranch, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '@remix-run/react';
import { getMessages, openDatabase } from '~/lib/persistence/db';
import type { Message } from 'ai';
import { useStore } from '@nanostores/react';
import { revertDropdownMessages, revertDropdownChatId } from '~/lib/stores/revertDropdown';

interface RevertDropdownProps {
  className?: string;
  onRevert?: (messageId: string | null) => void;
  // Mantemos o prop externalMessages para compatibilidade, mas agora usamos principalmente o store
  externalMessages?: Message[];
}

// Exportamos o componente memoizado para evitar renderizações desnecessárias
export const RevertDropdown = React.memo(function RevertDropdownComponent({ 
  className, 
  onRevert, 
  externalMessages 
}: RevertDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const urlChatId = params.id as string;
  const storeChatId = useStore(revertDropdownChatId);
  
  // Usando useMemo para calcular o effectiveChatId apenas quando as dependências mudarem
  const effectiveChatId = useMemo(() => urlChatId || storeChatId, [urlChatId, storeChatId]);
  const hasValidChatId = Boolean(effectiveChatId);
  
  const currentRewindId = searchParams.get('rewindTo');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Obtém as mensagens do store global
  const storeMessages = useStore(revertDropdownMessages);
  
  // Usamos useRef para controlar se já buscamos mensagens
  const fetchedRef = useRef(false);
  const previousChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Resetamos o estado de busca quando o chatId muda
    if (effectiveChatId !== previousChatIdRef.current) {
      fetchedRef.current = false;
      previousChatIdRef.current = effectiveChatId;
    }
    
    // Apenas busca mensagens se não tivermos mensagens no store e ainda não tivermos buscado
    if (storeMessages && storeMessages.length > 0) {
      setMessages(storeMessages);
      fetchedRef.current = true;
    } else if (!fetchedRef.current && hasValidChatId && !loading) {
      fetchMessages();
    }
  }, [effectiveChatId, storeMessages]); // Adicionamos storeMessages para atualizar quando as mensagens mudarem

  const fetchMessages = async () => {
    if (!hasValidChatId || fetchedRef.current) return;
    
    setLoading(true);
    fetchedRef.current = true;
    
    try {
      const db = await openDatabase();
      const chat = await getMessages(db, effectiveChatId as string);
      if (chat && chat.messages) {
        setMessages(chat.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      fetchedRef.current = false; // Permite tentar novamente em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Efeito para fechar o dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Efeito para notificar o componente pai quando o rewindTo muda
  useEffect(() => {
    if (onRevert) {
      onRevert(currentRewindId);
    }
  }, [currentRewindId, onRevert]);

  // Função para redirecionar diretamente, sem usar React Router
  const redirectTo = useCallback((url: string) => {
    console.log("Redirecionando para:", url);
    // Usar setTimeout para garantir que o redirecionamento aconteça após o React terminar de processar
    setTimeout(() => {
      window.location.href = url;
    }, 0);
  }, []);

  // Usando useCallback para garantir que a função não seja recriada a cada renderização
  const handleRevert = useCallback((messageId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!effectiveChatId) return;
    
    console.log("Revertendo para mensagem:", messageId);
    
    // Usar redirecionamento direto
    const url = `/chat/${effectiveChatId}?rewindTo=${messageId}`;
    redirectTo(url);
    
    setIsOpen(false);
  }, [effectiveChatId, redirectTo]);

  // Usando useCallback para garantir que a função não seja recriada a cada renderização
  const handleGoToLatest = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!effectiveChatId) return;
    
    console.log("Voltando para a versão mais recente");
    
    // Usar redirecionamento direto
    const url = `/chat/${effectiveChatId}`;
    redirectTo(url);
    
    setIsOpen(false);
  }, [effectiveChatId, redirectTo]);

  // Função para alternar o dropdown
  const toggleDropdown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);

  // Filter user and assistant messages (exclude system messages)
  const filteredMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  );

  // Get current message based on rewindTo parameter
  const getCurrentMessageIndex = () => {
    if (!currentRewindId) return filteredMessages.length;
    
    const index = filteredMessages.findIndex(msg => msg.id === currentRewindId);
    return index !== -1 ? index + 1 : filteredMessages.length;
  };

  const currentIndex = getCurrentMessageIndex();
  
  // Calculate version numbers (every user+assistant pair is a version)
  const getVersionNumber = (index: number) => {
    return Math.floor(index / 2) + 1;
  };

  // Group messages by version
  const groupedMessages = filteredMessages.reduce((acc, message, index) => {
    const versionNum = getVersionNumber(index);
    if (!acc[versionNum]) {
      acc[versionNum] = [];
    }
    acc[versionNum].push({ message, index });
    return acc;
  }, {} as Record<number, { message: Message, index: number }[]>);

  const totalVersions = Object.keys(groupedMessages).length;
  const currentVersion = getVersionNumber(currentIndex);
  
  // Check if we're at the latest version
  const isLatestVersion = !currentRewindId;

  return (
    <div className="relative" ref={dropdownRef}>
      {hasValidChatId && (
        <button
          onClick={toggleDropdown}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isLatestVersion 
              ? 'text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800' 
              : 'text-accent-500 bg-accent-500/10 hover:bg-accent-500/20'
          }`}
          disabled={loading}
          type="button"
        >
          {loading ? (
            <div className="animate-spin w-3 h-3 border-2 border-accent-500 border-t-transparent rounded-full mr-1" />
          ) : (
            <GitBranch size={14} />
          )}
          <span>
            {currentIndex < filteredMessages.length 
              ? `v${currentVersion}/${totalVersions}` 
              : `v${totalVersions}`}
          </span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 origin-top-left rounded-xl bg-transparent shadow-2xl">
          <div className="p-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl backdrop-blur-sm">
            <div className="text-sm font-medium px-3 py-2 text-accent-500 flex items-center gap-2">
              <div className="i-ph:git-branch" />
              <span>Version History</span>
            </div>
            
            <div className="mt-1 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
                  {Object.entries(groupedMessages).map(([version, items], groupIndex) => {
                    const versionNumber = parseInt(version);
                    const isCurrentVersionGroup = versionNumber === currentVersion;
                    const isLatestVersionGroup = versionNumber === totalVersions;
                    
                    return (
                      <div key={version} className={groupIndex > 0 ? 'mt-2 pt-2 border-t border-bolt-elements-borderColor' : ''}>
                        <div className="px-3 py-1 text-xs font-semibold flex items-center justify-between">
                          <span className={isCurrentVersionGroup ? 'text-accent-500' : 'text-bolt-elements-textSecondary'}>
                            Version {version} {isLatestVersionGroup ? '(Latest)' : ''}
                          </span>
                          {isCurrentVersionGroup && (
                            <span className="text-accent-500 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Current
                            </span>
                          )}
                        </div>
                        
                        {items.map(({ message, index }) => (
                          <a
                            key={message.id}
                            href={`/chat/${effectiveChatId}?rewindTo=${message.id}`}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all focus:outline-none focus:ring-0 ${
                              currentRewindId === message.id 
                                ? 'bg-accent-500/10 text-accent-500' 
                                : 'text-bolt-elements-textPrimary'
                            }`}
                            onClick={(e) => {
                              console.log("Clicou na mensagem:", message.id);
                              // Não precisamos mais chamar handleRevert, pois o link fará o redirecionamento
                              setIsOpen(false);
                            }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {message.role === 'user' 
                                ? <div className="i-ph:user-circle" /> 
                                : <div className="i-ph:robot" />}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium truncate">
                                {message.role === 'user' ? 'User prompt' : 'AI response'}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    );
                  })}
                  
                  {filteredMessages.length === 0 && (
                    <div className="px-4 py-2 text-sm text-bolt-elements-textTertiary">No versions found</div>
                  )}
                </>
              )}
            </div>
            
            {currentRewindId && (
              <div className="border-t border-bolt-elements-borderColor pt-2 mt-2">
                <a 
                  href={`/chat/${effectiveChatId}`}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-accent-500 focus:outline-none focus:ring-0"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="i-ph:arrow-clockwise" />
                  </div>
                  <span className="text-sm font-medium">Go to latest version</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
