import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getOrCreateClient } from './client';


interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
}

const AUTH_DEBUG = false; // Disables most logs, keeps only errors

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Starts as true to avoid content flash
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize supabase client
  const supabase = useMemo(() => getOrCreateClient(), []);

  // Conditional logging
  const conditionalLog = (message: string) => {
    if (AUTH_DEBUG) {
      console.log(message);
    }
  };

  // Authentication methods
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 AuthContext: Starting login...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('✨ AuthContext: Login successful:', data);
      
      
      
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Login error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    console.log('📝 AuthContext: Starting registration...');
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
      console.log('🎉 AuthContext: Registration successful:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Registration error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    console.log('🚫 AuthContext: Starting logout...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('💥 AuthContext: Logout error:', error);
      } else {
        console.log('👋 AuthContext: Logout successful');
        // Ensure local state is cleared immediately
        setSession(null);
        setUser(null);
        
      }
      return { error };
    } catch (error: any) {
      console.error('💥 AuthContext: Logout error:', error);
      return { error };
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    console.log('📨 AuthContext: Starting password reset...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log('📨 AuthContext: Password reset successful:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 AuthContext: Password reset error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial authentication setup
  useEffect(() => {
    if (isInitialized) return;
    
    conditionalLog('🔄 AuthContext: Initializing authentication state...');
    
    // Function to update authentication state
    const updateAuthState = (session: Session | null) => {
      conditionalLog(`🔄 AuthContext: Updating state with session: ${session ? 'present' : 'absent'}`);
      
      if (!session?.user?.id) {
        setSession(null);
        setUser(null);
        return;
      }

      // Only update if there's an actual change
      setSession((prev: Session | null) => {
        if (prev?.user?.id === session.user.id) return prev;
        return session;
      });
      
      setUser((prev: User | null) => {
        if (prev?.id === session.user.id) return prev;
        return session.user;
      });
    };

    // Check current session - using Supabase's getSession method
    // which already uses cookies/localStorage natively
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      conditionalLog(`📡 AuthContext: Current session obtained: ${session ? 'present' : 'absent'}`);
      
      if (session) {
        updateAuthState(session);
      }
      
      setIsInitialized(true);
      setLoading(false);
    });

    // Subscribe to authentication changes - executed only once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        // Only log actual state changes
        if ((newSession && !session) || (!newSession && session) || 
            (newSession?.user?.id !== session?.user?.id)) {
          conditionalLog('🔔 AuthContext: Authentication state change detected');
          updateAuthState(newSession);
        }
      }
    );

    // Cleanup
    return () => {
      conditionalLog('🧹 AuthContext: Cleaning up authentication event subscription');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
