import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { atom } from 'nanostores';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { logStore } from '~/lib/stores/logs';
import { getOrCreateClient } from '~/components/supabase/client';
import {
  getMessages,
  getNextId,
  getUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
} from './db';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

// Tenta inicializar o IndexedDB primeiro
export const db = persistenceEnabled ? await openDatabase() : undefined;

// Tenta inicializar o Supabase como fallback
let supabase: any;
try {
  if (!db && persistenceEnabled) {
    console.log('📦 IndexedDB não disponível, tentando Supabase...');
    supabase = getOrCreateClient();
    console.log('✅ Supabase inicializado com sucesso');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Supabase:', error);
  supabase = undefined;
}

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    if (!db && !supabase) {
      setReady(true);

      if (persistenceEnabled) {
        const error = new Error('Chat persistence is unavailable');
        logStore.logError('Chat persistence initialization failed', error);
        toast.error('Chat persistence is unavailable');
      }

      return;
    }

    if (mixedId) {
      const loadChat = async () => {
        try {
          const storage = db || supabase;
          
          // Usa a função getMessages que já implementa a lógica de fallback
          const chat = await getMessages(storage, mixedId);
          
          if (chat) {
            const rewindId = searchParams.get('rewindTo');
            const filteredMessages = rewindId
              ? chat.messages.slice(0, chat.messages.findIndex((m) => m.id === rewindId) + 1)
              : chat.messages;

            setInitialMessages(filteredMessages);
            setUrlId(chat.urlId);
            description.set(chat.description);
            chatId.set(chat.id);
            setReady(true);
            return;
          }

          // Se não encontrou, cria novo
          const newId = await getNextId(storage);
          chatId.set(newId);
          const newUrlId = await getUrlId(storage, mixedId);
          setUrlId(newUrlId);
          setReady(true);

        } catch (error) {
          console.error('Erro ao carregar chat:', error);
          logStore.logError('Failed to load chat', error);
          
          let errorMessage = 'Erro ao carregar chat';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as { message: string }).message;
          }
          
          toast.error(errorMessage);
          setReady(true);
        }
      };

      loadChat();
    } else {
      setReady(true);
    }
  }, []);

  return {
    ready: !mixedId || ready,
    initialMessages,
    storeMessageHistory: async (messages: Message[]) => {
      const storage = db || supabase;
      if (!storage || messages.length === 0) {
        return;
      }

      const { firstArtifact } = workbenchStore;

      if (!urlId && firstArtifact?.id) {
        const nextUrlId = await getUrlId(storage, firstArtifact.id);
        navigateChat(nextUrlId);
        setUrlId(nextUrlId);
      }

      if (!description.get() && firstArtifact?.title) {
        description.set(firstArtifact?.title);
      }

      if (initialMessages.length === 0 && !chatId.get()) {
        const nextId = await getNextId(storage);
        chatId.set(nextId);

        if (!urlId) {
          navigateChat(nextId);
        }
      }

      await setMessages(storage, chatId.get() as string, messages, urlId, description.get());
    },
    duplicateCurrentChat: async (listItemId: string) => {
      const storage = db || supabase;
      if (!storage || (!mixedId && !listItemId)) {
        return;
      }

      try {
        const newId = await duplicateChat(storage, mixedId || listItemId);
        navigate(`/chat/${newId}`);
        toast.success('Chat duplicado com sucesso');
      } catch (error) {
        toast.error('Falha ao duplicar chat');
        console.error(error);
      }
    },
    importChat: async (description: string, messages: Message[]) => {
      const storage = db || supabase;
      if (!storage) {
        return;
      }

      try {
        const newId = await createChatFromMessages(storage, description, messages);
        window.location.href = `/chat/${newId}`;
        toast.success('Chat importado com sucesso');
      } catch (error) {
        if (error instanceof Error) {
          toast.error('Falha ao importar chat: ' + error.message);
        } else {
          toast.error('Falha ao importar chat');
        }
      }
    },
    exportChat: async (id = urlId) => {
      const storage = db || supabase;
      if (!storage || !id) {
        return;
      }

      const chat = await getMessages(storage, id);
      const chatData = {
        messages: chat.messages,
        description: chat.description,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}

function navigateChat(nextId: string) {
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;
  window.history.replaceState({}, '', url);
}