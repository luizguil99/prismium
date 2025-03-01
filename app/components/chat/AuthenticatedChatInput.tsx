import React, { useState, useEffect } from 'react';
import { useAuth } from '~/components/supabase/auth-context';
import { classNames } from '~/utils/classNames';
import { ClientOnly } from 'remix-utils/client-only';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { AddImageToYourProject } from './Addimagetoyourproject';
import { toast } from 'react-toastify';
import { CommandCard } from './CommandCard';
import { Link } from '@remix-run/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/ui/dialog';
import { Button } from '@/components/ui/ui/button';

interface AuthenticatedChatInputProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  input: string;
  enhancingPrompt?: boolean;
  isStreaming?: boolean;
  uploadedFiles?: File[];
  imageDataList?: string[];
  imageContexts?: string[];
  showCommands?: boolean;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleStop?: () => void;
  enhancePrompt?: () => void;
  handleSendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleFileUpload?: () => void;
  setShowCommands?: (show: boolean) => void;
  handleCommandSelect?: (command: string) => void;
  exportChat?: () => void;
  setImageContexts?: any;
  setImageDataList?: (dataList: string[]) => void;
  setUploadedFiles?: (files: File[]) => void;
  isListening?: boolean;
  startListening?: () => void;
  stopListening?: () => void;
  chatStarted?: boolean;
  providerList?: any[];
  isModelSettingsCollapsed?: boolean;
  setIsModelSettingsCollapsed?: (isCollapsed: boolean) => void;
  model?: string;
  setIsModalOpen?: (isOpen: boolean) => void;
}

export const AuthenticatedChatInput = ({
  textareaRef,
  input,
  enhancingPrompt,
  isStreaming,
  uploadedFiles = [],
  imageDataList = [],
  imageContexts = [],
  showCommands = false,
  handleInputChange,
  handleStop,
  enhancePrompt,
  handleSendMessage,
  handleFileUpload,
  setShowCommands,
  handleCommandSelect,
  exportChat,
  setImageContexts,
  setImageDataList,
  setUploadedFiles,
  isListening,
  startListening,
  stopListening,
  chatStarted = false,
  providerList = [],
  isModelSettingsCollapsed = false,
  setIsModelSettingsCollapsed,
  model = '',
  setIsModalOpen,
}: AuthenticatedChatInputProps) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const TEXTAREA_MIN_HEIGHT = 55;
  const TEXTAREA_MAX_HEIGHT = chatStarted ? 280 : 140;

  useEffect(() => {
    // Small delay to ensure authentication state is loaded
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === '@') {
      setShowCommands?.(true);
    } else if (event.key === 'Escape') {
      setShowCommands?.(false);
    } else if (event.key === 'Enter') {
      if (event.shiftKey) {
        return;
      }

      event.preventDefault();

      if (isStreaming) {
        handleStop?.();
        return;
      }

      // ignore if using input method engine
      if (event.nativeEvent.isComposing) {
        return;
      }

      // Verificar autenticação apenas na hora de enviar
      if (!user) {
        setShowLoginModal(true);
        return;
      }

      handleSendMessage?.(event);
    }
  };

  const handleLocalInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!event.target.value.includes('@')) {
      setShowCommands?.(false);
    }
    handleInputChange?.(event);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;

    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        // Verificar autenticação para uploads de imagem
        if (!user) {
          setShowLoginModal(true);
          return;
        }
        
        e.preventDefault();

        const file = item.getAsFile();

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }

        break;
      }
    }
  };

  // Login Modal Component
  const LoginModal = () => (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="bg-[#09090B]/95 border border-zinc-800 text-zinc-100 shadow-2xl [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:hover:bg-[#09090B] [&>button]:transition-colors [&>button]:p-1.5">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="text-lg font-semibold text-zinc-100">Authentication Required</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="i-ph:lock-key text-5xl text-blue-500 mb-4" />
          </div>
          <h3 className="text-xl font-medium text-white">Sign in to use the chat</h3>
          <p className="text-zinc-400">
            You need to be authenticated to send messages and interact with our AI assistant.
          </p>
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4 flex justify-center">
          <Link
            to="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
          >
            Sign in or Register
          </Link>
          <Button
            variant="outline"
            onClick={() => setShowLoginModal(false)}
            className="ml-2 bg-[#09090B] hover:bg-[#09090B] text-zinc-100 border-zinc-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div
      className={classNames(
        'relative shadow-lg border border-zinc-800/60 backdrop-blur-lg rounded-xl bg-[#111113]',
        'transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/5',
        'text-sm'
      )}
    >
      <LoginModal />
      
      <CommandCard
        isVisible={showCommands || false}
        onSelect={(command) => handleCommandSelect?.(command)}
      />
      {imageDataList.length > 0 && (
        <div className="flex flex-wrap gap-1 p-1.5 max-h-24 overflow-y-auto">
          {imageDataList.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Preview ${index + 1}`}
                className="w-18 h-18 object-cover rounded-lg border border-zinc-800"
              />
              <button
                onClick={() => {
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  
                  const newImageList = [...imageDataList];
                  newImageList.splice(index, 1);
                  setImageDataList?.(newImageList);

                  const newFiles = [...uploadedFiles];
                  newFiles.splice(index, 1);
                  setUploadedFiles?.(newFiles);

                  if (setImageContexts && imageContexts) {
                    const newContexts = [...imageContexts];
                    newContexts.splice(index, 1);
                    setImageContexts(newContexts);
                  }
                }}
                className="absolute top-1 right-1 p-1 bg-[#09090B]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="h-4 w-4 i-ph:x text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center px-3.5 py-1.5 border-b border-zinc-800/60">
        <button 
          className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded-md hover:bg-blue-500/10 flex items-center gap-1 bg-transparent border border-zinc-800/60 px-2 py-1 border-radius-full"
          onClick={() => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            setShowCommands?.(true);
          }}
          title="Open commands"
        >
            <span className="font-semibold text-md">@</span>
            
         
        </button>
       
      </div>
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={classNames(
            'w-full pl-3.5 pt-2.5 pr-12 outline-none resize-none text-gray-300 placeholder-gray-500 bg-transparent text-sm',
            'transition-all duration-200',
            'focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30',
            input.startsWith('@') ? 'command-input' : ''
          )}
          onDragEnter={(e) => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragOver={(e) => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragLeave={(e) => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
          }}
          onDrop={(e) => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  setUploadedFiles?.([...uploadedFiles, file]);
                  setImageDataList?.([...imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={handleKeyDown}
          value={input}
          onChange={handleLocalInputChange}
          onPaste={handlePaste}
          style={{
            minHeight: TEXTAREA_MIN_HEIGHT,
            maxHeight: TEXTAREA_MAX_HEIGHT,
          }}
          placeholder="How can I help you today?"
          translate="no"
        />
        <ClientOnly>
          {() => (
            <div className="absolute right-2 top-2">
              <SendButton
                show={input.length > 0 || isStreaming || uploadedFiles.length > 0}
                isStreaming={isStreaming || false}
                disabled={!providerList || providerList.length === 0}
                onClick={(event) => {
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }
                  
                  if (isStreaming) {
                    handleStop?.();
                    return;
                  }

                  if (input.length > 0 || uploadedFiles.length > 0) {
                    handleSendMessage?.(event);
                  }
                }}
              />
            </div>
          )}
        </ClientOnly>
      </div>
      <div className="flex justify-between items-center text-xs p-2.5 pt-1.5">
        <div className="flex gap-1.5 items-center">
          <IconButton
            title="Upload file for AI Vision"
            className="p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:border-blue-500/30"
            onClick={() => {
              if (!user) {
                setShowLoginModal(true);
                return;
              }
              handleFileUpload?.();
            }}
          >
            <div className="i-ph:paperclip text-lg"></div>
          </IconButton>
          
          {/* Wrapper para o AddImageToYourProject com verificação de autenticação */}
          {user ? (
            <AddImageToYourProject 
              imageDataList={imageDataList}
              setImageDataList={setImageDataList}
              setImageContexts={setImageContexts}
            />
          ) : (
            <IconButton
              title="Add Image From Your Project (Login Required)"
              className="p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:border-blue-500/30"
              onClick={() => setShowLoginModal(true)}
            >
              <div className="i-ph:image-square text-lg"></div>
            </IconButton>
          )}
          
          <IconButton
            title="Enhance prompt"
            disabled={input.length === 0 || enhancingPrompt}
            className={classNames(
              'p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:border-blue-500/30',
              enhancingPrompt ? 'opacity-100' : '',
            )}
            onClick={() => {
              if (!user) {
                setShowLoginModal(true);
                return;
              }
              enhancePrompt?.();
              toast.success('Prompt enhanced!');
            }}
          >
            {enhancingPrompt ? (
              <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-lg animate-spin"></div>
            ) : (
              <div className="i-bolt:stars text-lg"></div>
            )}
          </IconButton>

          <SpeechRecognitionButton
            isListening={!!isListening}
            onStart={() => {
              if (!user) {
                setShowLoginModal(true);
                return;
              }
              startListening?.();
            }}
            onStop={() => {
              if (!user) {
                setShowLoginModal(true);
                return;
              }
              stopListening?.();
            }}
            disabled={!!isStreaming}
          />
          
          {chatStarted && (
            <ClientOnly>
              {() => (
                <IconButton
                  title={user ? "Export Chat" : "Export Chat (Login Required)"}
                  className="p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 transition-all duration-200 hover:text-blue-500 hover:border-blue-500/30"
                  onClick={() => {
                    if (!user) {
                      setShowLoginModal(true);
                      return;
                    }
                    exportChat?.();
                  }}
                >
                  <div className="i-ph:download-simple text-lg"></div>
                </IconButton>
              )}
            </ClientOnly>
          )}

          <div className="flex items-center gap-1.5">
            <IconButton
              title="Model Settings"
              className={classNames(
                'p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200',
                {
                  'bg-blue-500/10 text-blue-400 border-blue-500/30': isModelSettingsCollapsed,
                },
              )}
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setIsModelSettingsCollapsed?.(!isModelSettingsCollapsed);
              }}
              disabled={!providerList || providerList.length === 0}
            >
              <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
              {isModelSettingsCollapsed ? <span className="text-xs ml-1">{model}</span> : <span />}
            </IconButton>

            <IconButton
              title="Configure API"
              className={classNames(
                'p-1.5 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200',
              )}
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setIsModalOpen?.(true);
              }}
              disabled={!providerList || providerList.length === 0}
            >
              <div className="i-ph:gear text-lg" />
            </IconButton>
          </div>
        </div>
        
        {input.length > 3 ? (
          <div className="text-xs text-gray-500">
            Use <kbd className="px-1 py-0.5 rounded bg-[#111113] border border-zinc-800/50">Shift</kbd> +{' '}
            <kbd className="px-1 py-0.5 rounded bg-[#111113] border border-zinc-800/50">Enter</kbd> to a
            new line
          </div>
        ) : null}
      </div>
    </div>
  );
}; 