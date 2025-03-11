import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getOrCreateClient } from './client';
import { invalidateChatsCache } from '~/lib/persistence/db';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
}

const AUTH_DEBUG = false; // Desativa a maioria dos logs, mantém apenas erros

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Começa como true para evitar flash de conteúdo
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize supabase client
  const supabase = useMemo(() => getOrCreateClient(), []);

  // Log condicional
  const conditionalLog = (message: string) => {
    if (AUTH_DEBUG) {
      console.log(message);
    }
  };

  // Authentication methods
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 AuthContext: Iniciando login...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('✨ AuthContext: Login bem sucedido:', data);
      
      // Invalidar cache para garantir dados atualizados após login
      invalidateChatsCache();
      
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Erro no login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    console.log('📝 AuthContext: Iniciando cadastro...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      if (error) throw error;
      console.log('🎉 AuthContext: Cadastro bem sucedido:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Erro no cadastro:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    console.log('🚫 AuthContext: Iniciando logout...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('💥 AuthContext: Erro no logout:', error);
      } else {
        console.log('👋 AuthContext: Logout bem sucedido');
        // Garantir que o estado local seja limpo imediatamente
        setSession(null);
        setUser(null);
        // Invalidar cache
        invalidateChatsCache();
      }
      return { error };
    } catch (error: any) {
      console.error('💥 AuthContext: Erro no logout:', error);
      return { error };
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    console.log('📨 AuthContext: Iniciando redefinição de senha...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log('📨 AuthContext: Redefinição de senha bem sucedida:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Erro na redefinição de senha:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Configuração inicial da autenticação
  useEffect(() => {
    if (isInitialized) return;
    
    conditionalLog('🔄 AuthContext: Inicializando estado de autenticação...');
    
    // Função para atualizar o estado da autenticação
    const updateAuthState = (session: Session | null) => {
      conditionalLog(`🔄 AuthContext: Atualizando estado com sessão: ${session ? 'presente' : 'ausente'}`);
      
      if (!session?.user?.id) {
        setSession(null);
        setUser(null);
        return;
      }

      // Só atualiza se realmente houver mudança
      setSession((prev: Session | null) => {
        if (prev?.user?.id === session.user.id) return prev;
        return session;
      });
      
      setUser((prev: User | null) => {
        if (prev?.id === session.user.id) return prev;
        return session.user;
      });
    };

    // Verificar sessão atual - usando o método getSession do Supabase
    // que já utiliza cookies/localStorage nativamente
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      conditionalLog(`📡 AuthContext: Sessão atual obtida: ${session ? 'presente' : 'ausente'}`);
      
      if (session) {
        updateAuthState(session);
      }
      
      setIsInitialized(true);
      setLoading(false);
    });

    // Inscrever para mudanças de autenticação - executado apenas uma vez
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        // Somente loga alterações reais de estado
        if ((newSession && !session) || (!newSession && session) || 
            (newSession?.user?.id !== session?.user?.id)) {
          conditionalLog('🔔 AuthContext: Mudança no estado de autenticação detectada');
          updateAuthState(newSession);
        }
      }
    );

    // Cleanup
    return () => {
      conditionalLog('🧹 AuthContext: Limpando inscrição de eventos de autenticação');
      subscription.unsubscribe();
    };
  }, [supabase, isInitialized, session]);

  // Memoize context value
  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [session, user, loading, signIn, signUp, signOut, resetPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
