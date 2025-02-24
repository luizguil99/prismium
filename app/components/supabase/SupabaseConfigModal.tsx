import { useState } from 'react';
import { toast } from 'react-toastify';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [isLoading, setIsLoading] = useState(false);

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

      onClose();

    } catch (error) {
      console.error("[Modal] Erro ao iniciar autorização:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar autorização do Supabase');
      setIsLoading(false);
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

        <p className="text-zinc-300 mb-6">
          Conecte sua aplicação ao Supabase para começar a usar o banco de dados. 
          Você precisará autorizar acesso para gerenciar configurações de autenticação, 
          banco de dados, funções e armazenamento.
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
          {isLoading ? 'Conectando...' : 'Conectar com Supabase'}
        </button>
      </div>
    </div>
  );
}
