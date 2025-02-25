import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { fetchSupabaseOrganizations } from '~/lib/supabase.server';

/**
 * Endpoint de proxy para buscar organizações do Supabase.
 * Este endpoint atua como um intermediário para evitar problemas de CORS.
 */
export const loader: LoaderFunction = async ({ request }) => {
  // Verificar se o token de acesso está presente no cabeçalho
  const authToken = request.headers.get('X-Supabase-Auth');
  
  if (!authToken) {
    console.error('❌ Authentication token not provided in request');
    return json({ error: 'Authentication token not provided' }, { status: 401 });
  }

  try {
    console.log('🔍 Server: Fetching Supabase organizations...');
    
    // Usar a função de serviço para buscar as organizações
    const organizations = await fetchSupabaseOrganizations(authToken);
    
    console.log('✅ Server: Organizations retrieved successfully:', organizations.length);
    
    // Retornar os dados para o cliente
    return json(organizations);
    
  } catch (error) {
    console.error('❌ Server: Error processing request:', error);
    return json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 