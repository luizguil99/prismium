import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

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

    // Fazer uma solicitação para a API do Supabase para obter as colunas da tabela
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/tables/${tableName}/columns`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Se a resposta não for bem-sucedida, retorne o erro
      const errorText = await response.text();
      let errorMsg;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.message || response.statusText;
      } catch {
        errorMsg = errorText || response.statusText;
      }
      
      console.error('❌ Erro na resposta da API do Supabase:', errorMsg);
      return json(
        { error: 'Error fetching table columns', message: errorMsg },
        { status: response.status }
      );
    }

    // Processar e simplificar os dados de colunas
    const columnsData = await response.json();
    
    // Transformar os dados para um formato mais fácil de usar no frontend
    const formattedColumns = Array.isArray(columnsData) ? columnsData.map(column => ({
      name: column.name,
      type: column.data_type || column.type,
      is_nullable: column.is_nullable === 'YES' || column.is_nullable === true,
      is_primary: column.is_primary_key === true || column.is_primary === true,
      is_unique: column.is_unique === true,
      default_value: column.default_value || column.column_default || null
    })) : [];
    
    return json(formattedColumns);
    
  } catch (error) {
    console.error('❌ Erro ao processar a solicitação:', error);
    return json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 