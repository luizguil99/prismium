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
    
    // Verifica se o id é um UUID válido
    const uuidId = isValidUuid(id) ? id : await getNextId(_db);
    const effectiveUrlId = isValidUuid(id) ? urlId : id;
    
    const payload = {
      id: uuidId,
      user_id: user.id,
      messages,
      urlId: effectiveUrlId,
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
    // Primeiro tenta buscar pelo urlId (que pode ser qualquer string)
    try {
      return await getMessagesByUrlId(_db, id);
    } catch (error) {
      // Se não encontrar pelo urlId, tenta pelo id (se for um UUID válido)
      if (isValidUuid(id)) {
        return await getMessagesById(_db, id);
      }
      
      // Se não for UUID, propaga o erro original
      throw error;
    }
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
    // Verifica se o ID parece ser um UUID válido
    if (!isValidUuid(id)) {
      throw new Error(`invalid input syntax for type uuid: "${id}"`);
    }
    
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
    // Se for um UUID válido, deleta pelo ID
    if (isValidUuid(id)) {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } else {
      // Se não for UUID, tenta deletar pelo urlId
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('urlId', id);
        
      if (error) throw error;
    }
  } catch (error) {
    logger.error('Erro ao excluir chat:', error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  // Sempre usar crypto.randomUUID para garantir compatibilidade com o Supabase
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  } else {
    // Fallback para navegadores que não suportam crypto.randomUUID
    // Gera um UUID v4 manualmente
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Verifica se uma string é um UUID válido
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Função para migrar chats com IDs antigos (não-UUID) para o novo formato
 * Se o ID original não for UUID, cria um novo com UUID e preserva o ID original como urlId
 */
export async function migrateChat(_db: any, id: string): Promise<string> {
  try {
    // Verifica se o ID é UUID
    if (isValidUuid(id)) {
      return id; // Se já for UUID, não precisa migrar
    }
    
    // Tenta obter o chat pelo ID como urlId
    const chat = await getMessagesByUrlId(_db, id);
    
    if (!chat) {
      throw new Error(`Chat com ID ${id} não encontrado`);
    }
    
    // Gera um novo UUID para o chat
    const newId = await getNextId(_db);
    
    // Usa o ID antigo como urlId
    const { error } = await getOrCreateClient()
      .from('chats')
      .insert({
        id: newId,
        urlId: id,
        messages: chat.messages,
        description: chat.description,
        timestamp: chat.timestamp,
        user_id: (await getOrCreateClient().auth.getUser()).data.user?.id
      });
      
    if (error) throw error;
    
    logger.info(`Chat migrado com sucesso: ID antigo '${id}' → UUID '${newId}'`);
    return newId;
  } catch (error) {
    logger.error(`Erro ao migrar chat ${id}:`, error);
    throw error;
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
    // Busca o chat (getMessages já tenta pelos dois campos)
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
    let newUrlId = await getUrlId(_db, description.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30));
    
    if (!newUrlId) {
      // Fallback para um ID amigável baseado na data
      newUrlId = `chat-${new Date().toISOString().slice(0, 10)}`;
    }
    
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