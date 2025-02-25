import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { fetchSupabaseDatabaseTables } from '~/lib/supabase.server';

/**
 * Endpoint para buscar as tabelas de um banco de dados Supabase
 * 
 * Requer um token de autenticação Supabase válido no cabeçalho X-Supabase-Auth
 * Requer um parâmetro de consulta projectRef (a referência do projeto, não o ID)
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verificar se o token está presente
    const authToken = request.headers.get('X-Supabase-Auth');
    if (!authToken) {
      return json({ error: 'Unauthorized: No auth token provided' }, { status: 401 });
    }

    // Obter a referência do projeto da URL
    const url = new URL(request.url);
    const projectRef = url.searchParams.get('projectRef');
    if (!projectRef) {
      return json({ error: 'Bad Request: Missing projectRef parameter' }, { status: 400 });
    }

    console.log('🔍 Buscando tabelas para o projeto ref:', projectRef);

    // Usar a função de serviço para buscar as tabelas
    try {
      const tables = await fetchSupabaseDatabaseTables(authToken, projectRef);
      return json(tables);
    } catch (error) {
      console.error('❌ Erro na resposta da API do Supabase:', error instanceof Error ? error.message : 'Erro desconhecido');
      return json(
        { error: 'Error fetching database tables', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar a solicitação:', error);
    return json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 