import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createServerClient } from '@supabase/ssr';
import { type CookieOptions } from '@supabase/ssr';

/**
 * Função de servidor para verificar se o usuário está autenticado.
 * Utilizada em rotas que requerem autenticação.
 * Se o usuário não estiver autenticado, redireciona para a página de login.
 */
export async function requireAuth(supabase: any) {
  console.log('🔐 Checking authentication...');

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

/**
 * Função auxiliar para criar um cliente Supabase no servidor.
 * Usado em loaders e actions de rotas Remix.
 * 
 * IMPORTANTE: Para usar esta função, importe diretamente utils/supabase.server.ts em vez deste utilitário,
 * pois há diferenças de tipagem entre o cliente Cloudflare e Node.js.
 */
export function createServerSupabaseClient(request: Request, env: any) {
  // Esta implementação é apenas uma referência
  // Recomendamos usar a função em utils/supabase.server.ts
  const response = new Response();
  
  // Crie o cliente com a implementação adequada para seu ambiente (Cloudflare/Node)
  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('Cookie')
            ?.split(';')
            .find(c => c.trim().startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append(
            'Set-Cookie',
            `${name}=${value}; Path=${options.path}; ${options.httpOnly ? 'HttpOnly;' : ''}`
          );
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append(
            'Set-Cookie',
            `${name}=; Max-Age=0; Path=${options.path}`
          );
        },
      },
    }
  );

  return supabase;
}
