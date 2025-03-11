import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useCallback } from 'react';
import { atom } from 'nanostores';
import { generateId, type JSONValue, type Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { logStore } from '~/lib/stores/logs'; // Import logStore
import {
  getMessages,
  getNextId,
  getUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
  type IChatMetadata
} from './db';
import type { FileMap } from '~/lib/stores/files';
import { webcontainer } from '~/lib/webcontainer';
import { createCommandsMessage, detectProjectCommands } from '~/utils/projectCommands';
import type { ContextAnnotation } from '~/types/context';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: IChatMetadata;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

export const db = persistenceEnabled ? await openDatabase() : undefined;

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);

// Debounce mechanism for storeMessageHistory
let storeMessageHistoryTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_INTERVAL = 1000; // 1 second

export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    if (!db) {
      setReady(true);

      if (persistenceEnabled) {
        const error = new Error('Chat persistence is unavailable');
        logStore.logError('Chat persistence initialization failed', error);
        toast.error('Chat persistence is unavailable');
      }

      return;
    }

    if (mixedId) {
      getMessages(db, mixedId)
        .then(async (storedMessages) => {
          if (storedMessages && storedMessages.messages.length > 0) {
            const rewindId = searchParams.get('rewindTo');
            const filteredMessages = rewindId
              ? storedMessages.messages.slice(0, storedMessages.messages.findIndex((m) => m.id === rewindId) + 1)
              : storedMessages.messages;

            setInitialMessages(filteredMessages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
            
            // Ensure we have a valid metadata object
            if (storedMessages.metadata) {
              console.log('Metadata loaded:', storedMessages.metadata);
              chatMetadata.set(storedMessages.metadata);
            } else {
              console.log('No metadata found, initializing empty');
              chatMetadata.set({});
            }
          } else {
            navigate('/', { replace: true });
          }

          setReady(true);
        })
        .catch((error) => {
          console.error(error);

          logStore.logError('Failed to load chat messages', error);
          toast.error('Failed to load chat messages');
        });
    }
  }, [mixedId]);

  return {
    ready: !mixedId || ready,
    initialMessages,
    archivedMessages,
    updateChatMetadata: async (metadata: IChatMetadata, id = chatId.get()) => {
      if (!db || !id) {
        return;
      }

      try {
        console.log('Updating chat metadata:', metadata);
        await setMessages(db, id, initialMessages, urlId, description.get(), undefined, metadata);
        chatMetadata.set(metadata);
      } catch (error) {
        console.error('Error updating chat metadata:', error);
        toast.error('Failed to update chat metadata');
      }
    },
    storeMessageHistory: async (messages: Message[]) => {
      if (!db || messages.length === 0) {
        return;
      }

      // Debounce implementation to prevent multiple sequential calls
      return new Promise<void>((resolve) => {
        // Clear previous timer if exists
        if (storeMessageHistoryTimer) {
          clearTimeout(storeMessageHistoryTimer);
        }

        // Create new timer for debounce
        storeMessageHistoryTimer = setTimeout(async () => {
          const { firstArtifact } = workbenchStore;
          
          // Log for debugging message size
          const totalContentSize = messages.reduce((sum, msg) => {
            return sum + (typeof msg.content === 'string' ? msg.content.length : 0);
          }, 0);
          console.log(`Saving messages: ${messages.length} messages, total size: ${totalContentSize} characters`);

          if (!urlId && firstArtifact?.id) {
            try {
              const newUrlId = await getUrlId(db, firstArtifact.id);
              navigateChat(newUrlId);
              setUrlId(newUrlId);
            } catch (error) {
              console.error('Error generating urlId:', error);
              logStore.logError('Error generating urlId', error);
            }
          }

          if (!description.get() && firstArtifact?.title) {
            description.set(firstArtifact?.title);
          }

          if (initialMessages.length === 0 && !chatId.get()) {
            try {
              const nextId = await getNextId(db);
              chatId.set(nextId);

              if (!urlId) {
                navigateChat(nextId);
              }
            } catch (error) {
              console.error('Error generating id:', error);
              logStore.logError('Error generating id', error);
            }
          }

          try {
            const currentChatId = chatId.get() as string;
            
            // Verify chat ID is valid before saving
            if (!currentChatId) {
              console.warn('Attempt to save messages without valid chat ID');
              resolve();
              return;
            }
            
            const currentMetadata = chatMetadata.get();
            
            await setMessages(
              db, 
              currentChatId, 
              messages, 
              urlId, 
              description.get(), 
              undefined, // timestamp
              currentMetadata
            );
            
            console.log(`Messages saved successfully for chat ${currentChatId}`);
            resolve();
          } catch (error) {
            console.error('Error saving messages:', error);
            logStore.logError('Error saving messages', error);
            toast.error('Failed to save chat history');
            resolve();
          }
        }, DEBOUNCE_INTERVAL);
      });
    },
    duplicateCurrentChat: async (listItemId: string) => {
      if (!db || (!mixedId && !listItemId)) {
        return;
      }

      try {
        const newId = await duplicateChat(db, mixedId || listItemId);
        navigate(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.log(error);
      }
    },
    importChat: async (description: string, messages: Message[]) => {
      if (!db) {
        return;
      }

      try {
        const newId = await createChatFromMessages(db, description, messages);
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        if (error instanceof Error) {
          toast.error('Failed to import chat: ' + error.message);
        } else {
          toast.error('Failed to import chat');
        }
      }
    },
    exportChat: async (id = urlId) => {
      if (!db || !id) {
        return;
      }

      const chat = await getMessages(db, id);
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
  /**
   * FIXME: Using the intended navigate function causes a rerender for <Chat /> that breaks the app.
   *
   * `navigate(`/chat/${nextId}`, { replace: true });`
   */
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}
