import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuração do Supabase não encontrada. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão definidas no .env');
  throw new Error('Configuração do Supabase não encontrada');
}

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Função para obter ou criar o cliente Supabase
export const getOrCreateClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error);
      throw error;
    }
  }
  return supabaseClient;
};
