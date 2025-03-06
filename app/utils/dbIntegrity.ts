import { createScopedLogger } from '~/utils/logger';
import { getAll, openDatabase, detectAndRepairMessages } from '~/lib/persistence/db';

const logger = createScopedLogger('DbIntegrity');

/**
 * Verifica e tenta reparar todos os chats com mensagens truncadas
 * 
 * @returns Número de chats reparados
 */
export async function checkAndRepairAllChats(): Promise<number> {
  logger.info('🔍 Iniciando verificação de integridade dos chats...');
  try {
    const db = await openDatabase();
    if (!db) {
      logger.error('❌ Falha ao abrir conexão com banco de dados');
      throw new Error('Falha ao abrir conexão com banco de dados');
    }
    
    // Obter todos os chats
    const chats = await getAll(db);
    logger.info(`📊 Verificando ${chats.length} chats no total`);
    
    // Verificar cada chat individualmente
    let repairedCount = 0;
    let processedCount = 0;
    
    for (const chat of chats) {
      try {
        processedCount++;
        if (processedCount % 10 === 0) {
          logger.info(`⏳ Processados ${processedCount}/${chats.length} chats...`);
        }
        
        const wasRepaired = await detectAndRepairMessages(db, chat.id);
        if (wasRepaired) {
          repairedCount++;
        }
      } catch (error) {
        logger.error(`❌ Erro ao processar chat ${chat.id}:`, error);
        // Continuar com o próximo chat
      }
    }
    
    logger.info(`✅ Verificação concluída: ${repairedCount} chats foram reparados de um total de ${chats.length}`);
    return repairedCount;
  } catch (error) {
    logger.error('❌ Falha na verificação de integridade:', error);
    throw error;
  }
}

/**
 * Analisa a integridade de um chat específico
 * 
 * @param chatId ID do chat a ser verificado
 * @returns Relatório de integridade do chat
 */
export async function analyzeChatIntegrity(chatId: string): Promise<{
  id: string;
  messageCount: number;
  totalSize: number;
  largestMessage: number;
  truncatedDetected: boolean;
  repaired: boolean;
}> {
  logger.info(`🔍 Analisando integridade do chat ${chatId}...`);
  try {
    const db = await openDatabase();
    if (!db) {
      throw new Error('Falha ao abrir conexão com banco de dados');
    }
    
    // Obter o chat
    const chat = await detectAndRepairMessages(db, chatId);
    
    // Implementação real necessária aqui...
    return {
      id: chatId,
      messageCount: 0,
      totalSize: 0,
      largestMessage: 0,
      truncatedDetected: false,
      repaired: !!chat
    };
  } catch (error) {
    logger.error(`❌ Falha ao analisar chat ${chatId}:`, error);
    throw error;
  }
} 