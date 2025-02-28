import { json, redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "~/utils/supabase.server";

/**
 * Exemplo de rota protegida que utiliza os mecanismos de autenticação.
 * Esta rota pode ser usada como modelo para criar outras rotas protegidas.
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  console.log('🔐 ProtectedExample: Iniciando verificação de autenticação...');
  
  // Criar cliente Supabase para o servidor
  const response = new Response();
  const supabase = createServerClient(request, response);
  
  // Verificar autenticação
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ ProtectedExample: Erro de autenticação:', error.message);
      return redirect('/login', {
        headers: response.headers
      });
    }
    
    if (!user) {
      console.log('⚠️ ProtectedExample: Usuário não autenticado, redirecionando para /login');
      return redirect('/login', {
        headers: response.headers
      });
    }
    
    console.log('✅ ProtectedExample: Usuário autenticado:', user.email);
    
    // Buscar dados adicionais do usuário se necessário
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return json(
      { 
        user,
        userData 
      },
      {
        headers: response.headers
      }
    );
    
  } catch (err) {
    console.error('💥 ProtectedExample: Erro inesperado:', err);
    return redirect('/login', {
      headers: response.headers
    });
  }
}

export default function ProtectedExample() {
  const { user, userData } = useLoaderData<typeof loader>();
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Página Protegida</h1>
      
      <div className="bg-zinc-800 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Seus Dados</h2>
        <p>Email: {user.email}</p>
        <p>ID: {user.id}</p>
        {userData && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Perfil:</h3>
            <pre className="bg-zinc-900 p-3 rounded overflow-auto">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <p className="text-zinc-400">
        Esta página só é acessível para usuários autenticados.
        Se você pode ver esta página, o sistema de autenticação está funcionando corretamente.
      </p>
    </div>
  );
} 