import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

// Cache structure for getAll results
interface CacheEntry {
  data: ChatHistoryItem[];
  timestamp: number;
}

const CACHE_DURATION = 30000; // 30 seconds cache
let getAllCache: CacheEntry | null = null;
let realtimeSubscription: any = null;
let realtimeStore = new Map<string, ChatHistoryItem>();

// Definir a interface de metadados do chat que estava faltando
export interface IChatMetadata {
  [key: string]: any;
}

export async function openDatabase(): Promise<any> {
  try {
    const supabase = getOrCreateClient();
    logger.info('🔄 Initializing Supabase connection');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.error('❌ User not authenticated:', error);
      return undefined;
    }

    // Setup enhanced realtime subscription
    await setupEnhancedRealtimeSubscription(supabase, user.id);

    logger.info('✅ Supabase connection established');
    return supabase;
  } catch (error) {
    logger.error('❌ Failed to initialize Supabase client:', error);
    return undefined;
  }
}

async function setupEnhancedRealtimeSubscription(supabase: any, userId: string) {
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe();
  }

  // Initial data load
  const { data: initialData } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId);

  // Populate realtime store
  if (initialData) {
    initialData.forEach((chat: ChatHistoryItem) => {
      realtimeStore.set(chat.id, chat);
    });
  }

  realtimeSubscription = supabase
    .channel('chat-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${userId}`
      },
      (payload: any) => {
        logger.info(`🔄 Realtime event received: ${payload.eventType}`);
        
        switch (payload.eventType) {
          case 'INSERT':
          case 'UPDATE':
            realtimeStore.set(payload.new.id, payload.new);
            break;
          case 'DELETE':
            realtimeStore.delete(payload.old.id);
            break;
        }
        
        invalidateGetAllCache();
      }
    )
    .subscribe((status: string) => {
      logger.info(`✅ Realtime subscription status: ${status}`);
    });
}

// Add cleanup function for realtime subscription
export function cleanupRealtimeSubscription() {
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe();
    realtimeSubscription = null;
    logger.info('✅ Realtime subscription cleaned up');
  }
}

export async function getAll(db: any): Promise<ChatHistoryItem[]> {
  // Return from realtime store if available
  if (realtimeStore.size > 0) {
    return Array.from(realtimeStore.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Fallback to REST if realtime store is empty
  const { data, error } = await db
    .from('chats')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('❌ REST: Failed to fetch chats:', error);
    throw error;
  }

  // Update realtime store
  data?.forEach((chat: ChatHistoryItem) => {
    realtimeStore.set(chat.id, chat);
  });

  return data || [];
}

export async function setMessages(
  db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata
): Promise<void> {
  const supabase = db;
  logger.info(`🔄 Setting messages for chat ${id}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error('❌ User not authenticated');
    throw new Error('User must be authenticated');
  }

  // Extrair urlId da URL atual se não fornecido
  if (!urlId) {
    const pathSegments = window.location.pathname.split('/');
    urlId = pathSegments[pathSegments.length - 1];
    // Se o último segmento for 'chat', use o ID
    if (urlId === 'chat') {
      urlId = id;
    }
  }

  const data = {
    id,
    user_id: user.id,
    messages,
    urlId,
    description: description || 'New Chat',
    metadata: metadata || {},
    timestamp: timestamp ?? new Date().toISOString(),
  };

  const { error } = await supabase
    .from('chats')
    .upsert(data, {
      onConflict: 'id',
      returning: 'minimal'
    });

  if (error) {
    logger.error('❌ Failed to save messages:', error);
    throw error;
  }

  // Atualizar realtime store
  realtimeStore.set(id, data as ChatHistoryItem);
  logger.info(`✅ Successfully saved chat ${id} with urlId ${urlId}`);
}

export async function getMessages(db: any, id: string): Promise<ChatHistoryItem> {
  // Try from realtime store first
  const cachedChat = realtimeStore.get(id);
  if (cachedChat) {
    return cachedChat;
  }

  // Fallback to REST
  const chat = await getMessagesById(db, id) || await getMessagesByUrlId(db, id);
  
  if (chat) {
    realtimeStore.set(chat.id, chat);
  }
  
  return chat;
}

export async function getMessagesByUrlId(db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔄 REST: Fetching messages by urlId: ${id}`);
  const supabase = db;
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('urlId', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('❌ REST: Failed to fetch chat by urlId:', error);
    throw error;
  }

  logger.info('✅ REST: Successfully fetched messages by urlId');
  return data;
}

export async function getMessagesById(db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔄 REST: Fetching messages by ID: ${id}`);
  const supabase = db;
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  let query;
  if (isUUID) {
    logger.info('🔄 REST: Using UUID query');
    query = supabase
      .from('chats')
      .select('*')
      .eq('id', id);
  } else {
    logger.info('🔄 REST: Using urlId query');
    query = supabase
      .from('chats')
      .select('*')
      .eq('urlId', id);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    logger.error('❌ REST: Failed to fetch chat by id:', error);
    throw error;
  }

  logger.info('✅ REST: Successfully fetched messages by ID');
  return data;
}

export async function deleteById(db: any, id: string): Promise<void> {
  logger.info(`🔄 REST: Deleting chat with ID: ${id}`);
  const supabase = db;
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('❌ REST: Failed to delete chat:', error);
    throw error;
  }

  invalidateGetAllCache(); // Invalidate cache after deletion
  logger.info('✅ REST: Successfully deleted chat');
}

/**
 * Delete multiple chats by their IDs in a single operation
 * @param db Supabase client
 * @param ids Array of chat IDs to delete
 * @returns Promise<void>
 */
export async function deleteMultipleById(db: any, ids: string[]): Promise<void> {
  if (!ids.length) {
    logger.info('ℹ️ No chats to delete');
    return;
  }

  logger.info(`🔄 REST: Batch deleting ${ids.length} chats`);
  const supabase = db;
  
  const { error } = await supabase
    .from('chats')
    .delete()
    .in('id', ids);

  if (error) {
    logger.error('❌ REST: Failed to batch delete chats:', error);
    throw error;
  }

  invalidateGetAllCache(); // Invalidate cache after deletion
  logger.info(`✅ REST: Successfully batch deleted ${ids.length} chats`);
}

export async function getNextId(db: any): Promise<string> {
  logger.info('🔄 REST: Generating next ID');
  return crypto.randomUUID();
}

export async function getUrlId(db: any, id: string): Promise<string> {
  logger.info(`🔄 REST: Getting URL ID for: ${id}`);
  const idList = await getUrlIds(db);

  if (!idList.includes(id)) {
    logger.info('✅ REST: URL ID available');
    return id;
  } else {
    let i = 2;
    while (idList.includes(`${id}-${i}`)) {
      i++;
    }
    logger.info(`✅ REST: Generated unique URL ID: ${id}-${i}`);
    return `${id}-${i}`;
  }
}

async function getUrlIds(db: any): Promise<string[]> {
  logger.info('🔄 REST: Fetching all URL IDs');
  const supabase = db;
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('chats')
    .select('urlId')
    .eq('user_id', user?.id);

  if (error) {
    logger.error('❌ REST: Failed to fetch urlIds:', error);
    throw error;
  }

  logger.info(`✅ REST: Successfully fetched ${data?.length || 0} URL IDs`);
  return (data || []).map((chat: any) => chat.urlId).filter(Boolean);
}

export async function forkChat(db: any, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Forked chat', messages);
}

export async function duplicateChat(db: any, id: string): Promise<string> {
  const chat = await getMessages(db, id);
  if (!chat) {
    throw new Error('Chat not found');
  }

  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId);

  const newChat = {
    id: newId,
    user_id: user.id,
    messages: chat.messages,
    urlId: newUrlId,
    description: `${chat.description || 'Chat'} (copy)`,
    timestamp: new Date().toISOString()
  };

  const { error } = await db.from('chats').insert(newChat);
  if (error) {
    throw error;
  }

  invalidateGetAllCache(); // Invalidate cache after duplication
  return newUrlId;
}

export async function createChatFromMessages(
  db: any,
  description: string,
  messages: Message[],
): Promise<string> {
  const newId = await getNextId(db);
  const newUrlId = await getUrlId(db, newId);

  await setMessages(
    db,
    newId,
    messages,
    newUrlId,
    description,
  );

  return newUrlId;
}

export async function updateChatDescription(db: any, id: string, description: string): Promise<void> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!description.trim()) {
    throw new Error('Description cannot be empty');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp);
}
// Function to invalidate cache when needed (e.g., after mutations)
export function invalidateGetAllCache(): void {
  getAllCache = null;
  logger.info('🔄 Chat list cache invalidated');
}
