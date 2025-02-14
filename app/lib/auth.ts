import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createServerClient } from '@supabase/auth-helpers-remix';

export async function requireAuth({ request }: LoaderFunctionArgs) {
  console.log(' Verificando autenticação...');
  
  const response = new Response();
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL ?? '',
    import.meta.env.SUPABASE_ANON_KEY ?? '',
    { request, response }
  );

  const { data: { session }, error } = await supabase.auth.getSession();
  console.log(' Sessão:', session ? 'Existe' : 'Não existe');

  if (error) {
    console.error(' Erro ao verificar sessão:', error.message);
    throw redirect('/login');
  }

  if (!session?.user) {
    console.log(' Usuário não autenticado, redirecionando para /login');
    throw redirect('/login');
  }

  console.log(' Usuário autenticado:', session.user.email);
  return session.user;
}
