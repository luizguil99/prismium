import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { fetchSupabaseProjects } from '~/lib/supabase.server';

/**
 * Endpoint de proxy para buscar projetos do Supabase.
 * Este endpoint atua como um intermediário para evitar problemas de CORS.
 */
export const loader: LoaderFunction = async ({ request }) => {
  // Verificar se o token de acesso está presente no cabeçalho
  const authToken = request.headers.get('X-Supabase-Auth');
  
  if (!authToken) {
    console.error('❌ Token de autenticação não fornecido na requisição');
    return json({ error: 'Token de autenticação não fornecido' }, { status: 401 });
  }

  try {
    console.log('🔍 Servidor: Buscando projetos do Supabase...');
    
    // Usar a função de serviço para buscar os projetos
    const projects = await fetchSupabaseProjects(authToken);
    
    console.log('✅ Servidor: Projetos obtidos com sucesso:', projects.length);
    
    // Retornar os dados para o cliente
    return json(projects);
    
  } catch (error) {
    console.error('❌ Servidor: Erro ao processar solicitação:', error);
    return json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}; 