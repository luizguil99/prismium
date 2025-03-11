import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

const DEBUG = false; // Controla logs de depuração

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuração do Supabase não encontrada. Verifique se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão definidas no .env');
  throw new Error('Configuração do Supabase não encontrada');
}

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

// Função para obter ou criar o cliente Supabase
export const getOrCreateClient = () => {
  if (!supabaseClient) {
    // Log condicional apenas em modo debug
    if (DEBUG) console.log('🔧 Criando novo cliente Supabase...');
    
    try {
      supabaseClient = createSupabaseBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          auth: {
            persistSession: true, // Manter sessão entre carregamentos
            autoRefreshToken: true, // Atualizar token automaticamente
            detectSessionInUrl: false, // Não detectar sessão na URL
            flowType: 'pkce', // Usar PKCE para melhor segurança
            debug: DEBUG, // Log de depuração apenas se DEBUG estiver ativo
            // Cookie ainda funciona automaticamente na opção padrão
          },
          // Configurações para diminuir requisições de rede
          global: {
            headers: {
              // Cabeçalhos de cache apropriados para reduzir chamadas duplicadas
              'Cache-Control': 'no-cache'
            }
          },
          // Configurações para diminuir eventos realtime
          realtime: {
            params: {
              eventsPerSecond: 1 // Limitar eventos de tempo real
            }
          }
        }
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
  if (DEBUG) console.log('🌐 Criando cliente Supabase para o browser...');
  return createSupabaseBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce'
      }
    }
  );
};
