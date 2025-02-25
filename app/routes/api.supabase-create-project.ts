import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { createSupabaseProject } from '~/lib/supabase.server';

/**
 * Endpoint de proxy para criar projetos no Supabase.
 * Este endpoint atua como um intermediário para evitar problemas de CORS.
 */
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Verificar se o token de acesso está presente no cabeçalho
  const authToken = request.headers.get('X-Supabase-Auth');
  
  if (!authToken) {
    console.error('❌ Authentication token not provided in request');
    return json({ error: 'Authentication token not provided' }, { status: 401 });
  }

  try {
    // Extrair o corpo da requisição
    const body = await request.json();
    const { name, organization_id, region, plan, db_pass } = body;

    // Validar campos obrigatórios
    if (!name || !organization_id || !region || !db_pass) {
      return json({ error: 'Invalid parameters' }, { status: 400 });
    }

    console.log('🔨 Server: Creating Supabase project...');
    console.log('📋 Project details:', {
      name,
      organization_id,
      region,
      plan: plan || 'free'
    });
    
    // Usar a função de serviço para criar o projeto
    const project = await createSupabaseProject(authToken, {
      name,
      organization_id,
      region,
      plan,
      db_pass
    });
    
    console.log('✅ Server: Project created successfully:', project.id);
    
    // Retornar os dados para o cliente
    return json(project);
    
  } catch (error) {
    console.error('❌ Server: Error processing request:', error);
    return json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 