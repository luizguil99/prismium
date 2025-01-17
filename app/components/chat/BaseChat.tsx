/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { Message } from 'ai';
import React, { type RefCallback, useCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager, getApiKeysFromCookies } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useTemplateManager } from '~/hooks/useTemplateManager';
import { templates } from '~/utils/templates';
import { useGit } from '~/lib/hooks/useGit';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import ignore from 'ignore';
import { toast } from 'react-toastify';

import styles from './BaseChat.module.scss';
import { ExportChatButton } from '~/components/chat/chatExportAndImport/ExportChatButton';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';
import GitCloneButton from './GitCloneButton';
import TemplateCards from './TemplateCards';
import FeaturedTemplates from './featuredtemplates';

import FilePreview from './FilePreview';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import { LLMManager } from '~/lib/modules/llm/manager';

import logoAngular from '~/lib/png/logo_angular.svg.png';
import logoAstro from '~/lib/png/logo_astro.svg.png';
import logoNextjs from '~/lib/png/logo_nextjs.svg.png';
import logoReact from '~/lib/png/logo_react.svg.png';
import logoVue from '~/lib/png/logo_vue.svg fill@2x.png';
import { ChevronRight, ChevronLeft, Search, ArrowRight, Github, X } from 'lucide-react';
import BackgroundRays from '../ui/BackgroundRays';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/ui/dialog';
import { Button } from '@/components/ui/ui/button';

const TEXTAREA_MIN_HEIGHT = 76;

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  exportChat?: () => void;
  uploadedFiles?: File[];
  setUploadedFiles?: (files: File[]) => void;
  imageDataList?: string[];
  setImageDataList?: (dataList: string[]) => void;
  actionAlert?: ActionAlert;
  clearAlert?: () => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      model,
      setModel,
      provider,
      setProvider,
      providerList,
      input = '',
      enhancingPrompt,
      handleInputChange,
      enhancePrompt,
      sendMessage,
      handleStop,
      importChat,
      exportChat,
      uploadedFiles = [],
      setUploadedFiles,
      imageDataList = [],
      setImageDataList,
      messages,
      actionAlert,
      clearAlert,
    }: BaseChatProps,
    ref,
  ) => {
    const { ready, gitClone } = useGit();
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(getApiKeysFromCookies());
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');

    const getProviderSettings = useCallback(() => {
      let providerSettings: Record<string, IProviderSetting> | undefined = undefined;

      try {
        const savedProviderSettings = Cookies.get('providers');

        if (savedProviderSettings) {
          const parsedProviderSettings = JSON.parse(savedProviderSettings);

          if (typeof parsedProviderSettings === 'object' && parsedProviderSettings !== null) {
            providerSettings = parsedProviderSettings;
          }
        }
      } catch (error) {
        console.error('Error loading Provider Settings from cookies:', error);

        // Clear invalid cookie data
        Cookies.remove('providers');
      }

      return providerSettings;
    }, []);
    useEffect(() => {
      console.log(transcript);
    }, [transcript]);

    useEffect(() => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setTranscript(transcript);

          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: transcript },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }, []);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const providerSettings = getProviderSettings();
        let parsedApiKeys: Record<string, string> | undefined = {};

        try {
          parsedApiKeys = getApiKeysFromCookies();
          setApiKeys(parsedApiKeys);
        } catch (error) {
          console.error('Error loading API keys from cookies:', error);

          // Clear invalid cookie data
          Cookies.remove('apiKeys');
        }
        setIsModelLoading('all');
        initializeModelList({ apiKeys: parsedApiKeys, providerSettings })
          .then((modelList) => {
            // console.log('Model List: ', modelList);
            setModelList(modelList);
          })
          .catch((error) => {
            console.error('Error initializing model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList]);

    const onApiKeysChange = async (providerName: string, apiKey: string) => {
      const newApiKeys = { ...apiKeys, [providerName]: apiKey };
      setApiKeys(newApiKeys);
      Cookies.set('apiKeys', JSON.stringify(newApiKeys));

      const provider = LLMManager.getInstance(import.meta.env || process.env || {}).getProvider(providerName);

      if (provider && provider.getDynamicModels) {
        setIsModelLoading(providerName);

        try {
          const providerSettings = getProviderSettings();
          const staticModels = provider.staticModels;
          const dynamicModels = await provider.getDynamicModels(
            newApiKeys,
            providerSettings,
            import.meta.env || process.env || {},
          );

          setModelList((preModels) => {
            const filteredOutPreModels = preModels.filter((x) => x.provider !== providerName);
            return [...filteredOutPreModels, ...staticModels, ...dynamicModels];
          });
        } catch (error) {
          console.error('Error loading dynamic models:', error);
        }
        setIsModelLoading(undefined);
      }
    };

    const startListening = () => {
      if (recognition) {
        recognition.start();
        setIsListening(true);
      }
    };

    const stopListening = () => {
      if (recognition) {
        recognition.stop();
        setIsListening(false);
      }
    };

    const { handlePromptAndClone, loadingId } = useTemplateManager();

    const processMessage = async (event: React.UIEvent, messageInput?: string) => {
      if (!messageInput && !textareaRef?.current?.value) {
        return;
      }

      const input = messageInput || textareaRef.current.value;
      console.log('[BaseChat] processMessage - Input:', input);

      // Verifica se é a primeira mensagem e se contém palavras-chave do template Shadcn
      if (messages?.length === 0 && input.toLowerCase().includes('shadcn')) {
        console.log('[BaseChat] Detectado comando shadcn');
        const shadcnTemplate = templates.find((t) => t.id === 1); // Template Shadcn
        if (shadcnTemplate && importChat) {
          try {
            // Envia a mensagem original modificada
            // if (sendMessage) {
            //   sendMessage(event, 'Creating project...');
            // }

            console.log('[BaseChat] Iniciando importação do template');
            const { workdir, data } = await gitClone(shadcnTemplate.repo);
            const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));

            const textDecoder = new TextDecoder('utf-8');
            const fileContents = filePaths
              .map((filePath) => {
                const { data: content, encoding } = data[filePath];
                return {
                  path: filePath,
                  content:
                    encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
                };
              })
              .filter((f) => f.content);

            const commands = await detectProjectCommands(fileContents);
            const commandsMessage = createCommandsMessage(commands);

            const filesMessage: Message = {
              role: 'assistant',
              content: `Iniciando projeto com template ${shadcnTemplate.title}
<boltArtifact id="imported-files" title="Template Files" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
              id: generateId(),
              createdAt: new Date(),
            };

            const templateMessages = [filesMessage];
            if (commandsMessage) {
              templateMessages.push(commandsMessage);
            }

            console.log('[BaseChat] Chamando importChat');
            localStorage.setItem('pendingTemplateMessage', input);
            await importChat(`Template: ${shadcnTemplate.title}`, templateMessages);
            console.log('[BaseChat] Template importado com sucesso');

            return;
          } catch (error) {
            console.error('[BaseChat] Erro ao importar template:', error);
            toast.error('Falha ao importar template');
          }
        }
      }

      // Continua com o processamento normal da mensagem
      if (sendMessage) {
        console.log('[BaseChat] Enviando mensagem via sendMessage');
        sendMessage(event, input);
      }
    };

    const handleSendMessage = (event: React.UIEvent, messageInput?: string) => {
      console.log('[BaseChat] handleSendMessage chamado');
      if (sendMessage) {
        processMessage(event, messageInput);

        if (recognition) {
          console.log('[BaseChat] Limpando reconhecimento de voz');
          recognition.abort(); // Stop current recognition
          setTranscript(''); // Clear transcript
          setIsListening(false);

          // Clear the input by triggering handleInputChange with empty value
          if (handleInputChange) {
            const syntheticEvent = {
              target: { value: '' },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleInputChange(syntheticEvent);
          }
        }
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
            setUploadedFiles?.([...uploadedFiles, file]);
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;

      if (!items) {
        return;
      }

      for (const item of items) {
        if (item.type.startsWith('image/')) {
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

    const [isModalOpen, setIsModalOpen] = useState(false);

    const SettingsModal = () => {
      if (!isModalOpen) return null;

      return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-black/95 border border-zinc-800 text-zinc-100 shadow-2xl [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:hover:bg-zinc-900 [&>button]:transition-colors [&>button]:p-1.5">
            <DialogHeader className="border-b border-zinc-800 pb-4">
              <DialogTitle className="text-lg font-semibold text-zinc-100">Configurações do Modelo</DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <ModelSelector
                key={provider?.name + ':' + modelList.length}
                model={model}
                setModel={setModel}
                modelList={modelList}
                provider={provider}
                setProvider={setProvider}
                providerList={providerList || (PROVIDER_LIST as ProviderInfo[])}
                apiKeys={apiKeys}
                modelLoading={isModelLoading}
              />

              {/* Gerenciamento de API Key */}
              {(providerList || []).length > 0 && provider && (
                <div className="pt-6 mt-6 border-t border-zinc-800">
                  <APIKeyManager
                    provider={provider}
                    apiKey={apiKeys[provider.name] || ''}
                    setApiKey={(key) => {
                      onApiKeysChange(provider.name, key);
                    }}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-zinc-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="bg-black hover:bg-zinc-900 text-zinc-100 border-zinc-800"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden bg-black')}
        data-chat-visible={showChat}
      >
        <BackgroundRays />
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex flex-col lg:flex-row overflow-y-auto w-full h-full ">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[10vh] max-w-chat mx-auto text-center px-4 lg:px-0">
                <h1 className="text-3xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-4 animate-fade-in">
                  Transforming Ideas into Code
                </h1>
                <p className="text-md lg:text-xl mb-8 text-bolt-elements-textSecondary animate-fade-in animation-delay-200">
                  Build intelligent, future-ready software in record time.
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-2 sm:px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('flex flex-col gap-4 w-full max-w-chat mx-auto z-prompt mb-4', {
                  'sticky bottom-2': chatStarted,
                })}
              >
                <div className="bg-bolt-elements-background-depth-2">
                  {actionAlert && (
                    <ChatAlert
                      alert={actionAlert}
                      clearAlert={() => clearAlert?.()}
                      postMessage={(message) => {
                        sendMessage?.({} as any, message);
                        clearAlert?.();
                      }}
                    />
                  )}
                </div>
                <div
                  className={classNames(
                    'relative shadow-lg border border-[#2A2F3A]/60 backdrop-blur-lg rounded-xl bg-black/60',
                    'transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-500/5',
                  )}
                >
                  {imageDataList.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 max-h-32 overflow-y-auto">
                      {imageDataList.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-zinc-700"
                          />
                          <button
                            onClick={() => {
                              const newImageList = [...imageDataList];
                              newImageList.splice(index, 1);
                              setImageDataList?.(newImageList);

                              const newFiles = [...uploadedFiles];
                              newFiles.splice(index, 1);
                              setUploadedFiles?.(newFiles);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    className={classNames(
                      'w-full pl-6 pt-4 pr-16 outline-none resize-none text-gray-300 placeholder-gray-500 bg-transparent text-sm',
                      'transition-all duration-200',
                      'focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30',
                    )}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.border = '2px solid #1488fc';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.border = '2px solid #1488fc';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
                    }}
                    onDrop={(e) => {
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
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
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

                        handleSendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
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
                      <SendButton
                        show={input.length > 0 || isStreaming || uploadedFiles.length > 0}
                        isStreaming={isStreaming}
                        disabled={!providerList || providerList.length === 0}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          if (input.length > 0 || uploadedFiles.length > 0) {
                            handleSendMessage?.(event);
                          }
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between items-center text-sm p-4 pt-2">
                    <div className="flex gap-2 items-center">
                      <IconButton
                        title="Upload file"
                        className="p-2 rounded-lg bg-black/50 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200"
                        onClick={() => handleFileUpload()}
                      >
                        <div className="i-ph:paperclip text-xl"></div>
                      </IconButton>
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames(
                          'p-2 rounded-lg bg-black/50 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200',
                          enhancingPrompt ? 'opacity-100' : '',
                        )}
                        onClick={() => {
                          enhancePrompt?.();
                          toast.success('Prompt enhanced!');
                        }}
                      >
                        {enhancingPrompt ? (
                          <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-xl animate-spin"></div>
                        ) : (
                          <div className="i-bolt:stars text-xl"></div>
                        )}
                      </IconButton>

                      <SpeechRecognitionButton
                        isListening={isListening}
                        onStart={startListening}
                        onStop={stopListening}
                        disabled={isStreaming}
                      />
                      {chatStarted && <ClientOnly>{() => <ExportChatButton exportChat={exportChat} />}</ClientOnly>}

                      <div className="flex items-center gap-2">
                        <IconButton
                          title="Model Settings"
                          className={classNames(
                            'p-2 rounded-lg bg-black/50 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200',
                            {
                              'bg-blue-500/10 text-blue-400 border-blue-500/30': isModelSettingsCollapsed,
                            },
                          )}
                          onClick={() => setIsModelSettingsCollapsed(!isModelSettingsCollapsed)}
                          disabled={!providerList || providerList.length === 0}
                        >
                          <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
                          {isModelSettingsCollapsed ? <span className="text-xs ml-1">{model}</span> : <span />}
                        </IconButton>

                        <IconButton
                          title="Configure API"
                          className={classNames(
                            'p-2 rounded-lg bg-black/50 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200',
                          )}
                          onClick={() => setIsModalOpen(true)}
                          disabled={!providerList || providerList.length === 0}
                        >
                          <div className="i-ph:gear text-lg" />
                        </IconButton>
                      </div>
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-gray-500">
                        Use <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-[#2A2F3A]/50">Shift</kbd> +{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-black/50 border border-[#2A2F3A]/50">Return</kbd> for
                        new line
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-8 pb-10">
              {!chatStarted && (
                <>
                  <ExamplePrompts
                    sendMessage={(event, messageInput) => {
                      if (messageInput) {
                        sendMessage(event, messageInput);
                      }
                    }}
                    className="mb-8"
                  />
                  <div className="px-4 py-6 rounded-lg bg-black/20 ">
                    <TemplateCards importChat={importChat} />
                  </div>
                </>
              )}
            </div>
          </div>
          <ClientOnly>
            {() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} onSendMessage={sendMessage} />}
          </ClientOnly>
        </div>
      </div>
    );

    return (
      <Tooltip.Provider delayDuration={200}>
        <SettingsModal />
        {baseChat}
      </Tooltip.Provider>
    );
  },
);
