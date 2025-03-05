import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

export interface IChatMetadata {
  // Interface para metadados adicionais do chat
  [key: string]: any;
}

// ===== FUNÇÕES UTILITÁRIAS =====

// Verifica se uma string é um UUID válido
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Obtém o usuário autenticado ou lança erro
async function getAuthenticatedUser() {
  const supabase = getOrCreateClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    logger.error('❌ Erro ao verificar autenticação:', authError);
    throw authError;
  }
  
  if (!user) {
    logger.error('❌ Usuário não autenticado');
    throw new Error('Usuário não autenticado');
  }
  
  return user;
}

// Busca um chat pelo ID ou urlId
async function findChat(id: string, select = '*'): Promise<any> {
  const supabase = getOrCreateClient();
  let query;
  
  if (isValidUUID(id)) {
    query = supabase.from('chats').select(select).eq('id', id).single();
  } else {
    query = supabase.from('chats').select(select).eq('urlId', id).maybeSingle();
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error(`❌ Erro ao buscar chat ${id}:`, error);
    throw error;
  }
  
  return data;
}

// ===== PRINCIPAIS FUNÇÕES DA API =====

export async function openDatabase(): Promise<any> {
  logger.info('🔌 Iniciando conexão com Supabase');
  try {
    const client = getOrCreateClient();
    logger.info('✅ Conexão com Supabase estabelecida');
    return client;
  } catch (error) {
    logger.error('❌ Falha ao conectar com Supabase:', error);
    return undefined;
  }
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  logger.info('📋 Buscando todos os chats');
  try {
    const startTime = performance.now();
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chats recuperados (${data?.length || 0} itens, ${duration}ms)`);
    return (data || []) as unknown as ChatHistoryItem[];
  } catch (error) {
    logger.error('❌ Erro ao buscar todos os chats:', error);
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
  metadata?: IChatMetadata
): Promise<void> {
  logger.info(`💾 Salvando mensagens para chat ${id}`);
  try {
    const startTime = performance.now();
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    
    if (timestamp && isNaN(Date.parse(timestamp))) {
      throw new Error('Timestamp inválido');
    }

    const payload = {
      id,
      user_id: user.id,
      messages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata
    };

    const { error } = await supabase.from('chats').upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
    
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Mensagens salvas para chat ${id} (${duration}ms)`);
  } catch (error) {
    logger.error('❌ Erro ao salvar mensagens:', error);
    throw error;
  }
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando mensagens para id: ${id}`);
  try {
    const data = await findChat(id);
    if (!data) throw new Error(`Chat não encontrado: ${id}`);
    logger.info(`✅ Chat recuperado: ${id}`);
    return data as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens para id ${id}:`, error);
    throw error;
  }
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  return getMessages(_db, id);
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  return getMessages(_db, id);
}

export async function deleteById(_db: any, id: string): Promise<void> {
  logger.info(`🗑️ Deletando chat por ID: ${id}`);
  try {
    const startTime = performance.now();
    const supabase = getOrCreateClient();
    
    // Buscar o chat primeiro para garantir que existe e obter o ID real se for urlId
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error(`Chat não encontrado: ${id}`);
    
    const { error } = await supabase.from('chats').delete().eq('id', chat.id);
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chat ${id} deletado com sucesso (${duration}ms)`);
  } catch (error) {
    logger.error(`❌ Erro ao deletar chat ${id}:`, error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  logger.info('🆔 Gerando novo ID');
  if (crypto && typeof crypto.randomUUID === 'function') {
    const id = crypto.randomUUID();
    logger.info(`✅ Novo ID gerado: ${id}`);
    return id;
  } else {
    const id = 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
    logger.info(`✅ Novo ID gerado (fallback): ${id}`);
    return id;
  }
}

export async function getUrlId(_db: any, id: string): Promise<string> {
  logger.info(`🔗 Gerando urlId para ID: ${id}`);
  try {
    const startTime = performance.now();
    const supabase = getOrCreateClient();
    let candidate = id;
    let suffix = 2;
    
    while (true) {
      const { data } = await supabase
        .from('chats')
        .select('id')
        .eq('urlId', candidate)
        .maybeSingle();
      
      if (!data) {
        const duration = Math.round(performance.now() - startTime);
        logger.info(`✅ urlId único gerado: ${candidate} (${duration}ms)`);
        return candidate;
      }
      
      logger.info(`⚠️ urlId ${candidate} já existe, tentando ${id}-${suffix}`);
      candidate = `${id}-${suffix}`;
      suffix++;
      
      if (suffix > 100) {
        throw new Error('Não foi possível gerar um urlId único');
      }
    }
  } catch (error) {
    logger.error(`❌ Erro ao gerar urlId para ${id}:`, error);
    throw error;
  }
}

async function getUrlIds(_db: any): Promise<string[]> {
  logger.info('🔗 Buscando todos os urlIds');
  try {
    const supabase = getOrCreateClient();
    const { data, error } = await supabase
      .from('chats')
      .select('urlId')
      .not('urlId', 'is', null);
    
    if (error) throw error;
    
    const urlIds = data?.map((item: { urlId: string }) => item.urlId).filter(Boolean) || [];
    logger.info(`✅ ${urlIds.length} urlIds recuperados`);
    return urlIds;
  } catch (error) {
    logger.error('❌ Erro ao buscar urlIds:', error);
    throw error;
  }
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  logger.info(`🍴 Criando fork de chat ${chatId} a partir da mensagem ${messageId}`);
  try {
    const startTime = performance.now();
    const chat = await getMessages(_db, chatId);
    
    // Encontra o índice da mensagem para fazer o fork
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) throw new Error('Mensagem não encontrada');

    // Obtém mensagens até a mensagem selecionada (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);
    
    const newUrlId = await createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (fork)` : 'Forked chat', 
      messages,
      chat.metadata
    );
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Fork criado com sucesso: ${newUrlId} (${duration}ms)`);
    return newUrlId;
  } catch (error) {
    logger.error(`❌ Erro ao fazer fork do chat ${chatId}:`, error);
    throw error;
  }
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  logger.info(`🔄 Duplicando chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    const newUrlId = await createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (copy)` : 'Chat (copy)', 
      chat.messages,
      chat.metadata
    );
    logger.info(`✅ Chat duplicado com sucesso: ${newUrlId}`);
    return newUrlId;
  } catch (error) {
    logger.error(`❌ Erro ao duplicar chat ${id}:`, error);
    throw error;
  }
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata
): Promise<string> {
  logger.info(`📝 Criando novo chat com ${messages.length} mensagens`);
  try {
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    const id = await getNextId(_db);
    
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id,
        user_id: user.id,
        messages,
        description,
        timestamp: new Date().toISOString(),
        metadata
      })
      .select();
    
    if (error) throw error;
    
    const chat = (data && data[0]) as any;
    if (!chat) throw new Error('Falha ao criar chat');
    
    const newUrlId = chat.urlId || id;
    if (!chat.urlId) {
      await supabase
        .from('chats')
        .update({ urlId: newUrlId })
        .eq('id', chat.id);
    }
    
    logger.info(`✅ Chat criado com sucesso: ${newUrlId}`);
    return newUrlId;
  } catch (error) {
    logger.error('❌ Erro ao criar chat a partir de mensagens:', error);
    throw error;
  }
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  logger.info(`📝 Atualizando descrição do chat ${id}`);
  try {
    if (!description.trim()) throw new Error('A descrição não pode estar vazia');
    
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error('Chat não encontrado');
    
    const supabase = getOrCreateClient();
    const { error } = await supabase
      .from('chats')
      .update({ description })
      .eq('id', chat.id);
    
    if (error) throw error;
    logger.info(`✅ Descrição atualizada com sucesso`);
  } catch (error) {
    logger.error(`❌ Erro ao atualizar descrição do chat ${id}:`, error);
    throw error;
  }
}

// ===== FUNÇÕES PARA SNAPSHOTS =====

export async function saveSnapshot(_db: any, id: string, snapshot: any): Promise<void> {
  logger.info(`💾 Salvando snapshot para chat ${id}`);
  try {
    const supabase = getOrCreateClient();
    
    // Tentar encontrar o chat existente
    let chatId = id;
    let needsCreate = false;
    
    if (!isValidUUID(id)) {
      const chat = await findChat(id, 'id, metadata');
      if (chat) {
        chatId = chat.id;
      } else {
        needsCreate = true;
      }
    }
    
    // Criar novo chat se necessário
    if (needsCreate) {
      const user = await getAuthenticatedUser();
      const newUUID = crypto.randomUUID();
      
      await supabase.from('chats').insert({
        id: newUUID,
        user_id: user.id,
        urlId: id,
        description: 'Snapshot Chat',
        messages: [],
        timestamp: new Date().toISOString(),
        metadata: { snapshot }
      });
      
      logger.info(`✅ Criado novo chat com urlId ${id} para snapshot`);
    } else {
      // Atualizar chat existente
      const chat = await findChat(chatId, 'metadata');
      
      const metadata = {
        ...(chat?.metadata || {}),
        snapshot
      };
      
      await supabase
        .from('chats')
        .update({ metadata })
        .eq('id', chatId);
      
      logger.info(`✅ Snapshot atualizado para chat ${id}`);
    }
  } catch (error) {
    logger.error(`❌ Erro ao salvar snapshot:`, error);
    throw error;
  }
}

export async function getSnapshot(_db: any, id: string): Promise<any> {
  logger.info(`🔍 Buscando snapshot para chat ${id}`);
  try {
    const chat = await findChat(id, 'metadata');
    const snapshot = chat?.metadata?.snapshot;
    
    if (snapshot) {
      logger.info(`✅ Snapshot recuperado para ${id}`);
      return snapshot;
    }
    
    logger.info('⚠️ Nenhum snapshot encontrado para este chat');
    return null;
  } catch (error) {
    logger.error(`❌ Erro ao buscar snapshot:`, error);
    return null;
  }
}
