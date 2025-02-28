import { useAuth } from './auth-context';

export function useSupabaseAuth() {
  const { loading, signIn, signUp, signOut, resetPassword } = useAuth();

  return {
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
