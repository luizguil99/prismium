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

// Sistema de controle de salvamento ultra-conservador
const pendingSaves = new Map<string, NodeJS.Timeout>();
const lastSavedContent = new Map<string, string>();
const DEBOUNCE_DELAY = 5000; // 5 segundos - tempo extremamente longo para debounce
let lastSaveTime = Date.now();
const MIN_SAVE_INTERVAL = 10000; // Mínimo de 10 segundos entre salvamentos
let saveInProgress = false;

/**
 * Função de salvamento altamente otimizada para minimizar requisições
 */
export async function setMessages(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string
): Promise<void> {
  // Validar ID
  if (!id) {
    console.error('❌ ID de chat não fornecido');
    return Promise.resolve(); // Silenciosamente resolver em vez de falhar
  }
  
  // Criar hash do conteúdo - a chave para determinar se houve mudanças
  const contentHash = JSON.stringify({
    m: messages,
    u: urlId,
    d: description
  });
  
  // Se o conteúdo é idêntico ao último salvo, ignorar completamente
  if (lastSavedContent.get(id) === contentHash) {
    // Não logar nada para manter o console limpo
    return Promise.resolve();
  }
  
  // Função que efetivamente salva no banco
  const performSave = async () => {
    try {
      // Evitar salvamentos simultâneos
      if (saveInProgress) {
        console.log('⏳ Salvamento já em andamento, aguardando...');
        return;
      }
      
      // Verificar tempo desde o último salvamento
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTime;
      
      if (timeSinceLastSave < MIN_SAVE_INTERVAL) {
        console.log(`⏳ Último salvamento há ${timeSinceLastSave}ms. Aguardando intervalo mínimo...`);
        return;
      }
      
      // Marcar que um salvamento está em andamento
      saveInProgress = true;
      
      // Verificar novamente se o conteúdo ainda precisa ser salvo
      if (lastSavedContent.get(id) === contentHash) {
        console.log(`ℹ️ Conteúdo do chat ${id.slice(0, 6)}... já está atualizado`);
        saveInProgress = false;
        return;
      }
      
      const supabase = getOrCreateClient();
      
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        saveInProgress = false;
        return;
      }
      
      const finalUrlId = urlId || id;
      
      const payload = {
        id,
        messages,
        urlId: finalUrlId,
        description: description || 'New Chat',
        timestamp: timestamp ?? new Date().toISOString(),
        user_id: user.id
      };
      
      console.log(`🔄 Salvando chat ${id.slice(0, 6)}...`);
      
      const { error } = await supabase.from('chats').upsert(payload);
      
      if (error) {
        console.error('❌ Erro ao salvar:', error);
      } else {
        console.log(`✅ Chat ${id.slice(0, 6)}... salvo`);
        lastSavedContent.set(id, contentHash);
        lastSaveTime = Date.now();
        invalidateCache();
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
    } finally {
      saveInProgress = false;
      pendingSaves.delete(id);
    }
  };
  
  // Cancelar qualquer salvamento pendente para este chat
  if (pendingSaves.has(id)) {
    clearTimeout(pendingSaves.get(id));
  }
  
  // Agendar novo salvamento com debounce longo
  const timeoutId = setTimeout(performSave, DEBOUNCE_DELAY);
  pendingSaves.set(id, timeoutId);
  
  // Retornar imediatamente, o salvamento será feito assincronamente
  return Promise.resolve();
}

// Para permitir forçar um salvamento imediato quando necessário
export async function forceSaveChat(
  _db: any,
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string
): Promise<void> {
  // Cancelar qualquer salvamento pendente
  if (pendingSaves.has(id)) {
    clearTimeout(pendingSaves.get(id));
    pendingSaves.delete(id);
  }
  
  const supabase = getOrCreateClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const finalUrlId = urlId || id;
  const now = new Date().toISOString();
  
  const payload = {
    id,
    messages,
    urlId: finalUrlId,
    description: description || 'New Chat',
    timestamp: now,
    user_id: user.id
  };
  
  console.log(`⚡ Forçando salvamento do chat ${id.slice(0, 6)}...`);
  
  const { error } = await supabase.from('chats').upsert(payload);
  
  if (error) {
    console.error('❌ Erro ao forçar salvamento:', error);
    throw error;
  }
  
  console.log(`✅ Chat ${id.slice(0, 6)}... salvo (forçado)`);
  
  const contentHash = JSON.stringify({
    m: messages,
    u: finalUrlId,
    d: description
  });
  
  lastSavedContent.set(id, contentHash);
  lastSaveTime = Date.now();
  invalidateCache();
}

// Garantir que os chats sejam salvos antes do fechamento da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Salvar todos os chats pendentes antes de sair
    pendingSaves.forEach((timeoutId, chatId) => {
      clearTimeout(timeoutId);
      console.log(`🚨 Salvando chat ${chatId.slice(0, 6)}... antes de sair`);
      // Não podemos esperar as promessas resolverem durante beforeunload
      // então apenas disparamos a chamada
    });
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

  console.log(`🔄 Consultando banco para urlId="${id}"`);
  const supabase = getOrCreateClient();
  try {
    const { data, error } = await supabase.from('chats')
      .select('*')
      .eq('urlId', id)
      .single();
    
    if (error) {
      console.error(`❌ Erro ao buscar por urlId "${id}": ${error.message}`);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Chat com urlId "${id}" não encontrado`);
    }

    const chat = data as unknown as ChatHistoryItem;
    setCacheItem(messageCache, `url_${id}`, chat);
    return chat;
  } catch (error) {
    console.error(`❌ Erro na consulta por urlId: ${error}`);
    throw error;
  }
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  try {
    // Verificar formato do ID para decidir qual método usar
    // Se parece com um UUID, usar getMessagesById, caso contrário usar getMessagesByUrlId
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUuid) {
      console.log(`🔍 Buscando chat pelo ID: ${id.slice(0, 6)}...`);
      return await getMessagesById(_db, id);
    } else {
      console.log(`🔍 Buscando chat pelo urlId: ${id}`);
      return await getMessagesByUrlId(_db, id);
    }
  } catch (e) {
    console.error(`❌ Erro ao buscar chat: ${e}`);
    throw e;
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

  // Gerar ID de forma sincronizada
  let chatId = '';
  if (crypto && typeof crypto.randomUUID === 'function') {
    chatId = crypto.randomUUID();
  } else {
    chatId = 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
  }

  console.log(`🔄 Criando novo chat com ID ${chatId}`);

  // Use o mesmo valor para urlId e id inicialmente
  const urlId = chatId;
  
  const { data, error } = await supabase
    .from('chats')
    .insert({
      id: chatId,
      user_id: user.id,
      messages,
      description: description || 'New Chat', // Garantir que description nunca seja null
      urlId: urlId, // Definir urlId explicitamente
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error('❌ Erro ao criar chat:', error);
    throw error;
  }
  
  console.log(`✅ Chat criado com sucesso: ID=${chatId}, urlId=${urlId}`);
  return urlId;
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  console.log(`🔄 Duplicando chat com ID ${id}`);
  try {
    const chat = await getMessages(_db, id);
    if (!chat) {
      console.error('❌ Chat não encontrado para duplicação');
      throw new Error('Chat not found');
    }
    
    // Garantir que temos uma descrição válida
    const description = chat.description ? `${chat.description} (copy)` : 'Chat (copy)';
    console.log(`🔄 Descrição para duplicação: ${description}`);
    
    // Usar a função melhorada de createChatFromMessages
    const newUrlId = await createChatFromMessages(
      _db,
      description,
      Array.isArray(chat.messages) ? chat.messages : []
    );
    
    console.log(`✅ Chat duplicado com sucesso: ${newUrlId}`);
    return newUrlId;
  } catch (error) {
    console.error('❌ Erro ao duplicar chat:', error);
    throw error;
  }
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  console.log(`🔄 Criando fork do chat ${chatId} a partir da mensagem ${messageId}`);
  try {
    const chat = await getMessages(_db, chatId);
    if (!chat) {
      console.error('❌ Chat não encontrado para fork');
      throw new Error('Chat not found');
    }
    
    const messages: Message[] = Array.isArray(chat.messages) ? chat.messages : [];
    const messageIndex = messages.findIndex((msg: any) => msg.id === messageId);
    
    if (messageIndex === -1) {
      console.error('❌ Mensagem não encontrada no chat');
      throw new Error('Message not found');
    }
    
    // Garantir que temos uma descrição válida
    const description = chat.description ? `${chat.description} (fork)` : 'Forked chat';
    console.log(`🔄 Descrição para fork: ${description}`);
    
    const forkMessages = messages.slice(0, messageIndex + 1);
    console.log(`🔄 Fork com ${forkMessages.length} mensagens`);
    
    // Usar a função melhorada de createChatFromMessages
    const newUrlId = await createChatFromMessages(
      _db,
      description,
      forkMessages
    );
    
    console.log(`✅ Chat fork criado com sucesso: ${newUrlId}`);
    return newUrlId;
  } catch (error) {
    console.error('❌ Erro ao criar fork do chat:', error);
    throw error;
  }
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

// Adicionando getUrlId otimizado
export async function getUrlId(_db: any, id: string): Promise<string> {
  const supabase = getOrCreateClient();
  
  // Obter o ID do usuário para incorporar ao urlId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Usuário não autenticado ao gerar urlId');
    throw new Error('User not authenticated');
  }
  
  // Criar um prefixo que inclua os primeiros caracteres do ID do usuário
  const userPrefix = user.id.slice(0, 6);
  
  // Base para o urlId
  let baseId = `${userPrefix}-${id}`;
  
  // Limitar o tamanho para evitar URLs muito longas
  if (baseId.length > 36) {
    baseId = baseId.slice(0, 36);
  }
  
  console.log(`🔄 Gerando urlId com base em: ${baseId}`);
  
  // Buscar todos os urlIds existentes que começam com o prefixo de uma vez só
  const { data, error } = await supabase
    .from('chats')
    .select('urlId')
    .like('urlId', `${userPrefix}-%`);
  
  if (error) {
    console.error('❌ Erro ao verificar urlIds existentes:', error);
    throw error;
  }
  
  // Criar um conjunto com os urlIds existentes para busca rápida
  const existingUrlIds = new Set(data.map((item: { urlId: string }) => item.urlId));
  
  // Verificar se o urlId base está disponível
  if (!existingUrlIds.has(baseId)) {
    console.log(`✅ urlId único encontrado: ${baseId}`);
    return baseId;
  }
  
  // Se baseId já existe, tentar com sufixos numéricos
  let suffix = 2;
  let candidate;
  
  while (suffix <= 100) {
    candidate = `${baseId}-${suffix}`;
    if (!existingUrlIds.has(candidate)) {
      console.log(`✅ urlId único encontrado: ${candidate}`);
      return candidate;
    }
    suffix++;
  }
  
  // Se chegamos aqui, precisamos fazer uma verificação direta para os últimos candidatos
  // pois podem existir novos registros desde nossa consulta inicial
  suffix = Math.floor(Math.random() * 900) + 100; // Tentativa aleatória entre 100-999
  candidate = `${baseId}-${suffix}`;
  
  const { data: finalCheck, error: finalError } = await supabase
    .from('chats')
    .select('id')
    .eq('urlId', candidate)
    .maybeSingle();
    
  if (finalError) {
    console.error('❌ Erro na verificação final de urlId:', finalError);
    throw finalError;
  }
  
  if (!finalCheck) {
    console.log(`✅ urlId único encontrado (verificação final): ${candidate}`);
    return candidate;
  }
  
  console.error('❌ Não foi possível gerar urlId único após múltiplas tentativas');
  throw new Error('Unable to generate unique urlId');
}
