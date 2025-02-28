import { getOrCreateClient } from './client';

/**
 * Sincroniza a sessão do Supabase entre servidor e cliente.
 * 
 * Este módulo deve ser chamado no carregamento da aplicação
 * para garantir que a sessão do usuário seja reconhecida corretamente
 * tanto no servidor quanto no cliente.
 */

/**
 * Atualiza a sessão no cliente Supabase.
 * Deve ser chamado no carregamento da aplicação.
 */
export async function syncSupabaseSession() {
  try {
    console.log('🔄 Sincronizando sessão Supabase...');
    const supabase = getOrCreateClient();
    
    // Obter sessão atual
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao obter sessão:', error.message);
      return { success: false, error };
    }
    
    if (data.session) {
      console.log('✅ Sessão Supabase encontrada e sincronizada');
      return { success: true, session: data.session };
    } else {
      console.log('ℹ️ Nenhuma sessão Supabase ativa encontrada');
      return { success: true, session: null };
    }
  } catch (error) {
    console.error('💥 Erro inesperado ao sincronizar sessão:', error);
    return { success: false, error };
  }
}

/**
 * Verifica se o cliente está autenticado.
 * Retorna o usuário se estiver autenticado, null caso contrário.
 */
export async function checkClientAuth() {
  try {
    const supabase = getOrCreateClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Erro ao verificar autenticação do cliente:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('💥 Erro inesperado ao verificar autenticação:', error);
    return null;
  }
}

/**
 * Força a atualização da sessão usando o refreshToken se disponível.
 * Útil quando a sessão parece ter expirado mas o refreshToken ainda é válido.
 */
export async function refreshSession() {
  try {
    const supabase = getOrCreateClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Erro ao atualizar sessão:', error.message);
      return { success: false, error };
    }
    
    if (data.session) {
      console.log('✅ Sessão atualizada com sucesso');
      return { success: true, session: data.session };
    } else {
      console.log('⚠️ Não foi possível atualizar a sessão');
      return { success: false, session: null };
    }
  } catch (error) {
    console.error('💥 Erro inesperado ao atualizar sessão:', error);
    return { success: false, error };
  }
} 