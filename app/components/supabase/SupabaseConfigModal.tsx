import { useState, useEffect } from 'react';
import { supabaseStore } from '~/lib/stores/supabase';
import { toast } from 'react-toastify';
import { createClient } from '@supabase/supabase-js';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("[Modal] Configurando listener de mensagens");
    
    const handleMessage = async (event: MessageEvent) => {
      console.log("[Modal] Mensagem recebida:", event);
      
      if (event.origin === window.location.origin) {
        try {
          console.log("[Modal] Origem da mensagem validada");
          const params = new URLSearchParams(event.data);
          const receivedState = params.get('state');
          const code = params.get('code');
          
          console.log("[Modal] Parâmetros extraídos:", { state: receivedState, code });
          
          const savedState = localStorage.getItem('supabase_oauth_state');
          console.log("[Modal] Estado salvo:", savedState);

          if (receivedState !== savedState) {
            throw new Error('Estado OAuth inválido');
          }

          if (!code) {
            throw new Error('Código de autorização não recebido');
          }

          setIsLoading(true);
          console.log("[Modal] Iniciando troca de token...");

          // Troca o código por um token de acesso
          const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: import.meta.env.VITE_SUPABASE_CLIENT_ID,
              redirect_uri: import.meta.env.VITE_SUPABASE_REDIRECT_URI,
            }).toString(),
          });

          console.log("[Modal] Resposta do token:", tokenResponse);

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("[Modal] Erro na resposta do token:", errorText);
            throw new Error('Falha ao obter token de acesso');
          }

          const { access_token } = await tokenResponse.json();
          console.log("[Modal] Token obtido com sucesso");

          // Obtém os detalhes do projeto
          const projectResponse = await fetch('https://api.supabase.com/v1/projects/current', {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });

          if (!projectResponse.ok) {
            const errorText = await projectResponse.text();
            console.error("[Modal] Erro na resposta do projeto:", errorText);
            throw new Error('Falha ao obter detalhes do projeto');
          }

          const { project_url, anon_key } = await projectResponse.json();
          console.log("[Modal] Detalhes do projeto obtidos");

          // Conecta ao Supabase
          const { success, error } = await supabaseStore.connectToSupabase(project_url, anon_key);
          
          if (!success) {
            throw error || new Error('Falha ao conectar ao Supabase');
          }

          console.log("[Modal] Conectado com sucesso!");
          toast.success('Conectado ao Supabase com sucesso!');
          onClose();

        } catch (error) {
          console.error("[Modal] Erro ao processar mensagem:", error);
          toast.error(error instanceof Error ? error.message : 'Erro ao conectar com o Supabase');
        } finally {
          setIsLoading(false);
          localStorage.removeItem('supabase_oauth_state');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  const handleSupabaseAuth = async () => {
    try {
      setIsLoading(true);
      console.log("[Modal] Iniciando autenticação OAuth");
      
      // Gera um estado para segurança
      const state = crypto.randomUUID();
      localStorage.setItem('supabase_oauth_state', state);
      console.log("[Modal] Estado gerado:", state);
      
      // Constrói a URL de autorização
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
      authUrl.searchParams.append('client_id', import.meta.env.VITE_SUPABASE_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('redirect_uri', import.meta.env.VITE_SUPABASE_REDIRECT_URI);

      console.log("[Modal] URL de autorização:", authUrl.toString());

      // Abre a janela de autorização
      const authWindow = window.open(
        authUrl.toString(),
        'Supabase Authorization',
        'width=800,height=600'
      );

      if (!authWindow) {
        throw new Error('Não foi possível abrir a janela de autorização. Por favor, permita popups para este site.');
      }

      // Monitora se a janela foi fechada
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          console.log("[Modal] Janela de autorização fechada");
          clearInterval(checkWindow);
          setIsLoading(false);
        }
      }, 500);

    } catch (error) {
      console.error("[Modal] Erro ao iniciar autorização:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar autorização do Supabase');
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (projectUrl && anonKey) {
      setIsLoading(true);
      try {
        console.log("[Modal] Tentando conexão manual");
        const { success, error } = await supabaseStore.connectToSupabase(projectUrl, anonKey);
        
        if (success) {
          console.log("[Modal] Conexão manual bem sucedida");
          toast.success('Conectado ao Supabase com sucesso!');
          onClose();
        } else {
          throw error || new Error('Falha ao conectar ao Supabase');
        }
      } catch (error) {
        console.error("[Modal] Erro na conexão manual:", error);
        toast.error('Erro ao conectar com o Supabase. Verifique suas credenciais.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-[450px] border border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Configuração do Supabase</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <button
          onClick={handleSupabaseAuth}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.97 6.27v11.46c0 1.24-1.01 2.25-2.25 2.25H4.28c-1.24 0-2.25-1.01-2.25-2.25V6.27c0-1.24 1.01-2.25 2.25-2.25h15.44c1.24 0 2.25 1.01 2.25 2.25z"/>
          </svg>
          {isLoading ? 'Conectando...' : 'Conectar com Supabase'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-900 text-zinc-400">ou configure manualmente</span>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              URL do Projeto
            </label>
            <input
              type="text"
              placeholder="https://xyz.supabase.co"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Anon Key
            </label>
            <input
              type="password"
              placeholder="sua-anon-key"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-zinc-500">
              Encontre sua anon key em Project Settings {'>'} API {'>'} Project API keys
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!projectUrl || !anonKey || isLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Configuração
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
