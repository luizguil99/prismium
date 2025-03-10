import { getOrCreateClient } from '~/components/supabase/client';
import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';

const logger = createScopedLogger('ChatHistory');

// Substituindo IndexedDB pelo Supabase
export async function openDatabase(): Promise<any> {
  try {
    // Retorna o cliente Supabase
    return getOrCreateClient();
  } catch (error) {
    logger.error('Erro ao conectar com Supabase:', error);
    return undefined;
  }
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  const supabase = getOrCreateClient();
  
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    
    // Transformando os dados para o formato ChatHistoryItem
    return (data || []).map((chat: any) => ({
      id: chat.id,
      urlId: chat.urlId,
      description: chat.description,
      messages: chat.messages,
      timestamp: chat.timestamp,
    }));
  } catch (error) {
    logger.error('Erro ao buscar chats:', error);
    throw error;
  }
}

export async function setMessages(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
): Promise<void> {
  const supabase = getOrCreateClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    if (timestamp && isNaN(Date.parse(timestamp))) {
      throw new Error('Invalid timestamp');
    }
    
    const payload = {
      id,
      user_id: user.id,
      messages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
    };

    const { error } = await supabase.from('chats').upsert(payload);
    if (error) throw error;
  } catch (error) {
    logger.error('Erro ao salvar mensagens:', error);
    throw error;
  }
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  try {
    return await getMessagesById(_db, id) || await getMessagesByUrlId(_db, id);
  } catch (error) {
    logger.error('Erro ao buscar mensagens:', error);
    throw error;
  }
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = getOrCreateClient();
  
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('urlId', id)
      .single();
      
    if (error) throw error;
    return data as unknown as ChatHistoryItem;
  } catch (error) {
    logger.error('Erro ao buscar chat por urlId:', error);
    throw error;
  }
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  const supabase = getOrCreateClient();
  
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as unknown as ChatHistoryItem;
  } catch (error) {
    logger.error('Erro ao buscar chat por id:', error);
    throw error;
  }
}

export async function deleteById(_db: any, id: string): Promise<void> {
  const supabase = getOrCreateClient();
  
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    logger.error('Erro ao excluir chat:', error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  } else {
    return 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
  }
}

export async function getUrlId(_db: any, id: string): Promise<string> {
  const supabase = getOrCreateClient();
  let candidate = id;
  let suffix = 2;
  
  try {
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
        throw new Error('Não foi possível gerar um urlId único');
      }
    }
  } catch (error) {
    logger.error('Erro ao gerar urlId:', error);
    throw error;
  }
}

async function getUrlIds(_db: any): Promise<string[]> {
  const supabase = getOrCreateClient();
  
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('urlId');
      
    if (error) throw error;
    
    return (data || [])
      .map((item: any) => item.urlId)
      .filter((id: string | null) => id !== null);
  } catch (error) {
    logger.error('Erro ao buscar urlIds:', error);
    throw error;
  }
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  try {
    const chat = await getMessages(_db, chatId);

    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    // Encontra o índice da mensagem para bifurcar
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

    if (messageIndex === -1) {
      throw new Error('Mensagem não encontrada');
    }

    // Obtém mensagens até a mensagem selecionada (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);

    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (fork)` : 'Forked chat', 
      messages
    );
  } catch (error) {
    logger.error('Erro ao bifurcar chat:', error);
    throw error;
  }
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  try {
    const chat = await getMessages(_db, id);

    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    return createChatFromMessages(
      _db, 
      `${chat.description || 'Chat'} (copy)`, 
      chat.messages
    );
  } catch (error) {
    logger.error('Erro ao duplicar chat:', error);
    throw error;
  }
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[],
): Promise<string> {
  const supabase = getOrCreateClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    const newId = await getNextId(_db);
    const newUrlId = await getUrlId(_db, newId);
    
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id: newId,
        user_id: user.id,
        messages,
        urlId: newUrlId,
        description,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return newUrlId;
  } catch (error) {
    logger.error('Erro ao criar chat a partir de mensagens:', error);
    throw error;
  }
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  try {
    const chat = await getMessages(_db, id);

    if (!chat) {
      throw new Error('Chat não encontrado');
    }

    if (!description.trim()) {
      throw new Error('Descrição não pode estar vazia');
    }

    const supabase = getOrCreateClient();
    const { error } = await supabase
      .from('chats')
      .update({ description })
      .eq('id', chat.id);
      
    if (error) throw error;
  } catch (error) {
    logger.error('Erro ao atualizar descrição do chat:', error);
    throw error;
  }
}