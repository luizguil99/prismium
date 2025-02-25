import { useState, useEffect } from 'react';
import { supabaseStore } from '~/lib/stores/supabase';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { toast } from 'react-toastify';
import supabaseCookies from '~/lib/utils/supabase-cookies';

interface SupabaseManagerProps {
  children?: React.ReactNode;
}

export function SupabaseManager({ children }: SupabaseManagerProps) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Verifica estado de conexão do Supabase
  useEffect(() => {
    const checkConnection = () => {
      const connected = supabaseStore.isSupabaseConnected();
      setIsConnected(connected);
    };

    // Verificação inicial
    checkConnection();
    setIsInitialized(true);

    // Subscreve para mudanças no estado de conexão
    const unsubscribe = supabaseStore.isConnected.subscribe((connected) => {
      setIsConnected(connected);
      if (connected) {
        setIsConnecting(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Tenta conectar via cookies quando carrega o componente
  useEffect(() => {
    const connectFromCookies = async () => {
      try {
        if (isConnecting) return; // Evita tentativas simultâneas
        
        setIsConnecting(true);
        const credentials = supabaseCookies.getSupabaseCredentials();

        if (credentials.projectUrl && credentials.anonKey && !isConnected) {
          console.log("[SupabaseManager] Tentando conectar via cookies...");
          
          // Incrementa contador de tentativas
          setConnectionAttempts(prev => prev + 1);
          
          const result = await supabaseStore.connectToSupabase(credentials.projectUrl, credentials.anonKey);
          
          if (result.success) {
            console.log("[SupabaseManager] Conectado via cookies");
            toast.success('Connected to Supabase database');
            // Reseta contador de tentativas
            setConnectionAttempts(0);
          } else {
            console.warn("[SupabaseManager] Falha ao conectar via cookies:", result.error);
            
            // Se houve muitas tentativas, limpa os cookies
            if (connectionAttempts >= 2) {
              console.error("[SupabaseManager] Muitas tentativas falhadas, limpando cookies");
              supabaseCookies.clearAllSupabaseCookies();
              setConnectionAttempts(0);
              toast.error('Failed to connect to Supabase. Please reconnect.');
            }
          }
        }
        
        setIsConnecting(false);
      } catch (error) {
        console.error("[SupabaseManager] Erro ao conectar via cookies:", error);
        supabaseCookies.clearAllSupabaseCookies();
        setIsConnecting(false);
        setConnectionAttempts(0);
      }
    };

    if (isInitialized && !isConnected) {
      connectFromCookies();
      
      // Configura verificação periódica para tentar reconectar
      const interval = setInterval(() => {
        if (!isConnected && !isConnecting) {
          connectFromCookies();
        }
      }, 10000); // A cada 10 segundos
      
      return () => clearInterval(interval);
    }
  }, [isInitialized, isConnected, isConnecting, connectionAttempts]);

  // Ouve mensagens da janela OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("[SupabaseManager] Recebida mensagem:", event.data);
      
      if (event.data?.type === 'supabase_connection_success') {
        // Força a reconexão
        console.log("[SupabaseManager] Recebida confirmação de conexão, reconectando...");
        const credentials = supabaseCookies.getSupabaseCredentials();
        if (credentials.projectUrl && credentials.anonKey) {
          supabaseStore.connectToSupabase(credentials.projectUrl, credentials.anonKey)
            .then(result => {
              if (result.success) {
                console.log("[SupabaseManager] Reconectado com sucesso após evento");
              }
            })
            .catch(err => console.error("[SupabaseManager] Erro ao reconectar:", err));
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Botão de conexão com o Supabase
  const SupabaseConnectButton = () => {
    if (isConnected) {
      return (
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md transition-colors"
          title="Supabase Connected"
        >
          <svg width="16" height="16" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#10B981"/>
            <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#10B981"/>
          </svg>
          <span>Connected</span>
        </button>
      );
    }

    // Estado conectando
    if (isConnecting) {
      return (
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 text-zinc-400 rounded-md cursor-not-allowed"
          title="Connecting to Supabase..."
        >
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Connecting...</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsConfigModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
        title="Connect to Supabase"
      >
        <svg width="16" height="16" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#71717A"/>
          <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#71717A"/>
        </svg>
        <span>Connect Database</span>
      </button>
    );
  };

  const handleModalClose = () => {
    setIsConfigModalOpen(false);
    
    // Verifica se houve conexão após fechar o modal
    setTimeout(() => {
      const credentials = supabaseCookies.getSupabaseCredentials();
      if (credentials.projectUrl && credentials.anonKey && !isConnected) {
        console.log("[SupabaseManager] Verificando conexão após fechar modal");
        supabaseStore.connectToSupabase(credentials.projectUrl, credentials.anonKey)
          .then(result => {
            if (result.success) {
              console.log("[SupabaseManager] Conectado após fechar modal");
            }
          })
          .catch(err => console.error("[SupabaseManager] Erro ao conectar após fechar modal:", err));
      }
    }, 500);
  };

  return (
    <>
      {children}
      
      <SupabaseConfigModal 
        isOpen={isConfigModalOpen}
        onClose={handleModalClose}
      />
      
      {/* Componente exportado */}
      <SupabaseManager.Button />
    </>
  );
}

// Subcomponentes nomeados para uso externo
SupabaseManager.Button = function SupabaseButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Subscreve para mudanças no estado de conexão
  useEffect(() => {
    const checkConnection = () => {
      const connected = supabaseStore.isSupabaseConnected();
      setIsConnected(connected);
    };

    // Verificação inicial
    checkConnection();

    // Subscreve para mudanças no estado de conexão
    const unsubscribe = supabaseStore.isConnected.subscribe((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isConnected) {
    return (
      <button
        onClick={() => setIsConfigModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md transition-colors"
        title="Supabase Connected"
      >
        <svg width="16" height="16" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#10B981"/>
          <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#10B981"/>
        </svg>
        <span>Connected</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsConfigModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
        title="Connect to Supabase"
      >
        <svg width="16" height="16" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#71717A"/>
          <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#71717A"/>
        </svg>
        <span>Connect Database</span>
      </button>
      
      <SupabaseConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  );
};

// Hook para verificar o estado de conexão do Supabase
export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const checkConnection = () => {
      const connected = supabaseStore.isSupabaseConnected();
      setIsConnected(connected);
    };

    // Verificação inicial
    checkConnection();

    // Subscreve para mudanças no estado de conexão
    const unsubscribe = supabaseStore.isConnected.subscribe((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    connect: (projectUrl: string, anonKey: string) => 
      supabaseStore.connectToSupabase(projectUrl, anonKey),
    disconnect: () => supabaseStore.disconnect(),
    getClient: () => supabaseStore.getClient(),
  };
} 