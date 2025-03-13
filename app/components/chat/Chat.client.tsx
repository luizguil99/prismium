/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useChat } from 'ai/react';
import { useAnimate } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useMessageParser, usePromptEnhancer, useShortcuts, useSnapScroll } from '~/lib/hooks';
import { description, useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROMPT_COOKIE_KEY, PROVIDER_LIST } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import Cookies from 'js-cookie';
import { debounce } from '~/utils/debounce';
import { useSettings } from '~/lib/hooks/useSettings';
import type { ProviderInfo } from '~/types/model';
import { useSearchParams } from '@remix-run/react';
import { createSampler } from '~/utils/sampler';
import { getTemplates, selectStarterTemplate } from '~/utils/selectStarterTemplate';
import { filesToArtifacts } from '~/utils/fileUtils';
import { updateRevertDropdownMessages, updateRevertDropdownChatId } from '~/lib/stores/revertDropdown';
import { chatId } from '~/lib/persistence/useChatHistory';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

// Estendendo o tipo Message para incluir a propriedade isHidden
interface CustomMessage extends Message {
  isHidden?: boolean;
}
// Prompt personalizado que será adicionado à mensagem invisível após a importação do template
// Permite personalização via variável de ambiente ou usa o valor padrão
const TEMPLATE_POST_IMPORT_PROMPT = import.meta.env.VITE_TEMPLATE_CUSTOM_PROMPT || `template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED

SUPER IMPORTANT INSTRUCTIONS:
1. Now that the Template is imported, you MUST run the appropriate commands:
   - For Node.js projects: run 'npm install' and then 'npm run dev'
   - For static projects: run 'npx --yes serve'

5. DO NOT SKIP installation or start commands under any circumstances!

---
Now that the Template is imported please continue with my original request and the user request
Your output token limit is 8000 tokens, so don't forget to use it wisely
Example:
User: "Create a todo list app with local storage"
Assistant: "Sure. I'll start by:
1. npm install
2. Do what the user says
3. npm run dev
Strictly forbidden actions:
❌ Modify any content of the template files
❌ Create new versions of these files
-The template is READY, you just need to MAKE THE COMPONENTS, DON'T WORRY ABOUT TAILWIND CONFIG, VITE CONFIG, ETC.
`;

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);
  const chatIdValue = useStore(chatId);
  const prevChatIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id));
    
    // Inicializa o store global com as mensagens iniciais
    if (initialMessages.length > 0) {
      updateRevertDropdownMessages(initialMessages);
    }
    
    // Inicializa o store global com o chatId apenas se ele mudou
    if (chatIdValue && chatIdValue !== prevChatIdRef.current) {
      updateRevertDropdownChatId(chatIdValue);
      prevChatIdRef.current = chatIdValue;
    }
  }, [initialMessages, chatIdValue]);

  return (
    <>
      {ready && (
        <ChatImpl
          description={title}
          initialMessages={initialMessages}
          exportChat={exportChat}
          storeMessageHistory={storeMessageHistory}
          importChat={importChat}
        />
      )}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          /**
           * @todo Handle more types if we need them. This may require extra color palettes.
           */
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

const processSampledMessages = createSampler(
  (options: {
    messages: Message[];
    initialMessages: Message[];
    isLoading: boolean;
    parseMessages: (messages: Message[], isLoading: boolean) => void;
    storeMessageHistory: (messages: Message[]) => Promise<void>;
  }) => {
    const { messages, initialMessages, isLoading, parseMessages, storeMessageHistory } = options;
    parseMessages(messages, isLoading);

    // Atualiza o store global com as mensagens atuais
    updateRevertDropdownMessages(messages);

    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  },
  50,
);

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
  importChat: (description: string, messages: Message[]) => Promise<void>;
  exportChat: () => void;
  description?: string;
}

export const ChatImpl = memo(
  ({ description, initialMessages, storeMessageHistory, importChat, exportChat }: ChatProps) => {
    useShortcuts();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Move here
    const [imageDataList, setImageDataList] = useState<string[]>([]); // Move here
    const [searchParams, setSearchParams] = useSearchParams();
    const [fakeLoading, setFakeLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string>(localStorage.getItem('dify_conversation_id') || '');
    const files = useStore(workbenchStore.files);
    const actionAlert = useStore(workbenchStore.alert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();
    // Ref para armazenar mensagens pendentes para serem enviadas após processamento do template
    const pendingMessageRef = useRef<string | null>(null);
    // Store de artefatos para monitorar o progresso do template
    const artifacts = useStore(workbenchStore.artifacts);
    // ID da última mensagem assistente que contém um artefato
    const [lastArtifactMessageId, setLastArtifactMessageId] = useState<string | null>(null);

    const [model, setModel] = useState(() => {
      const savedModel = Cookies.get('selectedModel');
      return savedModel || DEFAULT_MODEL;
    });
    const [provider, setProvider] = useState(() => {
      const savedProvider = Cookies.get('selectedProvider');
      return (PROVIDER_LIST.find((p) => p.name === savedProvider) || DEFAULT_PROVIDER) as ProviderInfo;
    });

    const { showChat } = useStore(chatStore);

    const [animationScope, animate] = useAnimate();

    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

    const {
      messages,
      isLoading,
      input,
      handleInputChange,
      setInput,
      stop,
      append,
      setMessages,
      reload,
      error,
      data: chatData,
      setData,
    } = useChat({
      api: '/api/chat',
      body: {
        apiKeys,
        files,
        promptId,
        contextOptimization: contextOptimizationEnabled,
      },
      sendExtraMessageFields: true,
      onError: (error) => {
        logger.error('Request failed\n\n', error);
        toast.error(
          'There was an error processing your request: ' + (error.message ? error.message : 'No details were returned'),
        );
      },
      onFinish: async (message) => {
        // Processa blocos de código da resposta final
        if (message.content) {
          await processCodeBlocks(typeof message.content === 'string' ? message.content : '');
        }

        logger.debug('Finished streaming');
      },
      initialMessages,
      initialInput: Cookies.get(PROMPT_COOKIE_KEY) || '',
    });
    useEffect(() => {
      const prompt = searchParams.get('prompt');
      const pendingTemplate = localStorage.getItem('pendingTemplateMessage');

      if (pendingTemplate) {
        localStorage.removeItem('pendingTemplateMessage');
        // Para template, mantém o delay e a animação
        setTimeout(() => {
          const syntheticEvent = {
            preventDefault: () => {},
          } as React.UIEvent;
          runAnimation();
          sendMessage(syntheticEvent, pendingTemplate);
        }, 3000);
      } else if (prompt) {
        setSearchParams({});
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${prompt}`,
            },
            
          ] as any,
        });
      }
    }, [model, provider, searchParams]);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages } = useMessageParser();

    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    useEffect(() => {
      chatStore.setKey('started', initialMessages.length > 0);
    }, []);

    useEffect(() => {
      processSampledMessages({
        messages,
        initialMessages,
        isLoading,
        parseMessages,
        storeMessageHistory,
      });
    }, [messages, isLoading, parseMessages]);

    const scrollTextArea = () => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    const abort = () => {
      stop();
      chatStore.setKey('aborted', true);
      workbenchStore.abortAllActions();
    };

    useEffect(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.style.height = 'auto';

        const scrollHeight = textarea.scrollHeight;

        textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
        textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
      }
    }, [input, textareaRef]);

    const runAnimation = async () => {
      if (chatStarted) {
        return;
      }

      await Promise.all([
        animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
        animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
      ]);

      chatStore.setKey('started', true);

      setChatStarted(true);
    };

    const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
      const messageContent = messageInput || input;

      if (!messageContent?.trim()) {
        return;
      }

      if (isLoading) {
        abort();
        return;
      }

      if (!chatStarted) {
        setFakeLoading(true);

        setMessages([
          {
            id: `${new Date().getTime()}`,  
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
              },
              ...imageDataList.map((imageData) => ({
                type: 'image',
                image: imageData,
              })),
            ] as any,
          },
        ]);

        runAnimation();

        if (autoSelectTemplate) {
          const { template, title } = await selectStarterTemplate({
            message: messageContent,
            model,
            provider,
          });

          if (template !== 'blank') {
            const temResp = await getTemplates(template, title).catch((e) => {
              if (e.message.includes('rate limit')) {
                toast.warning('Rate limit exceeded. Skipping starter template\n Continuing with blank template');
              } else {
                toast.warning('Failed to import starter template\n Continuing with blank template');
              }

              return null;
            });

            if (temResp) {
              const { assistantMessage } = temResp;
              setMessages([
                {
                  id: `1-${new Date().getTime()}`,
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
                    },
                    ...imageDataList.map((imageData) => ({
                      type: 'image',
                      image: imageData,
                    })),
                  ] as any,
                },
                {
                  id: `2-${new Date().getTime()}`,
                  role: 'assistant',
                  content: assistantMessage,
                }
              ]);
              setFakeLoading(false);
              setChatStarted(true);
              
              // Armazena a mensagem original para processamento posterior
              const originalMessage = messageContent;
              
              // Em vez de usar setTimeout, usamos um ref para controlar quando enviar a mensagem
              pendingMessageRef.current = originalMessage;
              
              return;
            }
          }
        }

        // If autoSelectTemplate is disabled or template selection failed, proceed with normal message
        setMessages([
          {
            id: `${new Date().getTime()}`,
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
              },
              ...imageDataList.map((imageData) => ({
                type: 'image',
                image: imageData,
              })),
            ] as any,
          },
        ]);
        reload();
        setFakeLoading(false);

        return;
      }

      if (error != null) {
        setMessages(messages.slice(0, -1));
      }

      const modifiedFiles = workbenchStore.getModifiedFiles();

      chatStore.setKey('aborted', false);

      if (modifiedFiles !== undefined) {
        const userUpdateArtifact = filesToArtifacts(modifiedFiles, `${Date.now()}`);
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userUpdateArtifact}${messageContent}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });

        workbenchStore.resetAllFileModifications();
      } else {
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${messageContent}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });
      }

      setInput('');
      Cookies.remove(PROMPT_COOKIE_KEY);

      setUploadedFiles([]);
      setImageDataList([]);

      resetEnhancer();

      textareaRef.current?.blur();
    };

    // Função para processar blocos de código da resposta
    const processCodeBlocks = async (text: string) => {
      const codeBlocks: { language: string; code: string }[] = [];
      const regex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const language = match[1] || 'plaintext';
        const code = match[2].trim();
        codeBlocks.push({ language, code });
      }

      // Salva os blocos de código no workbench
      for (const { language, code } of codeBlocks) {
        try {
          const filename = `generated.${language === 'javascript' ? 'js' : language}`;
          // Atualiza o arquivo diretamente no FilesStore
          workbenchStore.files.setKey(filename, { type: 'file', content: code, isBinary: false });
          console.log(`✅ Código salvo em ${filename}`);
        } catch (error) {
          console.error('❌ Erro ao salvar código:', error);
        }
      }

      return codeBlocks;
    };

    /**
     * Handles the change event for the textarea and updates the input state.
     * @param event - The change event from the textarea.
     */
    const onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(event);
    };

    /**
     * Debounced function to cache the prompt in cookies.
     * Caches the trimmed value of the textarea input after a delay to optimize performance.
     */
    const debouncedCachePrompt = useCallback(
      debounce((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const trimmedValue = event.target.value.trim();
        Cookies.set(PROMPT_COOKIE_KEY, trimmedValue, { expires: 30 });
      }, 1000),
      [],
    );

    const [messageRef, scrollRef] = useSnapScroll();

    useEffect(() => {
      const storedApiKeys = Cookies.get('apiKeys');

      if (storedApiKeys) {
        setApiKeys(JSON.parse(storedApiKeys));
      }
    }, []);

    const handleModelChange = (newModel: string) => {
      setModel(newModel);
      Cookies.set('selectedModel', newModel, { expires: 30 });
    };

    const handleProviderChange = (newProvider: ProviderInfo) => {
      setProvider(newProvider);
      Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    };

    // Efeito para atualizar o store global de mensagens do RevertDropdown
    useEffect(() => {
      if (messages.length > 0) {
        updateRevertDropdownMessages(messages);
      }
    }, [messages]);

    // Efeito para verificar quando o artefato do template foi processado e então enviar a mensagem
    useEffect(() => {
      // Verifica se há uma mensagem pendente para enviar e se temos um ID de artefato
      if (pendingMessageRef?.current && lastArtifactMessageId && artifacts[lastArtifactMessageId]) {
        const artifact = artifacts[lastArtifactMessageId];
        
        // Obtém todas as ações do artefato
        const actions = Object.values(artifact.runner.actions.get());
        
        // Verifica se todas as ações foram concluídas
        const allActionsFinished = actions.length > 0 && !actions.find(action => {
          // Ações do tipo 'start' estão completas se não estiverem falhadas ou em execução
          if (action.type === 'start') {
            return action.status === 'failed' || action.status === 'running';
          }
          // Outras ações estão completas apenas se o status for 'complete'
          return action.status !== 'complete';
        });
        
        // Se todas as ações estiverem concluídas, envie a mensagem
        if (allActionsFinished && !isLoading) {
          // Extrai a mensagem original e reseta o ref
          const originalMessage = pendingMessageRef.current;
          pendingMessageRef.current = null;
          
          // Envio invisível da mensagem original após a importação do template completar
          append({
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${TEMPLATE_POST_IMPORT_PROMPT}\n\n${originalMessage}`,
              },
              ...imageDataList.map((imageData) => ({
                type: 'image',
                image: imageData,
              })),
            ] as any,
            isHidden: true,
            annotations: ['hidden']
          } as CustomMessage);
          
          // Limpa o ID do artefato após enviar a mensagem
          setLastArtifactMessageId(null);
        }
      }
    }, [artifacts, lastArtifactMessageId, isLoading, pendingMessageRef, append, model, provider, imageDataList]);
    
    // Monitor para detectar mensagens de artefato e armazenar o ID
    useEffect(() => {
      if (messages.length > 0 && pendingMessageRef.current) {
        // Procura por mensagens do assistente que contenham artefatos
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          if (message.role === 'assistant' && typeof message.content === 'string' && 
              message.content.includes('<boltArtifact id="imported-files"')) {
            setLastArtifactMessageId(message.id);
            break;
          }
        }
      }
    }, [messages, pendingMessageRef]);

    return (
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={input}
        showChat={showChat}
        chatStarted={chatStarted}
        isStreaming={isLoading || fakeLoading}
        enhancingPrompt={enhancingPrompt}
        promptEnhanced={promptEnhanced}
        sendMessage={sendMessage}
        model={model}
        setModel={handleModelChange}
        provider={provider}
        setProvider={handleProviderChange}
        providerList={activeProviders}
        messageRef={messageRef}
        scrollRef={scrollRef}
        handleInputChange={(e) => {
          onTextareaChange(e);
          debouncedCachePrompt(e);
        }}
        handleStop={abort}
        description={description}
        importChat={importChat}
        exportChat={exportChat}
        messages={messages.map((message, i) => {
          if (message.role === 'user') {
            return {
              ...message,
              isHidden: (message as CustomMessage).isHidden,
            };
          }

          return {
            ...message,
            content: parsedMessages[i] || '',
          };
        })}
        enhancePrompt={() => {
          enhancePrompt(
            input,
            (input) => {
              setInput(input);
              scrollTextArea();
            },
            model,
            provider,
            apiKeys,
          );
        }}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
        imageDataList={imageDataList}
        setImageDataList={setImageDataList}
        actionAlert={actionAlert}
        clearAlert={() => workbenchStore.clearAlert()}
        data={chatData}
      />
    );
  },
);
