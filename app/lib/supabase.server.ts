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