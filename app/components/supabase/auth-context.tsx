import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from './client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient());

  useEffect(() => {
    console.log(' AuthProvider: Inicializando...');

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(' AuthProvider: Sessão inicial:', session ? 'Encontrada' : 'Não encontrada');
      if (session?.user) {
        console.log(' AuthProvider: Usuário:', session.user.email);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(' AuthProvider: Mudança de estado de autenticação:', _event);
      console.log(' AuthProvider: Nova sessão:', session ? 'Existe' : 'Não existe');
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
