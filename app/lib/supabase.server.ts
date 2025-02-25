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

/**
 * Busca as tabelas de um projeto Supabase usando o endpoint database/context
 */
export async function fetchSupabaseDatabaseTables(accessToken: string, projectRef: string) {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido');
  }

  if (!projectRef) {
    throw new Error('Referência do projeto não fornecida');
  }

  const databaseContextUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects/${projectRef}/database/context`;
  
  const response = await fetch(databaseContextUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar contexto do banco de dados: ${JSON.stringify(data)}`);
  }
  
  // Extrair tabelas do esquema público
  const tables = [];
  
  if (data.databases && Array.isArray(data.databases)) {
    for (const db of data.databases) {
      if (db.schemas && Array.isArray(db.schemas)) {
        for (const schema of db.schemas) {
          if (schema.name === 'public' && schema.tables && Array.isArray(schema.tables)) {
            tables.push(...schema.tables);
          }
        }
      }
    }
  }
  
  return tables;
}

/**
 * Busca as colunas de uma tabela Supabase usando consulta SQL
 */
export async function fetchSupabaseTableColumns(accessToken: string, projectRef: string, tableName: string) {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido');
  }

  if (!projectRef) {
    throw new Error('Referência do projeto não fornecida');
  }

  if (!tableName) {
    throw new Error('Nome da tabela não fornecido');
  }

  // Consulta SQL para obter informações detalhadas sobre as colunas
  const sqlQuery = `
    SELECT 
      column_name as name,
      data_type as type,
      (is_nullable = 'YES') as is_nullable,
      (
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc 
          JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' 
          AND tc.table_name = '${tableName}'
          AND ccu.column_name = columns.column_name
        )
      ) as is_primary,
      (
        EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc 
          JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'UNIQUE' 
          AND tc.table_name = '${tableName}'
          AND ccu.column_name = columns.column_name
        )
      ) as is_unique,
      column_default as default_value
    FROM 
      information_schema.columns
    WHERE 
      table_schema = 'public'
      AND table_name = '${tableName}'
    ORDER BY 
      ordinal_position;
  `;

  // Enviar a consulta SQL usando o endpoint de consulta do banco de dados
  const queryUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects/${projectRef}/database/query`;
  
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sqlQuery
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar colunas da tabela: ${JSON.stringify(data)}`);
  }
  
  // Retornar os resultados da consulta SQL
  return data.result || data.data || [];
} 