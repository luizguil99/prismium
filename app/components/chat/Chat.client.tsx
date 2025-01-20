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
import { supabaseStore } from '~/lib/stores/supabase';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

export function Chat() {
  renderLogger.trace('Chat');

  const { ready, initialMessages, storeMessageHistory, importChat, exportChat } = useChatHistory();
  const title = useStore(description);
  useEffect(() => {
    workbenchStore.setReloadedMessages(initialMessages.map((m) => m.id));
  }, [initialMessages]);

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
    const files = useStore(workbenchStore.files);
    const actionAlert = useStore(workbenchStore.alert);
    const { activeProviders, promptId, autoSelectTemplate, contextOptimizationEnabled } = useSettings();

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

    const { messages, isLoading, input, handleInputChange, setInput, stop, append, setMessages, reload } = useChat({
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
      onFinish: (message, response) => {
        const usage = response.usage;

        if (usage) {
          console.log('Token usage:', usage);

          // You can now use the usage data as needed
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

    /**
     * Função principal para envio de mensagens no chat
     * @param _event - Evento do React que disparou o envio
     * @param messageInput - Mensagem opcional que pode ser passada diretamente
     */
    const sendMessage = async (_event: React.UIEvent, messageInput?: string | { isStatus: boolean; text: string }) => {
      console.log('[ChatClient] sendMessage chamado', { messageInput, input });

      // Log para registrar mensagem enviada
      console.log('Mensagem enviada:', messageInput || input);

      // Usa a mensagem passada como parâmetro ou o input atual do chat
      const _input = messageInput || input;

      // Não permite enviar mensagem vazia ou durante carregamento
      if (_input.length === 0 || isLoading) {
        console.log('[ChatClient] Input vazio ou carregando, retornando');
        return;
      }

      // Inicia a animação de envio
      runAnimation();

      // Se for uma mensagem de status (como "Creating project..."), apenas mostra ela no chat
      if (messageInput && typeof messageInput === 'object' && messageInput.isStatus) {
        setMessages((messages) => [
          ...messages,
          {
            id: String(Date.now()),
            role: 'assistant',
            content: messageInput.text,
          },
        ]);
        return;
      }

      // Prepara o prompt inicial com a mensagem do usuário
      let finalPrompt = _input;

      // Verifica se o Supabase está conectado e se é a primeira mensagem
      const isSupabaseConnected = supabaseStore.isConnected.get();
      const isFirstMessage = !supabaseStore.firstMessageSent.get();

      // Adiciona o contexto do Supabase apenas na primeira mensagem após conectar
      if (isSupabaseConnected && isFirstMessage) {
        console.log('[ChatClient] Adicionando contexto do Supabase');
        const supabaseContext = supabaseStore.getAIContext();
        finalPrompt = `${_input}

${supabaseContext}

Por favor, use essas configurações do Supabase ao gerar o código da aplicação no webcontainer.`;

        // Marca que a primeira mensagem foi enviada
        supabaseStore.firstMessageSent.set(true);
      }

      // Salva todos os arquivos abertos no editor
      await workbenchStore.saveAllFiles();

      // Obtém as modificações feitas nos arquivos
      const fileModifications = workbenchStore.getFileModifcations();
      console.log('[ChatClient] Modificações de arquivo:', fileModifications);

      // Reseta o estado de abortar chat
      chatStore.setKey('aborted', false);

      // Lógica especial para primeira mensagem com seleção automática de template
      if (!chatStarted && messageInput && autoSelectTemplate) {
        // Ativa loading para seleção de template
        setFakeLoading(true);

        // Define a mensagem inicial do usuário
        setMessages([
          {
            id: `${new Date().getTime()}`,
            role: 'user',
            content: [
              {
                type: 'text',
                text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalPrompt}`,
              },
              // Adiciona imagens à mensagem se existirem
              ...imageDataList.map((imageData) => ({
                type: 'image',
                image: imageData,
              })),
            ] as any,
          },
        ]);

        // Seleciona um template inicial baseado na mensagem
        const { template, title } = await selectStarterTemplate({
          message: messageInput,
          model,
          provider,
        });

        // Se selecionou um template válido (não em branco)
        if (template !== 'blank') {
          // Tenta obter o template
          const temResp = await getTemplates(template, title).catch((e) => {
            // Trata erros de rate limit ou falha ao importar
            if (e.message.includes('rate limit')) {
              toast.warning('Rate limit exceeded. Skipping starter template\n Continuing with blank template');
            } else {
              toast.warning('Failed to import starter template\n Continuing with blank template');
            }
            return null;
          });

          // Se conseguiu obter o template com sucesso
          if (temResp) {
            const { assistantMessage, userMessage } = temResp;

            // Atualiza as mensagens com o contexto do template
            setMessages([
              {
                id: `${new Date().getTime()}`,
                role: 'user',
                content: messageInput,
              },
              {
                id: `${new Date().getTime()}`,
                role: 'assistant',
                content: assistantMessage,
              },
              {
                id: `${new Date().getTime()}`,
                role: 'user',
                content: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${userMessage}`,
                annotations: ['hidden'],
              },
            ]);

            // Recarrega o chat e desativa loading
            reload();
            setFakeLoading(false);

            return;
          } else {
            setMessages([
              {
                id: `${new Date().getTime()}`,
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalPrompt}`,
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
        } else {
          setMessages([
            {
              id: `${new Date().getTime()}`,
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalPrompt}`,
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
      }

      // Se houver modificações em arquivos, envia mensagem com essas modificações
      if (fileModifications !== undefined) {
        console.log('[ChatClient] Enviando mensagem com modificações de arquivo');
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalPrompt}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });

        /**
         * After sending a new message we reset all modifications since the model
         * should now be aware of all the changes.
         */
        workbenchStore.resetAllFileModifications();
      } else {
        console.log('[ChatClient] Enviando mensagem normal');
        append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model}]\n\n[Provider: ${provider.name}]\n\n${finalPrompt}`,
            },
            ...imageDataList.map((imageData) => ({
              type: 'image',
              image: imageData,
            })),
          ] as any,
        });
      }

      // Início da integração com Dify - Em paralelo com o fluxo existente
      try {
        console.log('[ChatClient] Iniciando comunicação com Dify');
        const difyResponse = await fetch('https://api.dify.ai/v1/chat-messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeys.Dify || 'app-4BBwXRVvg652KwZjXRoJibOS'}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {},
            query: typeof finalPrompt === 'string' ? finalPrompt : finalPrompt.text,
            response_mode: 'streaming',
            user: `user-${Date.now()}`,
          }),
        });

        console.log('🌐 Dify - Resposta recebida:', {
          status: difyResponse.status,
          statusText: difyResponse.statusText,
          headers: Object.fromEntries(difyResponse.headers.entries())
        });

        if (!difyResponse.ok) {
          const errorText = await difyResponse.text();
          console.error('❌ Dify - Erro:', errorText);
          stop();
        } else {
          const reader = difyResponse.body?.getReader();
          if (!reader) {
            throw new Error('Response body is null');
          }

          let accumulatedResponse = '';
          let buffer = '';
          let messageCreated = false;

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Dify - Stream finalizado. Resposta completa:', accumulatedResponse);
              stop();
              break;
            }

            const chunk = new TextDecoder().decode(value);
            console.log('📨 Dify - Chunk recebido:', chunk);
            
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  const data = JSON.parse(jsonStr);
                  
                  if (data.answer) {
                    accumulatedResponse += data.answer;
                    console.log('📨 Dify - Chunk processado:', data.answer);
                    
                    // Adiciona ou atualiza a mensagem do Dify no chat
                    setMessages((prev) => {
                      // Se ainda não criamos a mensagem, cria uma nova
                      if (!messageCreated) {
                        messageCreated = true;
                        return [
                          ...prev,
                          {
                            id: String(Date.now()),
                            role: 'assistant',
                            content: accumulatedResponse,
                          },
                        ];
                      }
                      
                      // Se já existe, atualiza o conteúdo
                      return prev.map((msg, index) => {
                        if (index === prev.length - 1) {
                          return {
                            ...msg,
                            content: accumulatedResponse,
                          };
                        }
                        return msg;
                      });
                    });
                  }
                } catch (e) {
                  console.error('❌ Dify - Erro ao processar chunk:', e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Dify - Erro:', error);
        stop();
      }
      // Fim da integração com Dify

      setInput('');
      Cookies.remove(PROMPT_COOKIE_KEY);

      // Add file cleanup here
      setUploadedFiles([]);
      setImageDataList([]);

      resetEnhancer();

      textareaRef.current?.blur();
      console.log('[ChatClient] Mensagem enviada com sucesso');
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
            return message;
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
      />
    );
  },
);
