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
  
  const data = await response.json() as {
    databases?: Array<{
      schemas?: Array<{
        name: string;
        tables?: Array<{
          id: string;
          name: string;
          schema: string;
          comment?: string;
        }>;
      }>;
    }>;
  };
  
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
 * Busca as colunas de uma tabela Supabase
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

  console.log(`🔄 Iniciando busca de colunas para tabela ${tableName} no projeto ${projectRef}`);

  // MÉTODO PRINCIPAL: Consulta SQL direta usando o endpoint database/query
  try {
    console.log('🔍 Buscando colunas via consulta SQL direta');
    
    // Usar o endpoint para consulta direta ao banco de dados
    const queryUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects/${projectRef}/database/query`;
    
    // Consulta SQL melhorada para obter todas as informações necessárias sobre as colunas
    const sqlQuery = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable,
        c.column_default as default_value,
        (
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = '${tableName}'
              AND ccu.column_name = c.column_name
          )
        ) as is_primary,
        (
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu 
              ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
              AND tc.table_name = '${tableName}'
              AND ccu.column_name = c.column_name
          )
        ) as is_unique
      FROM information_schema.columns c
      WHERE c.table_name = '${tableName}'
      AND c.table_schema = 'public'
      ORDER BY c.ordinal_position;
    `;
    
    console.log('📝 Executando consulta:', sqlQuery);
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na consulta SQL (${response.status}):`, errorText);
      throw new Error(`Erro na consulta SQL: ${response.status}`);
    }
    
    const queryResult = await response.json() as {
      result?: Array<{
        name: string;
        type: string;
        is_nullable: string | boolean;
        default_value: string | null;
        is_primary: boolean;
        is_unique: boolean;
      }>;
      data?: Array<any>;
    };
    
    const columns = queryResult.result || queryResult.data || [];
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log(`✅ Encontradas ${columns.length} colunas via SQL para a tabela ${tableName}:`, columns);
      
      // Normaliza os dados para o formato esperado
      return columns.map(col => ({
        name: col.name || '',
        type: col.type || 'text',
        is_nullable: col.is_nullable === 'YES' || col.is_nullable === true,
        is_primary: !!col.is_primary,
        is_unique: !!col.is_unique,
        default_value: col.default_value || null
      }));
    } else {
      console.warn(`⚠️ A consulta foi bem-sucedida, mas não retornou colunas para a tabela ${tableName}`);
    }
  } catch (queryError) {
    console.error('❌ Erro ao executar consulta SQL:', queryError);
  }

  // MÉTODO ALTERNATIVO: Buscar metadados do contexto do banco de dados
  try {
    console.log('🔍 Tentando obter metadados via endpoint de contexto do banco de dados');
    const databaseContextUrl = `${SUPABASE_CONFIG.apiUrl}/v1/projects/${projectRef}/database/context`;
    
    const contextResponse = await fetch(databaseContextUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (contextResponse.ok) {
      const contextData = await contextResponse.json() as {
        databases?: Array<{
          schemas?: Array<{
            name: string;
            tables?: Array<{
              name: string;
              columns?: Array<{
                name: string;
                type: string;
                is_nullable: boolean;
                is_primary: boolean;
                is_unique: boolean;
                default_value: string | null;
              }>;
            }>;
          }>;
        }>;
      };
      
      if (contextData.databases && Array.isArray(contextData.databases)) {
        for (const db of contextData.databases) {
          if (db.schemas && Array.isArray(db.schemas)) {
            for (const schema of db.schemas) {
              if (schema.name === 'public' && schema.tables && Array.isArray(schema.tables)) {
                for (const table of schema.tables) {
                  if (table.name === tableName && table.columns && Array.isArray(table.columns)) {
                    console.log(`✅ Encontradas ${table.columns.length} colunas via contexto para a tabela ${tableName}`);
                    return table.columns;
                  }
                }
              }
            }
          }
        }
      }
      
      console.warn('⚠️ Não foi possível encontrar a tabela nos metadados do contexto');
    } else {
      const errorText = await contextResponse.text();
      console.error(`❌ Erro ao buscar contexto do banco de dados (${contextResponse.status}):`, errorText);
    }
  } catch (contextError) {
    console.error('❌ Erro ao processar contexto do banco de dados:', contextError);
  }

  // Se chegamos aqui, não conseguimos obter os dados das colunas
  console.error(`❌ Todos os métodos falharam ao buscar colunas para a tabela ${tableName}`);
  
  // Retornar um array vazio em vez de dados falsos
  return [];
} 