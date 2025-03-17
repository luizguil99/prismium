import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

export async function openDatabase(): Promise<any> {
  try {
    const supabase = getOrCreateClient();
    // Verify authentication immediately
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.error('User not authenticated:', error);
      return undefined;
    }
    return supabase;
  } catch (error) {
    logger.error('Failed to initialize Supabase client:', error);
    return undefined;
  }
}

export async function getAll(db: any): Promise<ChatHistoryItem[]> {
  const supabase = db;
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('Failed to fetch chats:', error);
    throw error;
  }

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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  if (timestamp && isNaN(Date.parse(timestamp))) {
    throw new Error('Invalid timestamp');
  }

  const data: any = {
    user_id: user.id,
    messages,
    urlId,
    description,
    timestamp: timestamp ?? new Date().toISOString(),
  };

  // Only include ID if it's a valid UUID
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    data.id = id;
  }

  const { error } = await supabase.from('chats').upsert(data, {
    onConflict: 'id',
    returning: 'minimal'
  });

  if (error) {
    logger.error('Failed to save messages:', error);
    throw error;
  }
}

export async function getMessages(db: any, id: string): Promise<ChatHistoryItem> {
  try {
    const result = await getMessagesById(db, id);
    if (result) return result;
    
    // If not found by ID, try by urlId
    return await getMessagesByUrlId(db, id);
  } catch (error) {
    if (error.code === '22P02') { // Invalid UUID error
      // Try fetching by urlId instead
      return await getMessagesByUrlId(db, id);
    }
    throw error;
  }
}

export async function getMessagesByUrlId(db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = db;
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('urlId', id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore not found error
    logger.error('Failed to fetch chat by urlId:', error);
    throw error;
  }

  return data;
}

export async function getMessagesById(db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = db;
  
  // Check if the ID is a UUID or a special identifier
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  let query;
  if (isUUID) {
    query = supabase
      .from('chats')
      .select('*')
      .eq('id', id);
  } else {
    // If not UUID, try to find by urlId
    query = supabase
      .from('chats')
      .select('*')
      .eq('urlId', id);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // Ignore not found error
    logger.error('Failed to fetch chat by id:', error);
    throw error;
  }

  return data;
}

export async function deleteById(db: any, id: string): Promise<void> {
  const supabase = db;
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete chat:', error);
    throw error;
  }
}

export async function getNextId(db: any): Promise<string> {
  return crypto.randomUUID();
}

export async function getUrlId(db: any, id: string): Promise<string> {
  const idList = await getUrlIds(db);

  if (!idList.includes(id)) {
    return id;
  } else {
    let i = 2;
    while (idList.includes(`${id}-${i}`)) {
      i++;
    }
    return `${id}-${i}`;
  }
}

async function getUrlIds(db: any): Promise<string[]> {
  const supabase = db;
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('chats')
    .select('urlId')
    .eq('user_id', user?.id);

  if (error) {
    logger.error('Failed to fetch urlIds:', error);
    throw error;
  }

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