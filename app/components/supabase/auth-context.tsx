import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/auth-helpers-remix';
import { getOrCreateClient } from './client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize supabase client
  const supabase = useMemo(() => getOrCreateClient(), []);

  // Memoize signOut function
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao fazer logout:', error);
  }, [supabase]);

  useEffect(() => {
    if (isInitialized) return;

    // Função para atualizar o estado da autenticação
    const updateAuthState = (session: Session | null) => {
      if (!session?.user?.id) {
        setSession(null);
        setUser(null);
        return;
      }

      // Só atualiza se realmente houver mudança
      setSession((prev) => {
        if (prev?.user?.id === session.user.id) return prev;
        return session;
      });
      
      setUser((prev) => {
        if (prev?.id === session.user.id) return prev;
        return session.user;
      });
    };

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
      setIsInitialized(true);
    });

    // Inscrever para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        updateAuthState(session);
      }
    );

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, isInitialized]);

  // Memoize context value
  const value = useMemo(
    () => ({
      session,
      user,
      signOut,
    }),
    [session, user, signOut]
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
