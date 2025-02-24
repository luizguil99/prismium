import { useState, useEffect } from 'react';
import { supabaseStore } from '~/lib/stores/supabase';
import { toast } from 'react-toastify';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenResponse {
  access_token: string;
}

interface ProjectResponse {
  project_url: string;
  anon_key: string;
}

const SUPABASE_CLIENT_ID = import.meta.env.VITE_SUPABASE_CLIENT_ID;
const SUPABASE_REDIRECT_URI = import.meta.env.VITE_SUPABASE_REDIRECT_URI;

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função para gerar o code verifier PKCE
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Função para gerar o code challenge
  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleSupabaseAuth = async () => {
    try {
      setIsLoading(true);
      
      // Gera o code verifier e challenge para PKCE
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Salva o code verifier para usar depois
      localStorage.setItem('supabase_code_verifier', codeVerifier);
      
      // Gera um estado para segurança
      const state = crypto.randomUUID();
      localStorage.setItem('supabase_oauth_state', state);
      
      // Constrói a URL de autorização com PKCE
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
      authUrl.searchParams.append('client_id', SUPABASE_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('redirect_uri', SUPABASE_REDIRECT_URI);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');

      // Abre a janela de autorização
      const authWindow = window.open(
        authUrl.toString(),
        'Supabase Authorization',
        'width=800,height=600'
      );

      // Listener para receber o código de autorização
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin === window.location.origin) {
          try {
            const params = new URLSearchParams(event.data);
            const receivedState = params.get('state');
            const code = params.get('code');

            // Verifica o estado para segurança
            if (receivedState !== state) {
              throw new Error('Estado OAuth inválido');
            }

            if (!code) {
              throw new Error('Código de autorização não recebido');
            }

            // Recupera o code verifier
            const codeVerifier = localStorage.getItem('supabase_code_verifier');
            if (!codeVerifier) {
              throw new Error('Code verifier não encontrado');
            }

            // Troca o código por um token de acesso usando PKCE
            const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                code_verifier: codeVerifier,
                client_id: SUPABASE_CLIENT_ID,
                redirect_uri: SUPABASE_REDIRECT_URI,
              }).toString(),
            });

            if (!tokenResponse.ok) {
              throw new Error('Falha ao obter token de acesso');
            }

            const { access_token } = await tokenResponse.json() as TokenResponse;

            // Obtém os detalhes do projeto
            const projectResponse = await fetch('https://api.supabase.com/v1/projects/current', {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            });

            if (!projectResponse.ok) {
              throw new Error('Falha ao obter detalhes do projeto');
            }

            const { project_url, anon_key } = await projectResponse.json() as ProjectResponse;

            // Limpa os dados temporários
            localStorage.removeItem('supabase_code_verifier');
            localStorage.removeItem('supabase_oauth_state');

            // Conecta ao Supabase
            await supabaseStore.connectToSupabase(project_url, anon_key);
            authWindow?.close();
            onClose();
            toast.success('Conectado ao Supabase com sucesso!');

          } catch (error) {
            console.error('Erro ao processar autorização:', error);
            toast.error('Erro ao conectar com o Supabase');
          } finally {
            window.removeEventListener('message', handleMessage);
          }
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('Erro ao iniciar autorização:', error);
      toast.error('Erro ao iniciar autorização do Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectUrl && anonKey) {
      supabaseStore.connectToSupabase(projectUrl, anonKey);
      onClose();
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

        {/* Botão de autorização do Supabase */}
        <div className="mb-6">
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
        </div>

        <div className="relative mb-6">
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
              disabled={!projectUrl || !anonKey}
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
