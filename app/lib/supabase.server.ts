/**
 * Este arquivo contém funções e configurações do Supabase específicas para o servidor.
 * Não importe este arquivo no cliente.
 */

// Configurações
export const SUPABASE_CONFIG = {
  clientId: process.env.VITE_SUPABASE_CLIENT_ID || '',
  clientSecret: process.env.VITE_SUPABASE_CLIENT_SECRET || '',
  redirectUri: process.env.VITE_SUPABASE_REDIRECT_URI || 'http://localhost:5173/oauth/supabase',
  apiUrl: 'https://api.supabase.com',
};

/**
 * Troca um código de autorização por tokens de acesso e atualização
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const tokenUrl = `${SUPABASE_CONFIG.apiUrl}/v1/oauth/token`;
  
  // Encode client ID and secret for Basic Authentication
  const credentials = Buffer.from(
    `${SUPABASE_CONFIG.clientId}:${SUPABASE_CONFIG.clientSecret}`
  ).toString('base64');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SUPABASE_CONFIG.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erro na resposta da API do Supabase: ${JSON.stringify(data)}`);
  }
  
  return data;
}

/**
 * Busca projetos do Supabase usando o token de acesso do usuário
 */
export async function fetchSupabaseProjects(accessToken: string) {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido');
  }

  const projectsUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects`;
  
  const response = await fetch(projectsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar projetos: ${JSON.stringify(data)}`);
  }
  
  return data;
}

/**
 * Busca organizações do Supabase usando o token de acesso do usuário
 */
export async function fetchSupabaseOrganizations(accessToken: string) {
  if (!accessToken) {
    throw new Error('Access token not provided');
  }

  const orgsUrl = `${SUPABASE_CONFIG.apiUrl}/v1/organizations`;
  
  const response = await fetch(orgsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Error fetching organizations: ${JSON.stringify(data)}`);
  }
  
  return data;
}

/**
 * Cria um novo projeto no Supabase
 */
export async function createSupabaseProject(
  accessToken: string, 
  params: {
    name: string;
    organization_id: string;
    region: string;
    plan?: string;
    db_pass: string;
  }
) {
  if (!accessToken) {
    throw new Error('Access token not provided');
  }

  const createProjectUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects`;
  
  const response = await fetch(createProjectUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: params.name,
      organization_id: params.organization_id,
      region: params.region,
      plan: params.plan || 'free',
      db_pass: params.db_pass,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Error creating project: ${JSON.stringify(data)}`);
  }
  
  return data;
} 