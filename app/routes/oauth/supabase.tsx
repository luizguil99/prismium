import { useEffect, useState } from 'react';
import { json, redirect } from '@remix-run/node';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { handleOAuthCallback } from '~/components/supabase/SupabaseConfigModal';
import { toast } from 'react-toastify';

export default function SupabaseOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function processCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
          throw new Error('Parâmetros de callback inválidos');
        }
        
        await handleOAuthCallback(code, state);
        toast.success('Conectado ao Supabase com sucesso!');
        
        // Redirecionar para a página principal após autenticação bem-sucedida
        navigate('/');
      } catch (err) {
        console.error('Erro no callback do Supabase:', err);
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
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 font-medium transition-colors"
            >
              Voltar para o início
            </button>
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