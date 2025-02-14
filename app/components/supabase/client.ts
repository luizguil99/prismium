import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/auth-helpers-remix';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuração do Supabase não encontrada. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão definidas no .env');
  throw new Error('Configuração do Supabase não encontrada');
}

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

// Função para obter ou criar o cliente Supabase
export const getOrCreateClient = () => {
  if (!supabaseClient) {
    console.log('🔧 Criando novo cliente Supabase...');
    try {
      supabaseClient = createSupabaseBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
      );
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error);
      throw error;
    }
  }
  return supabaseClient;
};

// Função específica para o cliente (browser)
export const createBrowserClient = () => {
  console.log('🌐 Criando cliente Supabase para o browser...');
  return createSupabaseBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  );
};
