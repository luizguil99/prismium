/**
 * Contexto de autenticação e hook useAuth
 * Fornece acesso ao estado do usuário e métodos de autenticação
 */
export * from './auth-context';

/**
 * Hook useSupabaseAuth (agora um wrapper em torno de useAuth)
 * Mantido para compatibilidade com código existente
 */
export * from './use-supabase-auth';

/**
 * Funções para criar e gerenciar o cliente Supabase
 */
export * from './client';

/**
 * Componente de modal para configuração do Supabase
 */
export * from './SupabaseConfigModal';
