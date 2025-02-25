import { json } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { exchangeCodeForToken, SUPABASE_CONFIG } from '~/lib/supabase.server';

// API endpoint para trocar o código por token
export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Método não permitido' }, { status: 405 });
  }

  try {
    // Extrair o corpo da requisição
    const body = await request.json();
    const { code, code_verifier } = body;

    if (!code || !code_verifier) {
      return json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    console.log('🔄 Servidor: Trocando código por token...');
    console.log('📦 Código recebido:', code);
    console.log('🔑 Code verifier recebido (primeiros 5 caracteres):', code_verifier.substring(0, 5) + '...');

    // Verificar se as credenciais estão disponíveis
    if (!SUPABASE_CONFIG.clientId || !SUPABASE_CONFIG.clientSecret) {
      console.error('❌ Credenciais do Supabase não encontradas no servidor');
      return json({ 
        error: 'Configuração incompleta no servidor',
        details: {
          hasClientId: !!SUPABASE_CONFIG.clientId,
          hasClientSecret: !!SUPABASE_CONFIG.clientSecret,
          hasRedirectUri: !!SUPABASE_CONFIG.redirectUri
        }
      }, { status: 500 });
    }

    // Trocar o código por um token usando a função do servidor
    try {
      const data = await exchangeCodeForToken(code, code_verifier);
      
      console.log('✅ Servidor: Token obtido com sucesso!');
      
      // Retornar os tokens para o cliente
      return json({ 
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type
      });
    } catch (exchangeError) {
      console.error('❌ Servidor: Erro na troca de código por token:', exchangeError);
      return json({ 
        error: 'Erro ao obter token',
        message: exchangeError instanceof Error ? exchangeError.message : 'Erro desconhecido'
      }, { status: 502 });
    }
    
  } catch (error) {
    console.error('❌ Servidor: Erro ao processar solicitação:', error);
    return json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}; 