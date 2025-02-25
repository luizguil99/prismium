import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupabaseProject {
  id: string;
  name: string;
  ref: string;
}

// Constantes para o fluxo OAuth
const SUPABASE_CLIENT_ID = import.meta.env.VITE_SUPABASE_CLIENT_ID as string;
// Definir URL de redirecionamento de forma segura para SSR
const SUPABASE_REDIRECT_URI = import.meta.env.VITE_SUPABASE_REDIRECT_URI || "http://localhost:5173/oauth/supabase";
const OAUTH_STATE_KEY = 'supabase_oauth_state';
const OAUTH_CODE_VERIFIER_KEY = 'supabase_oauth_code_verifier';

// Verificar se estamos no navegador
const isBrowser = typeof window !== 'undefined';

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedProjects, setConnectedProjects] = useState<SupabaseProject[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Verificar se o usuário já está conectado ao Supabase
  useEffect(() => {
    if (!isBrowser) return; // Executa apenas no navegador
    
    const checkConnection = () => {
      const token = localStorage.getItem('supabase_access_token');
      if (token) {
        setIsConnected(true);
        // Aqui você pode carregar os projetos do usuário
        fetchProjects(token);
      }
    };

    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  // Função para buscar projetos do usuário
  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const projects = await response.json() as SupabaseProject[];
        setConnectedProjects(projects);
      } else {
        console.error('Falha ao buscar projetos:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  // Função para gerar o code verifier para PKCE
  const generateCodeVerifier = () => {
    if (!isBrowser) return ''; // Adicionar proteção contra SSR
    
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  };

  // Função para gerar o code challenge a partir do code verifier
  const generateCodeChallenge = async (verifier: string) => {
    if (!isBrowser) return ''; // Adicionar proteção contra SSR
    
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Iniciar o fluxo OAuth
  const startOAuthFlow = async () => {
    if (!isBrowser) return; // Adicionar proteção contra SSR
    
    setIsConnecting(true);
    try {
      console.log('🚀 Iniciando fluxo OAuth do Supabase...');
      
      // Gerar state aleatório para segurança
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(OAUTH_STATE_KEY, state);
      console.log('🔐 State gerado e armazenado:', state);
      
      // Gerar code verifier para PKCE
      const codeVerifier = generateCodeVerifier();
      localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);
      console.log('🔑 Code verifier gerado e armazenado (primeiros 5 caracteres):', codeVerifier.substring(0, 5) + '...');
      
      // Gerar code challenge
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log('🧩 Code challenge gerado (primeiros 5 caracteres):', codeChallenge.substring(0, 5) + '...');
      
      // Construir URL de autorização
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
      authUrl.searchParams.append('client_id', SUPABASE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', SUPABASE_REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      
      console.log('🔗 URL de autorização construída:', authUrl.toString());
      console.log('🌐 Redirecionando para a página de autorização do Supabase...');
      
      // Redirecionar para a página de autorização do Supabase
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('❌ Erro ao iniciar fluxo OAuth:', error);
      toast.error('Erro ao conectar com o Supabase');
      setIsConnecting(false);
    }
  };

  // Função para desconectar do Supabase
  const disconnectSupabase = () => {
    if (!isBrowser) return; // Adicionar proteção contra SSR
    
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    setIsConnected(false);
    setConnectedProjects([]);
    toast.success('Desconectado do Supabase com sucesso');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Integração com Supabase"
      size="md"
    >
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="https://supabase.com/dashboard/img/supabase-logo.svg" 
            alt="Supabase Logo" 
            className="h-12" 
          />
        </div>

        {isConnected ? (
          <div className="space-y-6">
            <div className="bg-green-100 p-4 rounded-md">
              <p className="text-green-800 font-medium">Conectado ao Supabase!</p>
              <p className="text-sm text-green-700 mt-1">
                Sua conta está conectada e você pode gerenciar seus projetos do Supabase.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Seus Projetos</h3>
              {connectedProjects.length > 0 ? (
                <div className="space-y-2">
                  {connectedProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="border border-gray-200 rounded-md p-3 hover:bg-gray-50"
                    >
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-gray-600">{project.ref}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum projeto encontrado</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="destructive" onClick={disconnectSupabase}>
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-700">
              Conecte-se ao Supabase para gerenciar suas organizações e projetos diretamente 
              do nosso aplicativo. Isto permitirá que você crie e gerencie recursos do Supabase
              para suas aplicações.
            </p>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">O que você pode fazer:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Acessar e gerenciar seus projetos existentes</li>
                <li>Criar novos projetos</li>
                <li>Configurar autenticação e bancos de dados</li>
                <li>Gerenciar acesso e permissões</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={startOAuthFlow}
                disabled={isConnecting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isConnecting ? 'Conectando...' : 'Conectar ao Supabase'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}

// Função para ser chamada após o redirecionamento do OAuth
export async function handleOAuthCallback(code: string, state: string) {
  if (!isBrowser) {
    throw new Error('A função handleOAuthCallback só pode ser executada no navegador');
  }

  // Verificar o state para segurança
  const savedState = localStorage.getItem(OAUTH_STATE_KEY);
  if (state !== savedState) {
    throw new Error('Estado inválido');
  }

  // Recuperar o code verifier
  const codeVerifier = localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Code verifier não encontrado');
  }

  console.log('🔄 Trocando código por token através do servidor...');
  
  try {
    // Chamar o endpoint do servidor para trocar o código por token
    const response = await fetch('/api/supabase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na resposta do servidor:', errorData);
      throw new Error(`Erro ao obter token: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as OAuthResponse;
    console.log('✅ Tokens obtidos com sucesso através do servidor!');
    
    // Armazenar os tokens
    localStorage.setItem('supabase_access_token', data.access_token);
    localStorage.setItem('supabase_refresh_token', data.refresh_token);
    
    // Limpar estado e code verifier
    localStorage.removeItem(OAUTH_STATE_KEY);
    localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);

    return data;
  } catch (error) {
    console.error('❌ Erro ao trocar código por token:', error);
    throw error;
  }
}
