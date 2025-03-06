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

    // Verificação e sanitização das mensagens para evitar problemas de truncamento
    const sanitizedMessages = messages.map(msg => {
      // Clone a mensagem para não modificar o objeto original
      const sanitizedMsg = { ...msg };
      
      // Garantir que o conteúdo seja uma string válida
      if (typeof sanitizedMsg.content === 'string') {
        // Verificar o tamanho para debug
        if (sanitizedMsg.content.length > 1000) {
          logger.info(`Mensagem grande detectada (${sanitizedMsg.content.length} caracteres)`);
        }
      }
      
      return sanitizedMsg;
    });

    const payload = {
      id,
      user_id: user.id,
      messages: sanitizedMessages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata
    };

    // Usar a opção type_json para garantir armazenamento adequado do array de mensagens
    const { error } = await supabase.from('chats').upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
    
    if (error) {
      logger.error(`❌ Erro ao salvar mensagens: ${error.message}`, error);
      throw error;
    }
    
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
    try {
      return await getMessagesById(_db, id);
    } catch (e) {
      return await getMessagesByUrlId(_db, id);
    }
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens para id ${id}:`, error);
    throw error;
  }
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando mensagens pelo urlId: ${id}`);
  try {
    const supabase = getOrCreateClient();
    
    // Usar a configuração explícita para JSON para evitar truncamento
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('urlId', id)
      .maybeSingle();
    
    if (error) {
      logger.error(`❌ Erro ao buscar mensagens pelo urlId ${id}:`, error);
      throw error;
    }
    
    if (!data) {
      logger.warn(`⚠️ Nenhum chat encontrado com urlId: ${id}`);
      throw new Error(`Chat não encontrado com urlId: ${id}`);
    }
    
    // Verificar se as mensagens foram carregadas corretamente
    if (data.messages && Array.isArray(data.messages)) {
      logger.info(`✅ Chat recuperado pelo urlId: ${id} com ${data.messages.length} mensagens`);
      
      // Log para depuração de mensagens potencialmente truncadas
      data.messages.forEach((msg: any, index: number) => {
        if (typeof msg.content === 'string' && msg.content.length > 1000) {
          logger.info(`Mensagem ${index} tem ${msg.content.length} caracteres`);
        }
      });
    } else {
      logger.warn(`⚠️ Chat recuperado pelo urlId ${id} sem mensagens válidas`);
    }
    
    return data as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens pelo urlId ${id}:`, error);
    throw error;
  }
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando mensagens pelo id: ${id}`);
  try {
    const supabase = getOrCreateClient();
    
    // Usar a configuração explícita para JSON para evitar truncamento
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      logger.error(`❌ Erro ao buscar mensagens pelo id ${id}:`, error);
      throw error;
    }
    
    if (!data) {
      logger.warn(`⚠️ Nenhum chat encontrado com id: ${id}`);
      throw new Error(`Chat não encontrado com id: ${id}`);
    }
    
    // Verificar se as mensagens foram carregadas corretamente
    if (data.messages && Array.isArray(data.messages)) {
      logger.info(`✅ Chat recuperado pelo id: ${id} com ${data.messages.length} mensagens`);
      
      // Log para depuração de mensagens potencialmente truncadas
      data.messages.forEach((msg: any, index: number) => {
        if (typeof msg.content === 'string' && msg.content.length > 1000) {
          logger.info(`Mensagem ${index} tem ${msg.content.length} caracteres`);
        }
      });
    } else {
      logger.warn(`⚠️ Chat recuperado pelo id ${id} sem mensagens válidas`);
    }
    
    return data as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens pelo id ${id}:`, error);
    throw error;
  }
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

async function getNextImportedFilesSuffix(supabase: any, userId: string, baseId: string): Promise<string> {
  const { data: existingChats } = await supabase
    .from('chats')
    .select('urlId')
    .eq('user_id', userId)
    .like('urlId', `${baseId}%`)
    .order('urlId', { ascending: false });

  if (!existingChats || existingChats.length === 0) {
    return baseId;
  }

  // Find the highest suffix number
  let maxSuffix = 0;
  existingChats.forEach((chat: { urlId: string }) => {
    const match = chat.urlId.match(new RegExp(`${baseId}(-([0-9]+))?$`));
    if (match) {
      const suffix = match[2] ? parseInt(match[2]) : 0;
      maxSuffix = Math.max(maxSuffix, suffix);
    }
  });

  return maxSuffix === 0 ? `${baseId}-1` : `${baseId}-${maxSuffix + 1}`;
}

export async function getUrlId(_db: any, id: string): Promise<string> {
  logger.info(`🔗 Verificando disponibilidade de urlId: ${id}`);
  try {
    const startTime = performance.now();
    const idList = await getUrlIds(_db);
    
    if (!idList.includes(id)) {
      logger.info(`✅ urlId ${id} está disponível`);
      return id;
    } else {
      let i = 2;
      
      while (idList.includes(`${id}-${i}`)) {
        i++;
        if (i > 100) {
          logger.error(`❌ Não foi possível gerar um urlId único após 100 tentativas`);
          throw new Error('Não foi possível gerar um urlId único');
        }
      }
      
      const newUrlId = `${id}-${i}`;
      logger.info(`✅ Gerado novo urlId: ${newUrlId}`);
      return newUrlId;
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
    
    if (!chat) {
      throw new Error('Chat não encontrado');
    }
    
    // Encontra o índice da mensagem para fazer o fork
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) {
      throw new Error('Mensagem não encontrada');
    }

    // Obtém mensagens até a mensagem selecionada (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);
    
    // Criar novo chat com as mensagens até o ponto de fork
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (fork)` : 'Forked chat', 
      messages,
      chat.metadata
    );
  } catch (error) {
    logger.error(`❌ Erro ao fazer fork do chat ${chatId}:`, error);
    throw error;
  }
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  logger.info(`🔄 Duplicando chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    
    if (!chat) {
      throw new Error('Chat não encontrado');
    }
    
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (copy)` : 'Chat (copy)', 
      chat.messages,
      chat.metadata
    );
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
    
    // Gerar um urlId único baseado no id
    const newUrlId = await getUrlId(_db, id);
    
    const { data, error } = await supabase
      .from('chats')
      .insert({
        id,
        user_id: user.id,
        messages,
        urlId: newUrlId,
        description,
        timestamp: new Date().toISOString(),
        metadata
      })
      .select();
    
    if (error) throw error;
    
    const chat = (data && data[0]) as any;
    if (!chat) throw new Error('Falha ao criar chat');
    
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

export async function detectAndRepairMessages(_db: any, id: string): Promise<boolean> {
  logger.info(`🔧 Verificando e reparando mensagens para o chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    if (!chat || !Array.isArray(chat.messages)) {
      logger.warn(`⚠️ Chat ${id} não encontrado ou não tem formato válido`);
      return false;
    }
    
    // Verificar se há mensagens suspeitas de truncamento
    let needsRepair = false;
    let repairedMessages = chat.messages.map(msg => {
      if (typeof msg.content === 'string') {
        // Verificar sinais comuns de truncamento
        if (msg.content.endsWith('...') || 
            (msg.content.includes('```') && !msg.content.match(/```[\s\S]*?```/g))) {
          needsRepair = true;
          
          // Tentar remover caracteres de truncamento
          const repaired = msg.content.replace(/\.\.\.+$/, '');
          
          logger.info(`🔄 Mensagem ${msg.id} possivelmente truncada, tentando reparar`);
          return { ...msg, content: repaired };
        }
      }
      return msg;
    });
    
    if (needsRepair) {
      // Salvar mensagens reparadas
      await setMessages(
        _db,
        chat.id,
        repairedMessages,
        chat.urlId,
        chat.description,
        chat.timestamp,
        chat.metadata
      );
      
      logger.info(`✅ Mensagens reparadas para o chat ${id}`);
      return true;
    }
    
    logger.info(`✅ Nenhum problema detectado nas mensagens do chat ${id}`);
    return false;
  } catch (error) {
    logger.error(`❌ Erro ao verificar/reparar mensagens:`, error);
    throw error;
  }
}
