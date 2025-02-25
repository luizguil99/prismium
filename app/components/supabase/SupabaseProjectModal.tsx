import { useState } from 'react';
import { toast } from 'react-toastify';
import { supabaseStore } from '~/lib/stores/supabase';
import supabaseCookies from '~/lib/utils/supabase-cookies';

interface SupabaseProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectDetails: {
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
  };
}

export function SupabaseProjectModal({ isOpen, onClose, projectDetails }: SupabaseProjectModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'usage'>('details');

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      
      // Desconecta do Supabase
      supabaseStore.disconnect();
      
      // Limpa os cookies
      supabaseCookies.clearAllSupabaseCookies();
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-[550px] border border-zinc-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#10B981"/>
              <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04076L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#10B981"/>
            </svg>
            <h2 className="text-xl font-semibold text-white">Connected to Supabase</h2>
          </div>
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
        </div>

        <div className="mb-6 border-b border-zinc-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'details'
                  ? 'text-emerald-500 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Project Details
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'usage'
                  ? 'text-emerald-500 border-b-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Usage Guide
            </button>
          </div>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-emerald-400 mb-2">Project Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Name:</span>
                  <span className="text-white font-medium">{projectDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Project ID:</span>
                  <span className="text-white font-medium font-mono text-sm">{projectDetails.id}</span>
                </div>
                {projectDetails.region && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Region:</span>
                    <span className="text-white font-medium">{projectDetails.region}</span>
                  </div>
                )}
                {projectDetails.status && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <span className={`font-medium ${
                      projectDetails.status === 'ACTIVE_HEALTHY' ? 'text-emerald-500' : 'text-yellow-500'
                    }`}>
                      {projectDetails.status === 'ACTIVE_HEALTHY' ? 'Active' : projectDetails.status}
                    </span>
                  </div>
                )}
                {projectDetails.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Created:</span>
                    <span className="text-white">
                      {new Date(projectDetails.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-emerald-400 mb-2">Connection Details</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Database URL:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm truncate">
                        {`https://${projectDetails.id}.supabase.co`}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://${projectDetails.id}.supabase.co`);
                          toast.success('URL copied to clipboard');
                        }}
                        className="text-zinc-400 hover:text-white p-1"
                        aria-label="Copy URL"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {projectDetails.anon_key && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">API Key:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm truncate max-w-[250px]">
                          {projectDetails.anon_key.slice(0, 8)}...{projectDetails.anon_key.slice(-8)}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(projectDetails.anon_key!);
                            toast.success('API key copied to clipboard');
                          }}
                          className="text-zinc-400 hover:text-white p-1"
                          aria-label="Copy API Key"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {projectDetails.host && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Database Host:</span>
                    <span className="text-white font-mono text-sm">{projectDetails.host}</span>
                  </div>
                )}
                
                {projectDetails.database?.postgres_engine && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Postgres Version:</span>
                    <span className="text-white font-mono text-sm">{projectDetails.database.postgres_engine}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-emerald-400 mb-2">How to Use Supabase</h3>
              <p className="text-zinc-300 mb-3">
                Your application is now connected to Supabase. Here's how to use it in your code:
              </p>
              
              <div className="bg-zinc-900 rounded-md p-3 font-mono text-sm text-zinc-300 mb-3">
                <pre>{`import { supabaseStore } from '~/lib/stores/supabase';

// Get the Supabase client
const supabase = supabaseStore.getClient();

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*');`}</pre>
              </div>
              
              <p className="text-zinc-300">
                The connection is already set up for you, just use the client to interact with your database.
              </p>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-emerald-400 mb-2">Available Functions</h3>
              <ul className="space-y-2 text-zinc-300">
                <li><span className="text-emerald-400">getClient()</span> - Get the Supabase client</li>
                <li><span className="text-emerald-400">getProjectMetadata()</span> - Get tables and functions</li>
                <li><span className="text-emerald-400">isSupabaseConnected()</span> - Check connection status</li>
                <li><span className="text-emerald-400">getAIContext()</span> - Get context for AI integration</li>
              </ul>
            </div>
          </div>
        )}

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
