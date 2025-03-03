import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { LLMManager } from '~/lib/modules/llm/manager';

/**
 * Endpoint para verificar se existe uma chave de API definida no ambiente do servidor
 * para um provedor específico.
 * 
 * Requer um parâmetro de consulta 'provider' com o nome do provedor.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Obter o nome do provedor da URL
    const url = new URL(request.url);
    const providerName = url.searchParams.get('provider');
    
    if (!providerName) {
      return json({ 
        error: 'Parâmetro "provider" não fornecido' 
      }, { status: 400 });
    }

    console.log(`🔍 Verificando chave de API no ambiente para o provedor: ${providerName}`);
    
    // Obter instância do LLMManager e converter process.env para o tipo esperado
    const env = process.env as unknown as Record<string, string>;
    const llmManager = LLMManager.getInstance(env);
    
    // Obter o provedor pelo nome
    const provider = llmManager.getProvider(providerName);
    
    if (!provider) {
      return json({ 
        error: `Provedor "${providerName}" não encontrado`,
        isSet: false 
      }, { status: 404 });
    }
    
    // Verificar se existe uma chave definida no arquivo .env
    // Para isso, usamos o config do provedor para saber qual é a variável de ambiente que contém a chave
    const apiTokenKey = provider.config.apiTokenKey;
    
    // Verificar se a chave existe no ambiente
    const isKeySet = apiTokenKey && !!process.env[apiTokenKey];
    
    console.log(`✅ Chave de API para ${providerName} ${isKeySet ? 'encontrada' : 'não encontrada'} no ambiente`);
    
    return json({ isSet: isKeySet });
    
  } catch (error) {
    console.error('❌ Erro ao verificar chave de API no ambiente:', error);
    return json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      isSet: false
    }, { status: 500 });
  }
} 