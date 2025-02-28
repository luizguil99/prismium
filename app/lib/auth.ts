import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createServerClient } from '@supabase/ssr';
import { type CookieOptions, createServerClient as _createServerClient } from '@supabase/ssr';

export async function requireAuth({ request }: LoaderFunctionArgs) {
  console.log('🔐 Verificando autenticação...');

  const response = new Response();
  const cookieOptions: CookieOptions = {
    name: 'sb-auth',
    secure: true,
    sameSite: 'lax',
    path: '/',
  };

  const supabase = _createServerClient(import.meta.env.SUPABASE_URL ?? '', import.meta.env.SUPABASE_ANON_KEY ?? '', {
    cookies: {
      get: () => request.headers.get('cookie'),
      set: (name, value, options) => response.headers.set('set-cookie', `${name}=${value}`),
      remove: (name, options) => response.headers.set('set-cookie', `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`),
    },
  });

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
