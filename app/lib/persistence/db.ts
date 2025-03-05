import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

export interface IChatMetadata {
  // Interface para metadados adicionais do chat
  [key: string]: any;
}

// Retorna o cliente Supabase ao invés do IndexedDB
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
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Otimização: Selecionando apenas as colunas necessárias e limitando resultados
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('timestamp', { ascending: false });
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chats recuperados (${data?.length || 0} itens, ${duration}ms)`);
    
    if (error) {
      logger.error('❌ Erro ao buscar todos os chats:', error);
      throw error;
    }
    
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
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logger.error('❌ Tentativa de salvar mensagens sem autenticação');
      throw new Error('Usuário não autenticado');
    }

    // Validação de timestamp
    if (timestamp && isNaN(Date.parse(timestamp))) {
      logger.error(`❌ Timestamp inválido: ${timestamp}`);
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
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao salvar mensagens (${duration}ms):`, error);
      throw error;
    }
    
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
      logger.info(`⚠️ Não encontrado por ID, tentando buscar por urlId: ${id}`);
      return await getMessagesByUrlId(_db, id);
    }
  } catch (error) {
    logger.error(`❌ Erro ao buscar mensagens para id ${id}:`, error);
    throw error;
  }
}

export async function getMessagesByUrlId(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando chat por urlId: ${id}`);
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Otimização: Usando índice urlId
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('urlId', id)
      .single();
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao buscar chat por urlId ${id} (${duration}ms):`, error);
      throw error;
    }
    
    logger.info(`✅ Chat recuperado por urlId ${id} (${duration}ms)`);
    return data as unknown as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar chat por urlId ${id}:`, error);
    throw error;
  }
}

export async function getMessagesById(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Buscando chat por ID: ${id}`);
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Otimização: Usando chave primária
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao buscar chat por ID ${id} (${duration}ms):`, error);
      throw error;
    }
    
    logger.info(`✅ Chat recuperado por ID ${id} (${duration}ms)`);
    return data as unknown as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Erro ao buscar chat por ID ${id}:`, error);
    throw error;
  }
}

export async function deleteById(_db: any, id: string): Promise<void> {
  logger.info(`🗑️ Deletando chat por ID: ${id}`);
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    const { error } = await supabase.from('chats').delete().eq('id', id);
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao deletar chat ${id} (${duration}ms):`, error);
      throw error;
    }
    
    logger.info(`✅ Chat ${id} deletado com sucesso (${duration}ms)`);
  } catch (error) {
    logger.error(`❌ Erro ao deletar chat ${id}:`, error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  logger.info('🆔 Gerando novo ID');
  // Com Supabase usamos UUIDs gerados pelo banco de dados
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
  const supabase = getOrCreateClient();
  let candidate = id;
  let suffix = 2;
  
  try {
    const startTime = performance.now();
    
    while (true) {
      // Otimização: Usando RPC para verificar a existência
      const { data, error } = await supabase
        .from('chats')
        .select('id')
        .eq('urlId', candidate)
        .maybeSingle();
      
      if (error) {
        logger.error(`❌ Erro ao verificar urlId ${candidate}:`, error);
        throw error;
      }
      
      if (!data) {
        const duration = Math.round(performance.now() - startTime);
        logger.info(`✅ urlId único gerado: ${candidate} (${duration}ms)`);
        return candidate;
      }
      
      logger.info(`⚠️ urlId ${candidate} já existe, tentando ${id}-${suffix}`);
      candidate = `${id}-${suffix}`;
      suffix++;
      
      if (suffix > 100) {
        logger.error('❌ Não foi possível gerar um urlId único após 100 tentativas');
        throw new Error('Não foi possível gerar um urlId único');
      }
    }
  } catch (error) {
    logger.error(`❌ Erro ao gerar urlId para ${id}:`, error);
    throw error;
  }
}

// Função interna para recuperar todos os urlIds - mantida para compatibilidade
async function getUrlIds(_db: any): Promise<string[]> {
  logger.info('🔗 Buscando todos os urlIds');
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Otimização: Selecionando apenas a coluna urlId
    const { data, error } = await supabase
      .from('chats')
      .select('urlId')
      .not('urlId', 'is', null);
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao buscar urlIds (${duration}ms):`, error);
      throw error;
    }
    
    const urlIds = data?.map((item: { urlId: string }) => item.urlId).filter(Boolean) || [];
    logger.info(`✅ ${urlIds.length} urlIds recuperados (${duration}ms)`);
    
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
      logger.error(`❌ Chat ${chatId} não encontrado para fork`);
      throw new Error('Chat não encontrado');
    }

    // Encontra o índice da mensagem para fazer o fork
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    
    if (messageIndex === -1) {
      logger.error(`❌ Mensagem ${messageId} não encontrada no chat ${chatId}`);
      throw new Error('Mensagem não encontrada');
    }

    // Obtém mensagens até a mensagem selecionada (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);
    logger.info(`🔄 Criando fork com ${messages.length} mensagens`);
    
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
    const startTime = performance.now();
    const chat = await getMessages(_db, id);
    
    if (!chat) {
      logger.error(`❌ Chat ${id} não encontrado para duplicação`);
      throw new Error('Chat não encontrado');
    }
    
    const newUrlId = await createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (copy)` : 'Chat (copy)', 
      chat.messages,
      chat.metadata
    );
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chat duplicado com sucesso: ${newUrlId} (${duration}ms)`);
    
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
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('❌ Erro ao verificar autenticação:', authError);
      throw authError;
    }
    
    if (!user) {
      logger.error('❌ Tentativa de criar chat sem autenticação');
      throw new Error('Usuário não autenticado');
    }

    // Gerar ID para o novo chat
    const id = await getNextId(_db);
    logger.info(`🆔 ID gerado para novo chat: ${id}`);
    
    // Inserir novo chat no Supabase
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
    
    if (error) {
      logger.error('❌ Erro ao criar chat:', error);
      throw error;
    }
    
    // Verificar se o chat foi criado com sucesso
    const chat = (data && data[0]) as any;
    
    if (!chat) {
      logger.error('❌ Falha ao criar chat: retorno vazio');
      throw new Error('Falha ao criar chat');
    }
    
    // Definir urlId
    const newUrlId = chat.urlId || id;
    
    if (!chat.urlId) {
      logger.info(`🔄 Atualizando urlId para: ${newUrlId}`);
      const { error: updateError } = await supabase
        .from('chats')
        .update({ urlId: newUrlId })
        .eq('id', chat.id);
      
      if (updateError) {
        logger.error('❌ Erro ao atualizar urlId:', updateError);
        throw updateError;
      }
    }
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chat criado com sucesso: ${newUrlId} (${duration}ms)`);
    
    return newUrlId;
  } catch (error) {
    logger.error('❌ Erro ao criar chat a partir de mensagens:', error);
    throw error;
  }
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  logger.info(`📝 Atualizando descrição do chat ${id}`);
  try {
    const startTime = performance.now();
    const chat = await getMessages(_db, id);
    
    if (!chat) {
      logger.error(`❌ Chat ${id} não encontrado para atualização de descrição`);
      throw new Error('Chat não encontrado');
    }
    
    if (!description.trim()) {
      logger.error('❌ Tentativa de atualizar para descrição vazia');
      throw new Error('A descrição não pode estar vazia');
    }

    const supabase = getOrCreateClient();
    const { error } = await supabase
      .from('chats')
      .update({ description })
      .eq('id', chat.id);
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao atualizar descrição (${duration}ms):`, error);
      throw error;
    }
    
    logger.info(`✅ Descrição atualizada com sucesso (${duration}ms)`);
  } catch (error) {
    logger.error(`❌ Erro ao atualizar descrição do chat ${id}:`, error);
    throw error;
  }
}

// Funções para gerenciar snapshots
export async function saveSnapshot(_db: any, id: string, snapshot: any): Promise<void> {
  logger.info(`💾 Salvando snapshot para chat ${id}`);
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Obter o chat atual para atualizar apenas o metadata
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (chatError) {
      logger.error(`❌ Erro ao buscar chat para salvar snapshot: ${chatError.message}`);
      throw chatError;
    }
    
    // Criar ou atualizar metadata com o snapshot
    const metadata = {
      ...(chatData.metadata || {}),
      snapshot: snapshot
    };
    
    // Atualizar apenas o campo metadata
    const { error } = await supabase
      .from('chats')
      .update({ metadata })
      .eq('id', id);
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao salvar snapshot (${duration}ms): ${error.message}`);
      throw error;
    }
    
    logger.info(`✅ Snapshot salvo com sucesso para chat ${id} (${duration}ms)`);
    
    // Mantém compatibilidade com o código existente armazenando também no localStorage
    localStorage.setItem(`snapshot:${id}`, JSON.stringify(snapshot));
  } catch (error) {
    logger.error(`❌ Erro ao salvar snapshot para chat ${id}:`, error);
    throw error;
  }
}

export async function getSnapshot(_db: any, id: string): Promise<any> {
  logger.info(`🔍 Buscando snapshot para chat ${id}`);
  const supabase = getOrCreateClient();
  try {
    const startTime = performance.now();
    
    // Buscar o chat com metadata
    const { data, error } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', id)
      .single();
    
    const duration = Math.round(performance.now() - startTime);
    
    if (error) {
      logger.error(`❌ Erro ao buscar snapshot (${duration}ms): ${error.message}`);
      
      // Tenta buscar do localStorage como fallback
      logger.info('⚠️ Tentando buscar snapshot do localStorage como fallback');
      const localSnapshot = localStorage.getItem(`snapshot:${id}`);
      if (localSnapshot) {
        logger.info('✅ Snapshot recuperado do localStorage');
        return JSON.parse(localSnapshot);
      }
      
      throw error;
    }
    
    const snapshot = data?.metadata?.snapshot;
    
    if (snapshot) {
      logger.info(`✅ Snapshot recuperado do Supabase para chat ${id} (${duration}ms)`);
      
      // Atualiza o localStorage para manter compatibilidade
      localStorage.setItem(`snapshot:${id}`, JSON.stringify(snapshot));
      
      return snapshot;
    } else {
      // Tenta buscar do localStorage como fallback
      logger.info('⚠️ Snapshot não encontrado no Supabase, tentando localStorage');
      const localSnapshot = localStorage.getItem(`snapshot:${id}`);
      
      if (localSnapshot) {
        const parsedSnapshot = JSON.parse(localSnapshot);
        logger.info('✅ Snapshot recuperado do localStorage');
        
        // Salva no Supabase para futura referência
        saveSnapshot(_db, id, parsedSnapshot).catch(e => 
          logger.error('❌ Erro ao migrar snapshot do localStorage para Supabase:', e)
        );
        
        return parsedSnapshot;
      }
      
      logger.info('⚠️ Nenhum snapshot encontrado para este chat');
      return null;
    }
  } catch (error) {
    logger.error(`❌ Erro ao buscar snapshot para chat ${id}:`, error);
    
    // Última tentativa de buscar do localStorage
    const localSnapshot = localStorage.getItem(`snapshot:${id}`);
    if (localSnapshot) {
      logger.info('✅ Snapshot recuperado do localStorage após erro');
      return JSON.parse(localSnapshot);
    }
    
    return null;
  }
}