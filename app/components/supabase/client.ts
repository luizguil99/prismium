import { createClient } from '@supabase/supabase-js';
import { supabaseStore } from '~/lib/stores/supabase';

// Função para obter o cliente Supabase
export const getSupabaseClient = () => {
  const config = supabaseStore.config.get();
  
  if (!config) {
    throw new Error('Configuração do Supabase não encontrada');
  }

  return createClient(config.projectUrl, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Função para obter ou criar o cliente Supabase
export const getOrCreateClient = () => {
  if (!supabaseClient) {
    supabaseClient = getSupabaseClient();
  }
  return supabaseClient;
};
