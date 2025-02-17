import { getOrCreateClient } from '~/components/supabase/client';
import type { Message } from 'ai';
import type { ChatHistoryItem } from './useChatHistory';

// Usando Supabase em vez de IndexedDB
export async function openDatabase(): Promise<any> {
  // Retorna o cliente Supabase
  return getOrCreateClient();
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*');
  if (error) throw error;
  return data as unknown as ChatHistoryItem[];
}

export async function setMessages(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string
): Promise<void> {
  const supabase = getOrCreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = {
    id,
    user_id: user.id,
    messages,
    urlId: urlId,
    description,
    timestamp: timestamp || new Date().toISOString(),
  };

  const { error } = await supabase.from('chats').upsert(payload);
  if (error) throw error;
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('id', id).single();
  if (error) throw error;
  return data as unknown as ChatHistoryItem;
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = getOrCreateClient();
  const { data, error } = await supabase.from('chats').select('*').eq('urlId', id).single();
  if (error) throw error;
  return data as unknown as ChatHistoryItem;
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
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[]
): Promise<string> {
  const supabase = getOrCreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

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
