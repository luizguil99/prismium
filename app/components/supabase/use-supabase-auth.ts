import { useState } from 'react';
import { getOrCreateClient } from './client';

export function useSupabaseAuth() {
  const [loading, setLoading] = useState(false);
  const supabase = getOrCreateClient();

  const signIn = async (email: string, password: string) => {
    console.log('🔐 useSupabaseAuth: Iniciando login...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('✨ useSupabaseAuth: Login bem sucedido:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 useSupabaseAuth: Erro no login:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    console.log('📝 useSupabaseAuth: Iniciando cadastro...');
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
      console.log('🎉 useSupabaseAuth: Cadastro bem sucedido:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 useSupabaseAuth: Erro no cadastro:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚫 useSupabaseAuth: Iniciando logout...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('👋 useSupabaseAuth: Logout bem sucedido');
      return { error: null };
    } catch (error: any) {
      console.error('💥 useSupabaseAuth: Erro no logout:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    console.log('📨 useSupabaseAuth: Iniciando redefinição de senha...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log('📨 useSupabaseAuth: Redefinição de senha bem sucedida:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 useSupabaseAuth: Erro na redefinição de senha:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
