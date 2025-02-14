import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { supabase } from '../supabase/client';

const logger = createScopedLogger('SupabaseChatHistory');

// Não precisa mais do openDatabase pois o Supabase já está inicializado no client.ts

export async function getAll(): Promise<ChatHistoryItem[]> {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('Error fetching chats:', error);
    return [];
  }

  return chats.map((chat) => ({
    id: chat.id,
    messages: chat.messages,
    urlId: chat.url_id,
    description: chat.description,
    timestamp: chat.timestamp,
  }));
}

export async function setMessages(
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
): Promise<void> {
  if (timestamp && isNaN(Date.parse(timestamp))) {
    throw new Error('Invalid timestamp');
  }

  const { error } = await supabase
    .from('chats')
    .upsert({
      id,
      messages,
      url_id: urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
    });

  if (error) {
    logger.error('Error setting messages:', error);
    throw error;
  }
}

export async function getMessages(id: string): Promise<ChatHistoryItem> {
  return (await getMessagesById(id)) || (await getMessagesByUrlId(id));
}

export async function getMessagesByUrlId(id: string): Promise<ChatHistoryItem> {
  const { data: chat, error } = await supabase
    .from('chats')
    .select('*')
    .eq('url_id', id)
    .single();

  if (error) {
    logger.error('Error fetching chat by URL ID:', error);
    throw error;
  }

  return {
    id: chat.id,
    messages: chat.messages,
    urlId: chat.url_id,
    description: chat.description,
    timestamp: chat.timestamp,
  };
}

export async function getMessagesById(id: string): Promise<ChatHistoryItem> {
  const { data: chat, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Error fetching chat by ID:', error);
    throw error;
  }

  return {
    id: chat.id,
    messages: chat.messages,
    urlId: chat.url_id,
    description: chat.description,
    timestamp: chat.timestamp,
  };
}

export async function deleteById(id: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting chat:', error);
    throw error;
  }
}

export async function getNextId(): Promise<string> {
  // Com Supabase usamos UUID, então podemos gerar um novo
  return crypto.randomUUID();
}

export async function getUrlId(id: string): Promise<string> {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('url_id')
    .not('url_id', 'is', null);

  if (error) {
    logger.error('Error fetching URL IDs:', error);
    throw error;
  }

  const idList = chats.map(chat => chat.url_id);

  if (!idList.includes(id)) {
    return id;
  }

  let i = 2;
  while (idList.includes(`${id}-${i}`)) {
    i++;
  }

  return `${id}-${i}`;
}

export async function forkChat(chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(chatId);

  if (!chat) {
    throw new Error('Chat not found');
  }

  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Message not found');
  }

  const messages = chat.messages.slice(0, messageIndex + 1);

  return createChatFromMessages(
    chat.description ? `${chat.description} (fork)` : 'Forked chat',
    messages
  );
}

export async function duplicateChat(id: string): Promise<string> {
  const chat = await getMessages(id);

  if (!chat) {
    throw new Error('Chat not found');
  }

  return createChatFromMessages(
    `${chat.description || 'Chat'} (copy)`,
    chat.messages
  );
}

export async function createChatFromMessages(
  description: string,
  messages: Message[],
): Promise<string> {
  const id = await getNextId();
  await setMessages(id, messages, undefined, description);
  return id;
}

export async function updateChatDescription(id: string, description: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({ description })
    .eq('id', id);

  if (error) {
    logger.error('Error updating chat description:', error);
    throw error;
  }
}
