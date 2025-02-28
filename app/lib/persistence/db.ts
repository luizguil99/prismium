import { getOrCreateClient } from '~/components/supabase/client';
import type { Message } from 'ai';
import type { ChatHistoryItem } from './useChatHistory';

// Usando Supabase em vez de IndexedDB
export async function openDatabase(): Promise<any> {
  console.log('🔄 Initializing database connection...');
  const client = getOrCreateClient();
  console.log('✅ Database connection initialized');
  return client;
}

// Cache system
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos
const messageCache = new Map<string, CacheItem<ChatHistoryItem>>();
const allChatsCache = new Map<string, CacheItem<ChatHistoryItem[]>>();

function getCachedItem<T>(cache: Map<string, CacheItem<T>>, key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  if (now - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCacheItem<T>(cache: Map<string, CacheItem<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache() {
  messageCache.clear();
  allChatsCache.clear();
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  const cacheKey = 'all_chats';
  const cachedData = getCachedItem(allChatsCache, cacheKey);
  if (cachedData) {
    console.log('📦 Returning cached chats');
    return cachedData;
  }

  console.log('📥 Fetching all chats...');
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*');
  if (error) {
    console.error('❌ Error fetching chats:', error);
    throw error;
  }

  const chats = data as unknown as ChatHistoryItem[];
  setCacheItem(allChatsCache, cacheKey, chats);
  console.log(`✅ Successfully fetched ${chats.length} chats`);
  return chats;
}

// Batch queue para otimizar salvamentos
const messageQueue = new Map<string, {
  payload: any,
  resolve: () => void,
  reject: (error: any) => void
}>();

let batchSaveTimeout: NodeJS.Timeout | null = null;
const BATCH_SAVE_DELAY = 300; // ms

async function processBatchSave() {
  if (messageQueue.size === 0) return;
  
  const supabase = getOrCreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    messageQueue.forEach(({reject}) => reject(new Error('User not authenticated')));
    messageQueue.clear();
    return;
  }

  const batchPayload = Array.from(messageQueue.entries()).map(([id, {payload}]) => ({
    ...payload,
    user_id: user.id
  }));

  try {
    const { error } = await supabase.from('chats').upsert(batchPayload);
    if (error) throw error;
    messageQueue.forEach(({resolve}) => resolve());
  } catch (error) {
    messageQueue.forEach(({reject}) => reject(error));
  } finally {
    messageQueue.clear();
    invalidateCache();
  }
}

export async function setMessages(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = {
      id,
      messages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString()
    };

    messageQueue.set(id, { payload, resolve, reject });

    if (batchSaveTimeout) {
      clearTimeout(batchSaveTimeout);
    }

    batchSaveTimeout = setTimeout(processBatchSave, BATCH_SAVE_DELAY);
  });
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  const cachedData = getCachedItem(messageCache, id);
  if (cachedData) {
    console.log('📦 Returning cached message by id');
    return cachedData;
  }

  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('id', id).single();
  if (error) throw error;

  const chat = data as unknown as ChatHistoryItem;
  setCacheItem(messageCache, id, chat);
  return chat;
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  const cachedData = getCachedItem(messageCache, `url_${id}`);
  if (cachedData) {
    console.log('📦 Returning cached message by urlId');
    return cachedData;
  }

  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('urlId', id).single();
  if (error) throw error;

  const chat = data as unknown as ChatHistoryItem;
  setCacheItem(messageCache, `url_${id}`, chat);
  return chat;
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  try {
    return await getMessagesById(_db, id);
  } catch (e) {
    return await getMessagesByUrlId(_db, id);
  }
}

export async function deleteById(_db: any, id: string): Promise<void> {
  const supabase = getOrCreateClient();
  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) throw error;

  // Invalidate cache after deletion
  invalidateCache();
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[]
): Promise<string> {
  const supabase = getOrCreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: user.id,
      messages,
      description,
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) throw error;
  const chat = (data && data[0]) as any;
  const newUrlId = chat.urlId ? chat.urlId : chat.id;
  if (!chat.urlId) {
    const { error: updateError } = await supabase.from('chats').update({ urlId: newUrlId }).eq('id', chat.id);
    if (updateError) throw updateError;
  }
  return newUrlId;
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  const chat = await getMessages(_db, id);
  if (!chat) throw new Error('Chat not found');
  return createChatFromMessages(
    _db,
    chat.description ? `${chat.description} (copy)` : 'Chat (copy)',
    chat.messages
  );
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(_db, chatId);
  if (!chat) throw new Error('Chat not found');
  const messages: Message[] = Array.isArray(chat.messages) ? chat.messages : [];
  const messageIndex = messages.findIndex((msg: any) => msg.id === messageId);
  if (messageIndex === -1) throw new Error('Message not found');
  const forkMessages = messages.slice(0, messageIndex + 1);
  return createChatFromMessages(
    _db,
    chat.description ? `${chat.description} (fork)` : 'Forked chat',
    forkMessages
  );
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  const chat = await getMessages(_db, id);
  if (!chat) throw new Error('Chat not found');
  if (!description.trim()) throw new Error('Description cannot be empty');

  const supabase = getOrCreateClient();
  const { error } = await supabase.from('chats').update({ description }).eq('id', chat.id);
  if (error) throw error;
}

// Adicionando getNextId para compatibilidade com useChatHistory.ts
export async function getNextId(_db: any): Promise<string> {
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  } else {
    return 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
  }
}

// Adicionando getUrlId para compatibilidade com useChatHistory.ts
export async function getUrlId(_db: any, id: string): Promise<string> {
  const supabase = getOrCreateClient();
  let candidate = id;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from('chats')
      .select('id')
      .eq('urlId', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return candidate;
    }
    candidate = `${id}-${suffix}`;
    suffix++;
    if (suffix > 100) {
      throw new Error('Unable to generate unique urlId');
    }
  }
}
