import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

// this is used at the top level and never rejects
export async function openDatabase(): Promise<any> {
  try {
    const supabase = getOrCreateClient();
    return supabase;
  } catch (error) {
    logger.error('Falha ao conectar com Supabase:', error);
    return undefined;
  }
}

export async function getAll(db: any): Promise<ChatHistoryItem[]> {
  const { data: { user } } = await db.auth.getUser();
  
  if (!user) {
    logger.error('Usuário não autenticado');
    return [];
  }

  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });

  if (error) {
    logger.error('Falha ao buscar chats:', error);
    return [];
  }

  return data.map((chat: any) => ({
    id: chat.id,
    urlId: chat.url_id,
    description: chat.description,
    messages: chat.messages,
    timestamp: chat.timestamp,
  }));
}

export async function setMessages(
  db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
): Promise<void> {
  const { data: { user } } = await db.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await db
    .from('chats')
    .upsert({
      id,
      user_id: user.id,
      messages,
      url_id: urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    logger.error('Falha ao salvar mensagens:', error);
    throw error;
  }
}

export async function getMessages(db: any, id: string): Promise<ChatHistoryItem> {
  try {
    // Tenta primeiro buscar por url_id que é texto
    const byUrl = await getMessagesByUrlId(db, id);
    if (byUrl) return byUrl;
  } catch (error) {
    // Se falhar, tenta buscar por id (UUID)
    if (isValidUUID(id)) {
      return await getMessagesById(db, id);
    }
    throw error;
  }
  throw new Error('Chat não encontrado');
}

function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function getMessagesById(db: any, id: string): Promise<ChatHistoryItem> {
  if (!isValidUUID(id)) {
    throw new Error('ID inválido para busca por UUID');
  }

  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Falha ao buscar mensagens por ID:', error);
    throw error;
  }

  return {
    id: data.id,
    urlId: data.url_id,
    description: data.description,
    messages: data.messages,
    timestamp: data.timestamp,
  };
}

export async function getMessagesByUrlId(db: any, id: string): Promise<ChatHistoryItem> {
  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('url_id', id)
    .single();

  if (error) {
    logger.error('Falha ao buscar mensagens por URL ID:', error);
    throw error;
  }

  return {
    id: data.id,
    urlId: data.url_id,
    description: data.description,
    messages: data.messages,
    timestamp: data.timestamp,
  };
}

export async function deleteById(db: any, id: string): Promise<void> {
  const { error } = await db
    .from('chats')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Falha ao deletar chat:', error);
    throw error;
  }
}

export async function getNextId(db: any): Promise<string> {
  const { data: { user } } = await db.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await db
    .from('chats')
    .insert({
      user_id: user.id,
      messages: [],
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Falha ao gerar novo ID:', error);
    throw error;
  }

  return data.id;
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

export async function getUrlIds(db: any): Promise<string[]> {
  const { data, error } = await db
    .from('chats')
    .select('url_id')
    .not('url_id', 'is', null);

  if (error) {
    logger.error('Falha ao buscar URL IDs:', error);
    throw error;
  }

  return data.map((item: any) => item.url_id);
}

export async function forkChat(db: any, chatId: string, messageId: string): Promise<string> {
  const chat = await getMessages(db, chatId);

  if (!chat) {
    throw new Error('Chat não encontrado');
  }

  const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

  if (messageIndex === -1) {
    throw new Error('Mensagem não encontrada');
  }

  const messages = chat.messages.slice(0, messageIndex + 1);
  return createChatFromMessages(db, chat.description ? `${chat.description} (fork)` : 'Chat bifurcado', messages);
}

export async function duplicateChat(db: any, id: string): Promise<string> {
  const chat = await getMessages(db, id);

  if (!chat) {
    throw new Error('Chat não encontrado');
  }

  return createChatFromMessages(db, `${chat.description || 'Chat'} (cópia)`, chat.messages);
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
    throw new Error('Chat não encontrado');
  }

  if (!description.trim()) {
    throw new Error('Descrição não pode estar vazia');
  }

  await setMessages(db, id, chat.messages, chat.urlId, description, chat.timestamp);
}
