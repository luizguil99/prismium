import type { Message } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { ChatHistoryItem } from './useChatHistory';
import { getOrCreateClient } from '~/components/supabase/client';

const logger = createScopedLogger('ChatHistory');

// Update accumulation system
// For each chat, we keep only the latest pending save operation
const pendingSaves = new Map<string, {
  messages: Message[];
  urlId?: string;
  description?: string;
  timestamp?: string;
  metadata?: IChatMetadata;
  timer: any;
  savePromise: Promise<void>;
  resolveSave: () => void;
  rejectSave: (error: Error) => void;
}>();

// Accumulation interval (ms)
const ACCUMULATION_INTERVAL = 2000; // 2 seconds (more responsive)

// REST operations counter
let restRequestCount = 0;

// Cache system for chat listings
interface ChatListCache {
  data: ChatHistoryItem[];
  timestamp: number;
  userId: string;
}

let chatsListCache: ChatListCache | null = null;
const CACHE_TTL = 30000; // 30 seconds cache lifetime

export interface IChatMetadata {
  // Interface for additional chat metadata
  [key: string]: any;
}

// ===== UTILITY FUNCTIONS =====

// Checks if a string is a valid UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Gets the authenticated user or throws an error
async function getAuthenticatedUser() {
  const supabase = getOrCreateClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    logger.error('❌ Error verifying authentication:', authError);
    throw authError;
  }
  
  if (!user) {
    logger.error('❌ User not authenticated');
    throw new Error('User not authenticated');
  }
  
  return user;
}

// Fetches a chat by ID or urlId
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
    logger.error(`❌ Error fetching chat ${id}:`, error);
    throw error;
  }
  
  return data;
}

// Function to verify if messages were loaded correctly and log
function validateMessagesAndLog(data: any, idType: string, id: string): void {
  if (data.messages && Array.isArray(data.messages)) {
    logger.info(`✅ Chat retrieved by ${idType}: ${id} with ${data.messages.length} messages`);
    
    // Log for debugging potentially truncated messages
    data.messages.forEach((msg: any, index: number) => {
      if (typeof msg.content === 'string' && msg.content.length > 1000) {
        logger.info(`Message ${index} has ${msg.content.length} characters`);
      }
    });
  } else {
    logger.warn(`⚠️ Chat retrieved by ${idType} ${id} without valid messages`);
  }
}

// Sets up Realtime subscription for a chat
function setupRealtimeSubscription(chatId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const supabase = getOrCreateClient();
    
    // Check if a subscription already exists
    const existingChannels = supabase.getChannels();
    const alreadySubscribed = existingChannels.some((channel: any) => 
      channel.topic && channel.topic.includes(`chats:id=eq.${chatId}`)
    );
    
    if (alreadySubscribed) {
      return;
    }
    
    logger.info(`🔄 Setting up Realtime for chat ${chatId}`);
    
    // Subscribe to receive chat updates
    supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: '*', // All events (insert, update, delete)
        schema: 'public',
        table: 'chats',
        filter: `id=eq.${chatId}`,
      }, (payload: any) => {
        logger.info(`📡 Received Realtime update for chat ${chatId}`);
      })
      .subscribe((status: string) => {
        logger.info(`Realtime status: ${status}`);
      });
  } catch (error) {
    logger.error(`❌ Error setting up Realtime for chat ${chatId}:`, error);
  }
}

// ===== MAIN API FUNCTIONS =====

export async function openDatabase(): Promise<any> {
  logger.info('🔌 Initiating Supabase connection');
  try {
    const client = getOrCreateClient();

    logger.info('✅ Supabase connection established');
    logger.info('ℹ️ 15-second throttling configured to reduce Supabase requests');
    return client;
  } catch (error) {
    logger.error('❌ Failed to connect to Supabase:', error);
    return undefined;
  }
}

export async function getAll(_db: any): Promise<ChatHistoryItem[]> {
  logger.info('📋 Fetching all chats');
 
  try {
    const startTime = performance.now();
    const user = await getAuthenticatedUser();
    
    // Check if we have a valid cache for this user
    if (chatsListCache && 
        chatsListCache.userId === user.id && 
        (Date.now() - chatsListCache.timestamp) < CACHE_TTL) {
      
      const cacheDuration = Date.now() - chatsListCache.timestamp;
      logger.info(`✅ Using cached chats list (${chatsListCache.data.length} items, cache age: ${cacheDuration}ms)`);
      return chatsListCache.data;
    }
    
    // No valid cache, fetch from Supabase
    const supabase = getOrCreateClient();
    
    restRequestCount++;
    logger.info(`🔴 THIS IS A REST OPERATION ON SUPABASE (listing all chats) #${restRequestCount}`);
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chats retrieved (${data?.length || 0} items, ${duration}ms)`);
    
    // Cache the results
    chatsListCache = {
      data: data as ChatHistoryItem[],
      timestamp: Date.now(),
      userId: user.id
    };
    
    return (data || []) as unknown as ChatHistoryItem[];
  } catch (error) {
    logger.error('❌ Error fetching all chats:', error);
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
  // If there are no messages, there's nothing to save
  if (!messages || messages.length === 0) {
    logger.warn(`⚠️ Attempt to save chat ${id} without messages`);
    return;
  }

  // Calculate total message size
  const totalSize = messages.reduce((size, msg) => {
    return size + (typeof msg.content === 'string' ? msg.content.length : 0);
  }, 0);

  // Debug log
  if (totalSize > 1000) {
    logger.info(`📊 Total message size: ${totalSize} characters`);
  }

  // If we don't have a pending operation for this chat, create a new one
  if (!pendingSaves.has(id)) {
    // Create a new promise that will be resolved when saving is complete
    let resolveSave: () => void;
    let rejectSave: (error: Error) => void;
    
    const savePromise = new Promise<void>((resolve, reject) => {
      resolveSave = resolve;
      rejectSave = reject;
    });

    // Set up timer to save after accumulation interval
    const timer = setTimeout(() => {
      // Get the most recent pending operation
      const pendingOp = pendingSaves.get(id);
      if (!pendingOp) return;
      
      // Remove pending operation from map
      pendingSaves.delete(id);
      
      // Execute the save
      _saveMessagesToSupabase(
        id, 
        pendingOp.messages, 
        pendingOp.urlId, 
        pendingOp.description, 
        pendingOp.timestamp, 
        pendingOp.metadata
      )
        .then(() => {
          // Technical log without success message for UI
          pendingOp.resolveSave();
          
        })
        .catch((error) => {
          logger.error(`❌ Error saving messages for chat ${id}:`, error);
          pendingOp.rejectSave(error);
        });
    }, ACCUMULATION_INTERVAL);

    // Store the pending operation
    pendingSaves.set(id, {
      messages,
      urlId,
      description,
      timestamp,
      metadata,
      timer,
      savePromise,
      resolveSave: resolveSave!,
      rejectSave: rejectSave!
    });

    // Remove scheduling message
    return savePromise;
  }

  // If we already have a pending operation for this chat, update it
  const pendingOp = pendingSaves.get(id)!;
  
  // Clear previous timer
  clearTimeout(pendingOp.timer);
  
  // Keep existing promise, but update the data
  pendingOp.messages = messages;
  pendingOp.urlId = urlId;
  pendingOp.description = description;
  pendingOp.timestamp = timestamp;
  pendingOp.metadata = metadata;
  
  // Set up a new timer
  pendingOp.timer = setTimeout(() => {
    // Get the most recent pending operation
    const currentOp = pendingSaves.get(id);
    if (!currentOp) return;
    
    // Remove pending operation from map
    pendingSaves.delete(id);
    
    // Execute the save
    _saveMessagesToSupabase(
      id, 
      currentOp.messages, 
      currentOp.urlId, 
      currentOp.description, 
      currentOp.timestamp, 
      currentOp.metadata
    )
      .then(() => {
        // Technical log without success message for UI
        currentOp.resolveSave();
        
      })
      .catch((error) => {
        logger.error(`❌ Error saving messages for chat ${id}:`, error);
        currentOp.rejectSave(error);
      });
  }, ACCUMULATION_INTERVAL);
  
  // Remove pending operation update message
  return pendingOp.savePromise;
}

// Internal function to save messages to Supabase
async function _saveMessagesToSupabase(
  id: string,
  messages: Message[],
  urlId?: string,
  description?: string,
  timestamp?: string,
  metadata?: IChatMetadata
): Promise<void> {
  try {
    // Remove save logging here to avoid redundant messages
    const startTime = performance.now();
    
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    
    if (timestamp && isNaN(Date.parse(timestamp))) {
      throw new Error('Invalid timestamp');
    }

    restRequestCount++;
    logger.info(`🔴 THIS IS A REST OPERATION ON SUPABASE #${restRequestCount}`);
    
    // Verification and sanitization of messages to avoid truncation issues
    const sanitizedMessages = messages.map(msg => {
      // Clone the message to avoid modifying the original object
      const sanitizedMsg = { ...msg };
      
      // Ensure content is a valid string
      if (typeof sanitizedMsg.content === 'string') {
        // Check size for debug
        if (sanitizedMsg.content.length > 1000) {
          logger.info(`Large message detected (${sanitizedMsg.content.length} characters)`);
        }
      }
      
      return sanitizedMsg;
    });

    // Detailed log of content being saved to the messages column
    console.log('📦 CONTENT SAVED TO SUPABASE MESSAGES COLUMN:', JSON.stringify({
      total_messages: sanitizedMessages.length,
      message_ids: sanitizedMessages.map(m => m.id),
      message_roles: sanitizedMessages.map(m => m.role),
      message_sizes: sanitizedMessages.map(m => typeof m.content === 'string' ? m.content.length : 0),
      full_content: sanitizedMessages
    }, null, 2));

    const payload = {
      id,
      user_id: user.id,
      messages: sanitizedMessages,
      urlId,
      description,
      timestamp: timestamp ?? new Date().toISOString(),
      metadata
    };

    // Use type_json option to ensure proper storage of message array
    const { error } = await supabase.from('chats').upsert(payload, {
      onConflict: 'id',
      ignoreDuplicates: false
    });
    
    if (error) {
      logger.error(`❌ Error saving messages: ${error.message}`, error);
      throw error;
    }
    
    // Set up realtime for this chat if not already configured
    setupRealtimeSubscription(id);
    
    const duration = Math.round(performance.now() - startTime);
    // Remove success indication from log message
    logger.info(`Operation completed for chat ${id} (${duration}ms)`);
  } catch (error) {
    logger.error('❌ Error saving messages:', error);
    throw error;
  }
}

export async function getMessages(_db: any, id: string): Promise<ChatHistoryItem> {
  logger.info(`🔍 Fetching messages for id: ${id}`);
  try {
    const supabase = getOrCreateClient();
    
    restRequestCount++;
    logger.info(`🔴 THIS IS A REST OPERATION ON SUPABASE (fetching messages) #${restRequestCount}`);
    
    let query;
    let idType = '';
    
    if (isValidUUID(id)) {
      query = supabase.from('chats').select('*').eq('id', id).maybeSingle();
      idType = 'id';
    } else {
      query = supabase.from('chats').select('*').eq('urlId', id).maybeSingle();
      idType = 'urlId';
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`❌ Error fetching messages by ${idType} ${id}:`, error);
      throw error;
    }
    
    if (!data) {
      logger.warn(`⚠️ No chat found with ${idType}: ${id}`);
      throw new Error(`Chat not found with ${idType}: ${id}`);
    }
    
    validateMessagesAndLog(data, idType, id);
    
    // Set up Realtime for this chat
    if (data.id) {
      setupRealtimeSubscription(data.id);
    }
    
    return data as ChatHistoryItem;
  } catch (error) {
    logger.error(`❌ Error fetching messages for id ${id}:`, error);
    throw error;
  }
}

export async function deleteById(_db: any, id: string): Promise<void> {
  logger.info(`🗑️ Deleting chat by ID: ${id}`);
  try {
    const startTime = performance.now();
    const supabase = getOrCreateClient();
    
    // First fetch the chat to ensure it exists and get the real ID if it's a urlId
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error(`Chat not found: ${id}`);
    
    // Cancel any pending operation for this chat
    if (pendingSaves.has(id)) {
      const pendingOp = pendingSaves.get(id)!;
      clearTimeout(pendingOp.timer);
    }
    
    restRequestCount++;
    logger.info(`🔴 THIS IS A REST OPERATION ON SUPABASE (deleting chat) #${restRequestCount}`);
    
    const { error } = await supabase.from('chats').delete().eq('id', chat.id);
    if (error) throw error;
    
    // Invalidate cache after deletion
    invalidateChatsCache();
    
    const duration = Math.round(performance.now() - startTime);
    logger.info(`✅ Chat ${id} successfully deleted (${duration}ms)`);
    
    
  } catch (error) {
    logger.error(`❌ Error deleting chat ${id}:`, error);
    throw error;
  }
}

export async function getNextId(_db: any): Promise<string> {
  logger.info('🆔 Generating new ID');
  if (crypto && typeof crypto.randomUUID === 'function') {
    const id = crypto.randomUUID();
    logger.info(`✅ New ID generated: ${id}`);
    return id;
  } else {
    const id = 'id-' + new Date().getTime() + '-' + Math.floor(Math.random() * 10000);
    logger.info(`✅ New ID generated (fallback): ${id}`);
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
  logger.info(`🔗 Checking availability of urlId: ${id}`);
  try {
    const startTime = performance.now();
    const idList = await getUrlIds(_db);
    
    if (!idList.includes(id)) {
      logger.info(`✅ urlId ${id} is available`);
      return id;
    } else {
      let i = 2;
      
      while (idList.includes(`${id}-${i}`)) {
        i++;
        if (i > 100) {
          logger.error(`❌ Could not generate a unique urlId after 100 attempts`);
          throw new Error('Could not generate a unique urlId');
        }
      }
      
      const newUrlId = `${id}-${i}`;
      logger.info(`✅ Generated new urlId: ${newUrlId}`);
      return newUrlId;
    }
  } catch (error) {
    logger.error(`❌ Error generating urlId for ${id}:`, error);
    throw error;
  }
}

async function getUrlIds(_db: any): Promise<string[]> {
  logger.info('🔗 Fetching all urlIds');
  try {
    const supabase = getOrCreateClient();
    const { data, error } = await supabase
      .from('chats')
      .select('urlId')
      .not('urlId', 'is', null);
    
    if (error) throw error;
    
    const urlIds = data?.map((item: { urlId: string }) => item.urlId).filter(Boolean) || [];
    logger.info(`✅ ${urlIds.length} urlIds retrieved`);
    return urlIds;
  } catch (error) {
    logger.error('❌ Error fetching urlIds:', error);
    throw error;
  }
}

export async function forkChat(_db: any, chatId: string, messageId: string): Promise<string> {
  logger.info(`🍴 Creating fork of chat ${chatId} from message ${messageId}`);
  try {
    const startTime = performance.now();
    const chat = await getMessages(_db, chatId);
    
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    // Find the index of the message to fork from
    const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) {
      throw new Error('Message not found');
    }

    // Get messages up to the selected message (inclusive)
    const messages = chat.messages.slice(0, messageIndex + 1);
    
    // Create new chat with messages up to the fork point
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (fork)` : 'Forked chat', 
      messages,
      chat.metadata
    );
  } catch (error) {
    logger.error(`❌ Error forking chat ${chatId}:`, error);
    throw error;
  }
}

export async function duplicateChat(_db: any, id: string): Promise<string> {
  logger.info(`🔄 Duplicating chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    return createChatFromMessages(
      _db, 
      chat.description ? `${chat.description} (copy)` : 'Chat (copy)', 
      chat.messages,
      chat.metadata
    );
  } catch (error) {
    logger.error(`❌ Error duplicating chat ${id}:`, error);
    throw error;
  }
}

export async function createChatFromMessages(
  _db: any,
  description: string,
  messages: Message[],
  metadata?: IChatMetadata
): Promise<string> {
  logger.info(`📝 Creating new chat with ${messages.length} messages`);
  try {
    const user = await getAuthenticatedUser();
    const supabase = getOrCreateClient();
    const id = await getNextId(_db);
    
    // Generate a unique urlId based on the id
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
    if (!chat) throw new Error('Failed to create chat');
    
    logger.info(`✅ Chat created successfully: ${newUrlId}`);
    
    // Invalidate cache after creating new chat
    invalidateChatsCache();
    
    return newUrlId;
  } catch (error) {
    logger.error('❌ Error creating chat from messages:', error);
    throw error;
  }
}

export async function updateChatDescription(_db: any, id: string, description: string): Promise<void> {
  logger.info(`📝 Updating chat description ${id}`);
  try {
    if (!description.trim()) throw new Error('Description cannot be empty');
    
    const chat = await findChat(id, 'id');
    if (!chat) throw new Error('Chat not found');
    
    const supabase = getOrCreateClient();
    const { error } = await supabase
      .from('chats')
      .update({ description })
      .eq('id', chat.id);
    
    if (error) throw error;
    logger.info(`✅ Description updated successfully`);
    
    // Invalidate cache after updating description
    invalidateChatsCache();
  } catch (error) {
    logger.error(`❌ Error updating chat description ${id}:`, error);
    throw error;
  }
}

export async function detectAndRepairMessages(_db: any, id: string): Promise<boolean> {
  logger.info(`🔧 Checking and repairing messages for chat ${id}`);
  try {
    const chat = await getMessages(_db, id);
    if (!chat || !Array.isArray(chat.messages)) {
      logger.warn(`⚠️ Chat ${id} not found or does not have a valid format`);
      return false;
    }
    
    // Check for messages suspected of truncation
    let needsRepair = false;
    let repairedMessages = chat.messages.map(msg => {
      if (typeof msg.content === 'string') {
        // Check common signs of truncation
        if (msg.content.endsWith('...') || 
            (msg.content.includes('```') && !msg.content.match(/```[\s\S]*?```/g))) {
          needsRepair = true;
          
          // Try to remove truncation characters
          const repaired = msg.content.replace(/\.\.\.+$/, '');
          
          logger.info(`🔄 Message ${msg.id} possibly truncated, attempting repair`);
          return { ...msg, content: repaired };
        }
      }
      return msg;
    });
    
    if (needsRepair) {
      // Save repaired messages
      await setMessages(
        _db,
        chat.id,
        repairedMessages,
        chat.urlId,
        chat.description,
        chat.timestamp,
        chat.metadata
      );
      
      logger.info(`✅ Messages repaired for chat ${id}`);
      return true;
    }
    
    logger.info(`✅ No issues detected in messages for chat ${id}`);
    return false;
  } catch (error) {
    logger.error(`❌ Error checking/repairing messages:`, error);
    throw error;
  }
}

// Function to invalidate the chats list cache
function invalidateChatsCache(): void {
  if (chatsListCache) {
    logger.info('🧹 Cache invalidated for chats list');
    chatsListCache = null;
  }
}