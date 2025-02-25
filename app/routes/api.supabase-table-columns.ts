import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { fetchSupabaseTableColumns } from '~/lib/supabase.server';

/**
 * Endpoint para buscar as colunas de uma tabela Supabase
 * 
 * Requer um token de autenticação Supabase válido no cabeçalho X-Supabase-Auth
 * Requer parâmetros de consulta projectRef (a referência do projeto, não o ID) e tableName
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Verificar se o token está presente
    const authToken = request.headers.get('X-Supabase-Auth');
    if (!authToken) {
      return json({ error: 'Unauthorized: No auth token provided' }, { status: 401 });
    }

    // Obter os parâmetros da URL
    const url = new URL(request.url);
    const projectRef = url.searchParams.get('projectRef');
    const tableName = url.searchParams.get('tableName');
    
    if (!projectRef) {
      return json({ error: 'Bad Request: Missing projectRef parameter' }, { status: 400 });
    }
    
    if (!tableName) {
      return json({ error: 'Bad Request: Missing tableName parameter' }, { status: 400 });
    }

    console.log('🔍 Buscando colunas para a tabela:', tableName, 'no projeto ref:', projectRef);

    // Usar a função de serviço para buscar as colunas da tabela
    try {
      const columns = await fetchSupabaseTableColumns(authToken, projectRef, tableName);
      return json(columns);
    } catch (error) {
      console.error('❌ Erro na resposta da API do Supabase:', error instanceof Error ? error.message : 'Erro desconhecido');
      return json(
        { error: 'Error fetching table columns', message: error instanceof Error ? error.message : 'Unknown error' },
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