import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createServerClient } from '@supabase/ssr';
import { type CookieOptions, createServerClient as _createServerClient } from '@supabase/ssr';

export async function requireAuth(supabase: any) {
  console.log('🔐 Verificando autenticação...');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log('🔑 Usuário:', user ? 'Encontrado' : 'Não encontrado');

  if (error) {
    console.error('❌ Erro ao verificar autenticação:', error.message);
    throw redirect('/login');
  }

  if (!user) {
    console.log('⚠️ Usuário não autenticado, redirecionando para /login');
    throw redirect('/login');
  }

  console.log('✅ Usuário autenticado:', user.email);
  return user;
}
