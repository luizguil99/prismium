import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabaseStore } from '~/lib/stores/supabase';

interface SupabaseProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectDetails: any;
}

function clearSupabaseCookies() {
  const cookies = [
    'supabase_project_url',
    'supabase_anon_key',
    'supabase_project_ref',
    'supabase_project_name',
    'supabase_org_id'
  ];

  cookies.forEach(name => {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
  });
}

export function SupabaseProjectModal({ isOpen, onClose, projectDetails }: SupabaseProjectModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      
      // Desconecta do Supabase
      supabaseStore.disconnect();
      
      // Limpa os cookies
      clearSupabaseCookies();
      
      toast.success('Successfully disconnected from Supabase');
      onClose();
    } catch (error) {
      console.error("[ProjectModal] Erro ao desconectar:", error);
      toast.error('Error disconnecting from Supabase');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-[500px] border border-zinc-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Connected to Supabase</h2>
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

        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Project Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Name:</span>
                <span className="text-white font-medium">{projectDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference:</span>
                <span className="text-white font-medium">{projectDetails.ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Region:</span>
                <span className="text-white font-medium">{projectDetails.region}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Connection Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Database URL:</span>
                <span className="text-white font-medium truncate ml-4">
                  {`https://${projectDetails.ref}.supabase.co`}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">API Key:</span>
                <span className="text-white font-medium truncate ml-4 max-w-[250px]">
                  {projectDetails.anon_key}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDisconnecting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Disconnect</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
