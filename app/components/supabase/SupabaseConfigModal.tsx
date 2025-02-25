import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { supabaseStore } from '~/lib/stores/supabase';
import { SupabaseProjectModal } from './SupabaseProjectModal';
import supabaseCookies from '~/lib/utils/supabase-cookies';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupabaseProjectDetails {
  id: string;
  name: string;
  ref?: string;
  anon_key?: string;
  organization?: string;
  region?: string;
  status?: string;
  database?: {
    postgres_engine?: string;
    version?: string;
  };
  createdAt?: string;
  host?: string;
}

// Estados possíveis para o modal
type ModalState = 'idle' | 'connecting' | 'success' | 'error';

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectDetails, setProjectDetails] = useState<SupabaseProjectDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const authWindowRef = useRef<Window | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const checkWindowClosedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para limpar todos os timers
  const clearAllTimers = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
      warningTimeoutIdRef.current = null;
    }
    if (checkWindowClosedIntervalRef.current) {
      clearInterval(checkWindowClosedIntervalRef.current);
      checkWindowClosedIntervalRef.current = null;
    }
  };

  // Reset de estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      // Não reseta o estado imediatamente para evitar flash visual
      // quando o modal está sendo fechado
      setTimeout(() => {
        if (!isOpen) {
          setModalState('idle');
          setTimeoutWarning(false);
          setErrorMessage(null);
        }
      }, 300);
    }
  }, [isOpen]);

  // Verifica cookies quando o modal é aberto
  useEffect(() => {
    if (!isOpen || showProjectModal) return;

    const checkCookies = async () => {
      const credentials = supabaseCookies.getSupabaseCredentials();
      console.log("[Modal] Verificando cookies:", credentials);

      // Verifica se temos credenciais válidas, independente do estado atual
      if (credentials.projectUrl && credentials.anonKey && credentials.projectRef && 
          credentials.projectName) {
        
        // Se não estiver já conectando, inicia o processo
        if (modalState !== 'connecting') {
          setModalState('connecting');
        }
        
        try {
          const result = await supabaseStore.connectToSupabase(credentials.projectUrl, credentials.anonKey);
          if (result.success) {
            console.log("[Modal] Conectado via cookies");
            clearAllTimers();
            
            setProjectDetails({
              id: credentials.projectRef,
              name: credentials.projectName,
              ref: credentials.projectRef,
              anon_key: credentials.anonKey,
              organization: credentials.orgId || undefined
            });
            setModalState('success');
            setTimeoutWarning(false);
            setShowProjectModal(true);
          } else {
            throw new Error('Falha ao conectar ao Supabase');
          }
        } catch (error) {
          console.error("[Modal] Erro ao conectar via cookies:", error);
          setModalState('error');
          setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
          // Limpa cookies inválidos
          supabaseCookies.clearAllSupabaseCookies();
        }
      }
    };

    checkCookies();
    
    // Verifica regularmente, aumentei o intervalo para 5 segundos para reduzir a carga
    const interval = setInterval(checkCookies, 5000);
    return () => clearInterval(interval);
  }, [isOpen, showProjectModal]);

  // Monitora mensagens da janela de autenticação
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log("[Modal] Recebida mensagem de outra janela:", event.data);
      
      if (event.data?.type === 'supabase_connection_success' && event.data?.projectDetails) {
        console.log("[Modal] Conexão estabelecida:", event.data);
        
        clearAllTimers();
        
        // Espera um pouco para garantir que o store foi atualizado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProjectDetails(event.data.projectDetails);
        setModalState('success');
        setTimeoutWarning(false);
        toast.success('Successfully connected to Supabase!');
        setShowProjectModal(true);
      }
    };

    window.addEventListener('message', handleMessage);

    // Define um timeout de aviso aos 30 segundos
    if (modalState === 'connecting' && !warningTimeoutIdRef.current) {
      warningTimeoutIdRef.current = setTimeout(() => {
        console.log("[Modal] Aviso de tempo prolongado");
        setTimeoutWarning(true);
      }, 30000);
      
      // Define um timeout mais longo (120 segundos)
      if (!timeoutIdRef.current) {
        timeoutIdRef.current = setTimeout(() => {
          console.log("[Modal] Timeout de conexão");
          setModalState('error');
          setErrorMessage('Connection timeout. O servidor do Supabase pode estar lento. Por favor, tente novamente.');
        }, 120000); // 2 minutos
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [modalState]);

  const handleProjectModalClose = () => {
    setShowProjectModal(false);
    setModalState('idle');
    onClose();
  };

  const handleSupabaseAuth = async () => {
    try {
      setModalState('connecting');
      setErrorMessage(null);
      setTimeoutWarning(false);
      console.log("[Modal] Iniciando autenticação OAuth");
      
      // Limpa timers anteriores
      clearAllTimers();
      
      // Gera um estado para segurança
      const state = crypto.randomUUID();
      
      // Salva o estado em um cookie
      supabaseCookies.saveOAuthState(state);
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

      // Abre em uma nova janela centralizada
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        authUrl.toString(),
        'Supabase Authentication',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Verifica se a janela foi realmente aberta
      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Guarda referência para a janela de autenticação
      authWindowRef.current = authWindow;

      // Detecta se a janela foi fechada sem completar a autenticação
      checkWindowClosedIntervalRef.current = setInterval(() => {
        if (authWindow.closed) {
          console.log("[Modal] Janela de autenticação fechada pelo usuário");
          clearInterval(checkWindowClosedIntervalRef.current!);
          checkWindowClosedIntervalRef.current = null;
          
          // Só altera o estado se ainda estivermos conectando
          if (modalState === 'connecting') {
            // Verifica uma última vez se os cookies foram salvos antes de cancelar
            const credentials = supabaseCookies.getSupabaseCredentials();
            if (!credentials.projectUrl || !credentials.anonKey) {
              setModalState('idle');
              setTimeoutWarning(false);
            }
          }
        }
      }, 1000);

    } catch (error) {
      console.error("[Modal] Erro ao iniciar autorização:", error);
      setModalState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error starting Supabase authorization');
      toast.error('Error starting Supabase authorization');
    }
  };

  const handleRetry = () => {
    setModalState('idle');
    setErrorMessage(null);
    setTimeoutWarning(false);
    clearAllTimers();
  };

  const handleCancel = () => {
    clearAllTimers();
    
    // Fecha a janela de autenticação se estiver aberta
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
      authWindowRef.current = null;
    }
    
    setModalState('idle');
    setTimeoutWarning(false);
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  if (showProjectModal && projectDetails) {
    return (
      <SupabaseProjectModal
        isOpen={showProjectModal}
        onClose={handleProjectModalClose}
        projectDetails={projectDetails}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-lg p-6 w-[450px] border border-zinc-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Supabase Configuration</h2>
          {modalState !== 'connecting' && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
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

        <div className="space-y-4">
          <p className="text-zinc-300">
            Connect your application to Supabase to start using the database.
            You will need to authorize access to manage authentication settings,
            database, functions and storage.
          </p>

          {modalState === 'error' && errorMessage && (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-3 text-red-200 text-sm">
              <div className="font-semibold mb-1">Connection error</div>
              <p>{errorMessage}</p>
            </div>
          )}

          {timeoutWarning && modalState === 'connecting' && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-3 text-yellow-200 text-sm">
              <div className="font-semibold mb-1">Taking longer than expected</div>
              <p>
                The connection to Supabase is taking longer than usual. This might be due to server load.
                You can continue waiting or cancel and try again later.
              </p>
            </div>
          )}

          <div className="pt-2">
            {modalState === 'connecting' ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin"></div>
                <p className="text-zinc-300">Connecting to Supabase...</p>
                <p className="text-zinc-500 text-sm">This process may take a moment</p>
                
                {/* Adicionando botão de cancelamento */}
                <button
                  onClick={handleCancel}
                  className="mt-4 px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {modalState === 'error' ? (
                  <button
                    onClick={handleRetry}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={handleSupabaseAuth}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="white"/>
                      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="white"/>
                    </svg>
                    Connect with Supabase
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="text-zinc-500 text-sm">
              By connecting your Supabase account, you'll be able to store data permanently
              and access Supabase features like authentication, storage, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
