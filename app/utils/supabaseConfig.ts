import { getOrCreateClient } from '~/components/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SupabaseConfig');

/**
 * Verifica e otimiza a configuração do Supabase para armazenamento de mensagens grandes
 */
export async function validateSupabaseConfig() {
  logger.info('🔍 Verifying Supabase configuration for large messages...');
  
  try {
    const supabase = getOrCreateClient();
    
    // Verificar se há mensagens truncadas no banco de dados
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id, urlId, messages');
    
    if (error) {
      logger.error('❌ Erro ao verificar mensagens:', error);
      throw error;
    }
    
    let truncatedCount = 0;
    let suspiciousChats: string[] = [];
    
    // Analisar e verificar possíveis truncamentos
    if (chats && chats.length > 0) {
      chats.forEach(chat => {
        if (!Array.isArray(chat.messages)) {
          logger.warn(`⚠️ Chat ${chat.id} tem mensagens em formato inválido`);
          suspiciousChats.push(chat.id);
          return;
        }
        
        // Verificar sinais de truncamento nas mensagens
        const lastMsg = chat.messages[chat.messages.length - 1];
        if (lastMsg && typeof lastMsg.content === 'string') {
          if (lastMsg.content.endsWith('...') || 
              lastMsg.content.includes('```') && !lastMsg.content.match(/```[\s\S]*?```/g)) {
            logger.warn(`⚠️ Chat ${chat.id} pode ter mensagens truncadas`);
            truncatedCount++;
            suspiciousChats.push(chat.id);
          }
        }
      });
    }
    
    if (truncatedCount > 0) {
      logger.warn(`⚠️ Found ${truncatedCount} chats with possible message truncation`);
      logger.info(`📊 Chats suspeitos: ${suspiciousChats.join(', ')}`);
    } else {
      logger.info('✅ Nenhum problema de truncamento detectado');
    }
    
    return {
      truncatedCount,
      suspiciousChats
    };
  } catch (error) {
    logger.error('❌ Falha ao validar configuração:', error);
    throw error;
  }
}

/**
 * Verifica se a estrutura da tabela 'chats' existe e está configurada corretamente
 */
export async function ensureChatsTable() {
  logger.info('🔧 Verificando estrutura da tabela chats...');
  
  try {
    const supabase = getOrCreateClient();
    
    // Este é apenas um teste para verificar se podemos acessar a tabela
    const { error } = await supabase
      .from('chats')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') { // Código para tabela inexistente
      logger.error('❌ Tabela chats não encontrada. É necessário criar a estrutura.');
      return false;
    } else if (error) {
      logger.error('❌ Erro ao verificar tabela:', error);
      throw error;
    }
    
    logger.info('✅ Tabela chats existe e está acessível');
    return true;
  } catch (error) {
    logger.error('❌ Falha ao verificar tabela:', error);
    throw error;
  }
}

/**
 * Tenta reparar mensagens potencialmente truncadas
 */
export async function repairTruncatedMessages(chatId: string) {
  logger.info(`🔧 Tentando reparar mensagens para o chat ${chatId}...`);
  
  try {
    const supabase = getOrCreateClient();
    
    // Recuperar o chat atual
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    
    if (error) {
      logger.error(`❌ Erro ao recuperar chat ${chatId}:`, error);
      throw error;
    }
    
    if (!chat || !Array.isArray(chat.messages)) {
      logger.error(`❌ Chat ${chatId} não encontrado ou não tem mensagens válidas`);
      return false;
    }
    
    // Analisar e corrigir mensagens
    let repaired = false;
    const repairedMessages = chat.messages.map(msg => {
      if (typeof msg.content === 'string' && msg.content.endsWith('...')) {
        // Remove o truncamento '...' no final da mensagem
        const newContent = msg.content.replace(/\.\.\.+$/, '');
        if (newContent !== msg.content) {
          repaired = true;
          return { ...msg, content: newContent };
        }
      }
      return msg;
    });
    
    if (repaired) {
      // Atualizar o chat com as mensagens reparadas
      const { error: updateError } = await supabase
        .from('chats')
        .update({ messages: repairedMessages })
        .eq('id', chatId);
      
      if (updateError) {
        logger.error(`❌ Erro ao atualizar mensagens reparadas:`, updateError);
        throw updateError;
      }
      
      logger.info(`✅ Mensagens reparadas com sucesso para o chat ${chatId}`);
      return true;
    }
    
    logger.info(`ℹ️ Nenhuma reparação necessária para o chat ${chatId}`);
    return false;
  } catch (error) {
    logger.error(`❌ Falha ao reparar mensagens:`, error);
    throw error;
  }
} 