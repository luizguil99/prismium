import { useEffect, useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { handleOAuthCallback } from '~/components/supabase/SupabaseConfigModal';
import { toast } from 'react-toastify';

// Cliente: verifica se estamos no navegador
const isBrowser = typeof window !== 'undefined';

export default function SupabaseOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBrowser) return; // Executa apenas no navegador
    
    async function processCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        // Adicionar informações de depuração
        const savedState = localStorage.getItem('supabase_oauth_state');
        const codeVerifier = localStorage.getItem('supabase_oauth_code_verifier');
        
        setDebugInfo({
          code,
          state,
          savedState,
          hasCodeVerifier: !!codeVerifier,
          url: window.location.href,
        });
        
        console.log('📡 Callback OAuth do Supabase recebido:', { code, state });
        console.log('🔐 Estado armazenado:', savedState);
        console.log('🔑 Code verifier presente:', !!codeVerifier);
        
        if (!code || !state) {
          throw new Error('Parâmetros de callback inválidos (code ou state ausentes)');
        }
        
        if (!savedState) {
          throw new Error('Estado OAuth não encontrado no localStorage. Talvez a sessão expirou ou foi iniciada em outra janela.');
        }
        
        if (state !== savedState) {
          throw new Error(`Estado OAuth inválido. Recebido: ${state}, Esperado: ${savedState}`);
        }
        
        if (!codeVerifier) {
          throw new Error('Code verifier não encontrado no localStorage. Talvez a sessão expirou ou foi iniciada em outra janela.');
        }
        
        // Tudo parece estar em ordem, vamos prosseguir com a troca do código por tokens
        console.log('✅ Validação do callback concluída, trocando código por tokens...');
        
        const result = await handleOAuthCallback(code, state);
        console.log('🎉 Tokens obtidos com sucesso!', { hasAccessToken: !!result.access_token });
        
        toast.success('Conectado ao Supabase com sucesso!');
        
        // Redirecionar para a página principal após autenticação bem-sucedida
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err) {
        console.error('❌ Erro no callback do Supabase:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        toast.error('Falha ao conectar com o Supabase');
      } finally {
        setIsProcessing(false);
      }
    }
    
    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
        <img 
          src="https://supabase.com/dashboard/img/supabase-logo.svg" 
          alt="Supabase Logo"
          className="h-12 mx-auto mb-6" 
        />

        {isProcessing ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-700">Processando autenticação...</p>
            <p className="mt-2 text-sm text-gray-500">Por favor, aguarde enquanto processamos sua autenticação do Supabase.</p>
          </div>
        ) : error ? (
          <div>
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              <p className="font-medium">Erro na autenticação</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-left overflow-auto max-h-40 text-xs">
              <p className="font-mono">Informações de depuração:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
            
            <div className="mt-6 flex space-x-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 font-medium transition-colors"
              >
                Voltar para o início
              </button>
              <button
                onClick={() => {
                  // Limpar quaisquer tokens ou estados antigos
                  localStorage.removeItem('supabase_oauth_state');
                  localStorage.removeItem('supabase_oauth_code_verifier');
                  localStorage.removeItem('supabase_access_token');
                  localStorage.removeItem('supabase_refresh_token');
                  
                  // Redirecionar para a página inicial
                  navigate('/');
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white font-medium transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-green-100 text-green-700 p-4 rounded-md">
              <p className="font-medium">Autenticação concluída!</p>
              <p className="text-sm mt-1">Você será redirecionado em instantes...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 