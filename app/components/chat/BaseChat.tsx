/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { JSONValue, Message } from 'ai';
import React, { type RefCallback, useCallback, useEffect, useState, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { DynamicMenu } from '~/components/sidebar/DynamicMenu';
import { SidebarIcon } from '~/components/sidebar/SidebarIcon';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { getApiKeysFromCookies, saveApiKeysToCookies, getUserApiKeysFromStorage, APIKeyManager } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useTemplateManager } from '~/hooks/useTemplateManager';
import { templates } from '~/utils/templates';
import { useGit } from '~/lib/hooks/useGit';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import ignore from 'ignore';
import { toast } from 'react-toastify';
import Canvas from '~/components/ui/canvas';
import { getOrCreateClient } from '~/components/supabase/client';
import { NewHeader } from '~/components/header/NewHeader';
import { NotSignedHeader } from '~/components/header/NotSignedHeader';
import { useAuth } from '~/components/supabase/auth-context';
import { DynamicHeader } from '~/components/header/DynamicHeader';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { ActionRunner } from '~/lib/runtime/action-runner';

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
import { ScreenshotStateManager } from './ScreenshotStateManager';
import StarterTemplates from './StarterTemplates';
import type { ActionAlert } from '~/types/actions';
import ChatAlert from './ChatAlert';
import { LLMManager } from '~/lib/modules/llm/manager';
import ProgressCompilation from './ProgressCompilation';
import type { ProgressAnnotation } from '~/types/context';
import { AuthenticatedChatInput } from './AuthenticatedChatInput';

import logoAngular from '~/lib/png/logo_angular.svg.png';
import logoAstro from '~/lib/png/logo_astro.svg.png';
import logoNextjs from '~/lib/png/logo_nextjs.svg.png';
import logoReact from '~/lib/png/logo_react.svg.png';
import logoVue from '~/lib/png/logo_vue.svg fill@2x.png';
import { ChevronRight, ChevronLeft, Search, ArrowRight, Github, X, Menu as MenuIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/ui/dialog';
import { Button } from '@/components/ui/ui/button';
import { AddImageToYourProject } from './Addimagetoyourproject';
import { handleChatCommand } from './ChatCommands';
import { CommandCard } from './CommandCard';
import { SecureMemoryStorage } from './SecureMemoryStorage';

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
  data?: JSONValue[] | undefined;
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
      data,
    }: BaseChatProps,
    ref,
  ) => {
    const { ready, gitClone } = useGit();
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [selectedApiKey, setSelectedApiKey] = useState<string>('');
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isModelLoading, setIsModelLoading] = useState<string | undefined>('all');
    const [imageContexts, setImageContexts] = useState<string[]>([]);
    const [showCommands, setShowCommands] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
      if (data) {
        console.log(transcript);
      }
    }, [data]);

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
        //Api Keys Handler
        try {
          // Carregar as chaves do .env
          const envApiKeys: Record<string, string> = {};
            
          // Mapeamento de todas as variáveis de ambiente para os providers
          const envMapping = {
            Anthropic: 'ANTHROPIC_API_KEY',
            Google: 'GOOGLE_GENERATIVE_AI_API_KEY',
            Deepseek: 'DEEPSEEK_API_KEY',
            OpenAI: 'OPENAI_API_KEY',
            HuggingFace: 'HuggingFace_API_KEY',
            OpenRouter: 'OPEN_ROUTER_API_KEY',
            OpenAILike: 'OPENAI_LIKE_API_KEY',
            Together: 'TOGETHER_API_KEY',
            Mistral: 'MISTRAL_API_KEY',
            Cohere: 'COHERE_API_KEY',
            xAI: 'XAI_API_KEY',
            Perplexity: 'PERPLEXITY_API_KEY',
            Groq: 'GROQ_API_KEY',
          };

          // Carregar as chaves do .env usando import.meta.env
          Object.entries(envMapping).forEach(([provider, envKey]) => {
            const value = (import.meta.env as any)[envKey];
            if (value && typeof value === 'string' && value.trim() !== '') {
              const cleanValue = value.trim().replace(/^=+/, '');
              if (cleanValue) {
                envApiKeys[provider] = cleanValue;
              }
            }
          });

          // Salvar apenas as chaves válidas do .env
          const validEnvApiKeys = Object.fromEntries(
            Object.entries(envApiKeys).filter(([_, value]) => 
              value && typeof value === 'string' && value.trim() !== ''
            )
          );

          if (Object.keys(validEnvApiKeys).length > 0) {
            // Salvar as chaves do .env no localStorage
            saveApiKeysToCookies(validEnvApiKeys);
            setApiKeys(validEnvApiKeys);
          } else {
            // Carregar as chaves salvas do localStorage
            const savedKeys = getApiKeysFromCookies();
            if (Object.keys(savedKeys).length > 0) {
              setApiKeys(savedKeys);
            }
          }

          // Remover cookies antigos
          Cookies.remove('apiKeys');
        } catch (error) {
          console.error('Error loading API keys:', error);
        }

        setIsModelLoading('all');
        fetch('/api/models')
          .then((response) => response.json())
          .then((data) => {
            const typedData = data as { modelList: ModelInfo[] };
            setModelList(typedData.modelList);
          })
          .catch((error) => {
            console.error('Error fetching model list:', error);
          })
          .finally(() => {
            setIsModelLoading(undefined);
          });
      }
    }, [providerList, provider]);

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
      event.preventDefault();

      const message = messageInput || input;

      // Para mensagens normais, envia direto sem animação de loading
      if (sendMessage) {
        console.log('[BaseChat] Enviando mensagem via sendMessage');
        sendMessage(event, message);
      }
    };

    const handleSendMessage = async (event: React.UIEvent, messageInput?: string) => {
      console.log('[BaseChat] handleSendMessage chamado');
      if (sendMessage) {
        const fullMessage = messageInput || input;
        
        // Verifica se é um comando
        if (fullMessage.startsWith('@')) {
          event.preventDefault();
          const wasCommandHandled = await handleChatCommand(fullMessage, {
            input: fullMessage,
            handleSendMessage: sendMessage,
            handleInputChange
          });
          
          if (wasCommandHandled) {
            return;
          }
        }

        // Se não for um comando, processa normalmente
        const messageWithContext = [...imageContexts, fullMessage].join('\n');
        processMessage(event, messageWithContext);
        setImageContexts([]);

        if (recognition) {
          console.log('[BaseChat] Limpando reconhecimento de voz');
          recognition.abort();
          setTranscript('');
          setIsListening(false);

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

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === '@') {
        setShowCommands(true);
      } else if (event.key === 'Escape') {
        setShowCommands(false);
      }
    };

    const handleCommandSelect = (command: string) => {
      if (textareaRef?.current) {
        textareaRef.current.value = command + ' ';
        textareaRef.current.focus();
      }
      setShowCommands(false);
      if (handleInputChange) {
        const syntheticEvent = {
          target: { value: command + ' ' },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        handleInputChange(syntheticEvent);
      }
    };

    const handleLocalInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Verificar se há '@' em qualquer posição do texto
      const text = event.target.value;
      const hasAtSymbol = text.includes('@');
      
      // Extrair o token que contém '@' para sugestões de comandos
      if (hasAtSymbol) {
        // Pegar a posição do cursor
        const cursorPosition = event.target.selectionStart;
        
        // Obter o token atual onde o cursor está
        const textBeforeCursor = text.substring(0, cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];
        
        // Se o token atual contém '@', mostrar comandos
        if (currentWord && currentWord.includes('@')) {
          setShowCommands(true);
        } else {
          // Verificar se há algum token com '@' ainda presente no texto
          const tokens = text.split(/\s+/);
          const hasTokenWithAt = tokens.some(token => token.startsWith('@'));
          setShowCommands(hasTokenWithAt);
        }
      } else {
        setShowCommands(false);
      }
      
      handleInputChange?.(event);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Renderizado condicionalmente para evitar problemas de renderização excessiva
    const renderSettingsModal = () => {
      // Só renderizar o conteúdo do modal quando estiver aberto
      if (!isModalOpen) return null;

      return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-[#09090B]/95 border border-zinc-800 text-zinc-100 shadow-2xl [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:hover:bg-[#09090B] [&>button]:transition-colors [&>button]:p-1.5">
            <DialogHeader className="border-b border-zinc-800 pb-4">
              <DialogTitle className="text-lg font-semibold text-zinc-100">Model Settings</DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                Select a model and configure its API key
              </DialogDescription>
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
              
              {provider && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <h3 className="text-md font-medium mb-4 text-zinc-100">API Key Configuration</h3>
                  <APIKeyManager
                    key={`api-key-manager-${provider.name}`}
                    provider={provider}
                    apiKey={selectedApiKey}
                    setApiKey={setSelectedApiKey}
                    getApiKeyLink={provider.getApiKeyLink}
                    labelForGetApiKey={provider.labelForGetApiKey}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-zinc-800 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="bg-[#09090B] hover:bg-[#09090B] text-zinc-100 border-zinc-800"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    const handleExamplePromptClick = (event: React.UIEvent, message?: string) => {
      if (message) {
        handleSendMessage(event, message);
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden bg-[#09090B]')}
        data-chat-visible={showChat}
      >
        {!chatStarted && <Canvas />}
        {!chatStarted && (
          <ClientOnly>
            {() => <SidebarIcon />}
          </ClientOnly>
        )}
        <ClientOnly>{() => <DynamicMenu chatStarted={chatStarted} />}</ClientOnly>
        <div className="flex flex-col lg:flex-row w-full h-full">
          <div className={classNames(styles.Chat, 'grid grid-rows-[auto_1fr] flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {/* Header dinâmica */}
            <DynamicHeader chatStarted={chatStarted} />
            
            {/* Área de conteúdo */}
            <div 
              ref={scrollRef} 
              className="overflow-y-auto h-full"
            >
              {!chatStarted && (
                <>
                  <div id="intro" className="mt-[15vh] max-w-chat mx-auto text-center px-4 lg:px-0">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full" />
                      <h1 className="relative text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-6 animate-fade-in">
                        Transforming Ideas into Code
                      </h1>
                    </div>
                    <p className="text-lg lg:text-xl mb-12 text-zinc-400 animate-fade-in animation-delay-200 font-light">
                      Build intelligent, future-ready software in record time.
                    </p>
                  </div>
                </>
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
                        data={data}
                      />
                    ) : null;
                  }}
                </ClientOnly>
                <div
                  className={classNames('flex flex-col gap-4 w-full max-w-chat mx-auto z-prompt mb-4', {
                    'sticky bottom-2': chatStarted,
                  })}
                >
                  <div className="bg-[#09090B]">
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
                  
                  <AuthenticatedChatInput
                    textareaRef={textareaRef}
                    input={input}
                    enhancingPrompt={enhancingPrompt}
                    isStreaming={isStreaming}
                    uploadedFiles={uploadedFiles}
                    imageDataList={imageDataList}
                    imageContexts={imageContexts}
                    showCommands={showCommands}
                    handleInputChange={handleInputChange}
                    handleStop={handleStop}
                    enhancePrompt={enhancePrompt}
                    handleSendMessage={handleSendMessage}
                    handleFileUpload={handleFileUpload}
                    setShowCommands={setShowCommands}
                    handleCommandSelect={handleCommandSelect}
                    exportChat={exportChat}
                    setImageContexts={setImageContexts}
                    setImageDataList={setImageDataList}
                    setUploadedFiles={setUploadedFiles}
                    isListening={isListening}
                    startListening={startListening}
                    stopListening={stopListening}
                    chatStarted={chatStarted}
                    providerList={providerList}
                    isModelSettingsCollapsed={isModelSettingsCollapsed}
                    setIsModelSettingsCollapsed={setIsModelSettingsCollapsed}
                    model={model}
                    setIsModalOpen={setIsModalOpen}
                  />
                </div>
              </div>
              {!chatStarted && (
                <div className="flex flex-col justify-center gap-8 pb-10">
                  <div className="mb-8">
                    <ExamplePrompts sendMessage={handleExamplePromptClick} />
                  </div>
                  <div className="px-4 py-6 rounded-lg bg-[#09090B]/20">
                    <TemplateCards importChat={importChat} />
                  </div>
                </div>
              )}
            </div>
          </div>
          <ClientOnly>
            {() => (
              <Workbench 
                chatStarted={chatStarted} 
                isStreaming={isStreaming} 
                onSendMessage={sendMessage} 
                actionRunner={new ActionRunner({} as any, () => null, () => {})} 
              />
            )}
          </ClientOnly>
        </div>
      </div>
    );

    // Atualiza a API key selecionada quando o provider muda
    useEffect(() => {
      if (provider) {
        // Tenta obter a chave do usuário primeiro
        const userKeys = getUserApiKeysFromStorage();
        const userKey = userKeys[provider.name];
        
        if (userKey) {
          setSelectedApiKey(userKey);
        } else {
          // Se não existir chave do usuário, obtem a do sistema
          const memoryStorage = SecureMemoryStorage.getInstance();
          const systemKey = memoryStorage.get(provider.name);
          setSelectedApiKey(systemKey || '');
        }
      }
    }, [provider]);

    return (
      <Tooltip.Provider delayDuration={200}>
        {renderSettingsModal()}
        <ScreenshotStateManager 
          setUploadedFiles={setUploadedFiles}
          setImageDataList={setImageDataList}
          uploadedFiles={uploadedFiles}
          imageDataList={imageDataList}
        />
        {baseChat}
      </Tooltip.Provider>
    );
  },
);
