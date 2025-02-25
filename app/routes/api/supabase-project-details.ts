import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Endpoint para buscar detalhes de um projeto Supabase
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

    console.log('🔍 Buscando detalhes para o projeto ref:', projectRef);

    // Fazer uma solicitação para a API do Supabase para obter detalhes do projeto
    // Note que usamos 'ref' em vez de 'id' na URL, conforme a documentação da API
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
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
        { error: 'Error fetching project details', message: errorMsg },
        { status: response.status }
      );
    }

    // Retorne os detalhes do projeto
    const projectData = await response.json();
    return json(projectData);
    
  } catch (error) {
    console.error('❌ Erro ao processar a solicitação:', error);
    return json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 