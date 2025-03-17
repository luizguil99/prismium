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

export async function openDatabase(): Promise<any> {
  try {
    const supabase = getOrCreateClient();
    logger.info('🔄 Initializing Supabase connection');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.error('❌ User not authenticated:', error);
      return undefined;
    }
    logger.info('✅ Supabase connection established');
    return supabase;
  } catch (error) {
    logger.error('❌ Failed to initialize Supabase client:', error);
    return undefined;
  }
}

export async function getAll(db: any): Promise<ChatHistoryItem[]> {
  const now = Date.now();

  // Return cached data if valid
  if (getAllCache && (now - getAllCache.timestamp) < CACHE_DURATION) {
    logger.info('✅ Using cached chat list');
    return getAllCache.data;
  }

  logger.info('🔄 REST: Fetching all chats');
  const supabase = db;
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('❌ REST: Failed to fetch chats:', error);
    throw error;
  }

  // Update cache
  getAllCache = {
    data: data || [],
    timestamp: now
  };

  logger.info(`✅ REST: Successfully fetched ${data?.length || 0} chats`);
  return data || [];
}

export async function setMessages(
  db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
): Promise<void> {
  const supabase = db;
  logger.info(`🔄 REST: Setting messages for chat ${id}`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error('❌ REST: User not authenticated');
    throw new Error('User must be authenticated');
  }

  if (timestamp && isNaN(Date.parse(timestamp))) {
    logger.error('❌ REST: Invalid timestamp format');
    throw new Error('Invalid timestamp');
  }

  const data: any = {
    user_id: user.id,
    messages,
    urlId,
    description,
    timestamp: timestamp ?? new Date().toISOString(),
  };

  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    data.id = id;
  }

  const { error } = await supabase.from('chats').upsert(data, {
    onConflict: 'id',
    returning: 'minimal'
  });

  if (error) {
    logger.error('❌ REST: Failed to save messages:', error);
    throw error;
  }

  invalidateGetAllCache(); // Invalidate cache after mutation
  logger.info('✅ REST: Successfully saved messages');
}

export async function getMessages(db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔄 REST: Fetching messages for ${id}`);
  try {
    const result = await getMessagesById(db, id);
    if (result) {
      logger.info('✅ REST: Successfully fetched messages by ID');
      return result;
    }
    
    logger.info('🔄 REST: ID not found, trying urlId');
    return await getMessagesByUrlId(db, id);
  } catch (error) {
    if (error.code === '22P02') {
      logger.info('🔄 REST: Invalid UUID, trying urlId');
      return await getMessagesByUrlId(db, id);
    }
    throw error;
  }
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
  return (data || []).map(chat => chat.urlId).filter(Boolean);
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
