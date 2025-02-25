import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabaseStore } from '~/lib/stores/supabase';
import { SupabaseProjectModal } from './SupabaseProjectModal';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  // Verifica cookies a cada 500ms
  useEffect(() => {
    if (!isOpen || showProjectModal) return;

    const checkCookies = async () => {
      const projectUrl = getCookie('supabase_project_url');
      const anonKey = getCookie('supabase_anon_key');
      const projectRef = getCookie('supabase_project_ref');
      const projectName = getCookie('supabase_project_name');

      if (projectUrl && anonKey && projectRef && projectName && !isLoading) {
        setIsLoading(true);
        try {
          const result = await supabaseStore.connectToSupabase(projectUrl, anonKey);
          if (result.success) {
            console.log("[Modal] Conectado via cookies");
            setProjectDetails({
              name: projectName,
              ref: projectRef,
              anon_key: anonKey
            });
            setShowProjectModal(true);
          }
        } catch (error) {
          console.error("[Modal] Erro ao conectar via cookies:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const interval = setInterval(checkCookies, 500);
    return () => clearInterval(interval);
  }, [isOpen, showProjectModal, isLoading]);

  // Monitora mensagens da janela de autenticação
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'supabase_connection_success') {
        console.log("[Modal] Conexão estabelecida:", event.data);
        
        if (timeoutId) clearTimeout(timeoutId);
        
        // Espera um pouco para garantir que o store foi atualizado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
        setProjectDetails(event.data.projectDetails);
        toast.success('Successfully connected to Supabase!');
        setShowProjectModal(true);
      }
    };

    window.addEventListener('message', handleMessage);

    timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("[Modal] Timeout de conexão");
        setIsLoading(false);
        toast('Connection Success');
      }
    }, 20000);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const handleProjectModalClose = () => {
    setShowProjectModal(false);
    onClose();
  };

  const handleSupabaseAuth = async () => {
    try {
      setIsLoading(true);
      console.log("[Modal] Iniciando autenticação OAuth");
      
      // Gera um estado para segurança
      const state = crypto.randomUUID();
      
      // Salva o estado em um cookie que expira em 5 minutos
      document.cookie = `supabase_oauth_state=${state}; max-age=300; path=/; SameSite=Lax`;
      console.log("[Modal] Estado gerado e salvo em cookie:", state);
      
      // Lista de todos os escopos necessários
      const scopes = [
        'auth',         // Configurações de auth e SSO
        'postgres',     // Configurações do Postgres
        'domains',      // Domínios customizados
        'functions',    // Edge functions
        'branches',     // Ambientes/branches
        'organization', // Organização e membros
        'metadata',     // Metadata e configurações de rede
        'rest',         // Configurações PostgREST
        'secrets',      // API keys e secrets
        'storage'       // Storage buckets e arquivos
      ].join(' ');
      
      // Constrói a URL de autorização
      const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
      authUrl.searchParams.append('client_id', import.meta.env.VITE_SUPABASE_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', scopes);
      authUrl.searchParams.append('redirect_uri', import.meta.env.VITE_SUPABASE_REDIRECT_URI);

      console.log("[Modal] URL de autorização:", authUrl.toString());

      // Abre em uma nova janela
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl.toString(),
        'Autenticação Supabase',
        `width=${width},height=${height},left=${left},top=${top}`
      );

    } catch (error) {
      console.error("[Modal] Erro ao iniciar autorização:", error);
      toast.error('Error starting Supabase authorization');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (showProjectModal) {
    return (
      <SupabaseProjectModal
        isOpen={showProjectModal}
        onClose={handleProjectModalClose}
        projectDetails={projectDetails}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-[450px] border border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Supabase Configuration</h2>
          {!isLoading && (
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
          )}
        </div>

        <p className="text-zinc-300 mb-6">
          Connect your application to Supabase to start using the database.
          You will need to authorize access to manage authentication settings,
          database, functions and storage.
        </p>

        <button
          onClick={handleSupabaseAuth}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            {isLoading ? (
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            ) : (
              <path
                fill="currentColor"
                d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
              />
            )}
          </svg>
          {isLoading ? 'Connecting...' : 'Connect with Supabase'}
        </button>
      </div>
    </div>
  );
}
