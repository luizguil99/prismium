import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { ErrorMessage } from './ErrorMessage';
import { DatabaseManager } from './DatabaseManager';
import type { SupabaseProject } from './types';

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
}

interface ProjectDetail {
  id: string;
  name: string;
  ref: string;
  status: string;
  region: string;
  db_host?: string;
  api_url?: string;
  db_url?: string;
  anon_key?: string;
  service_key?: string;
  created_at: string;
  organization_id: string;
}

interface ApiKeysResponse {
  anon_key: string;
  service_role_key: string;
}

type ViewMode = 'details' | 'database';

export function ProjectDetails({ projectId, onBack }: ProjectDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{anon: string, service: string} | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [projectRef, setProjectRef] = useState<string>('');

  useEffect(() => {
    // Primeiro vamos buscar o 'ref' do projeto, porque precisamos dele para as chamadas da API
    const fetchProjectRef = async () => {
      try {
        // Aqui estamos assumindo que a lista de projetos está armazenada no localStorage
        // ou podemos fazer uma chamada para obter todos os projetos e filtrar pelo ID
        const projectsJson = localStorage.getItem('supabase_projects');
        if (projectsJson) {
          const projects = JSON.parse(projectsJson);
          const project = projects.find((p: any) => p.id === projectId);
          if (project && project.ref) {
            setProjectRef(project.ref);
            return project.ref;
          }
        }
        
        // Se não encontramos o 'ref' localmente, vamos assumir que o projectId passado
        // já é a referência (para compatibilidade com o código existente)
        return projectId;
      } catch (err) {
        console.error('❌ Erro ao obter referência do projeto:', err);
        // Se falhar, usamos o projectId como fallback (pode ser que já seja o ref)
        return projectId;
      }
    };

    const initializeProjectDetails = async () => {
      const ref = await fetchProjectRef();
      fetchProjectDetails(ref);
    };

    initializeProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async (ref: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('supabase_access_token');
      if (!token) {
        throw new Error('Não autenticado');
      }
      
      console.log('🔍 Buscando detalhes para o projeto ref:', ref);
      
      // Buscar detalhes do projeto via API proxy do servidor
      // Atualizando para a convenção correta de rotas do Remix
      const response = await fetch(`/api/supabase-project-details?projectRef=${ref}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg;
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.message || response.statusText;
        } catch {
          errorMsg = errorText || `Erro ${response.status}`;
        }
        throw new Error(`Erro ao buscar detalhes do projeto: ${errorMsg}`);
      }
      
      const data = await response.json();
      setProjectDetails(data as ProjectDetail);
      
      // Buscar as chaves de API em uma chamada separada
      fetchApiKeys(token, ref);
      
    } catch (err) {
      console.error('❌ Erro ao carregar detalhes do projeto:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchApiKeys = async (token: string, ref: string) => {
    try {
      // Atualizando para a convenção correta de rotas do Remix
      const response = await fetch(`/api/supabase-project-api-keys?projectRef=${ref}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supabase-Auth': token,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar chaves de API: ${response.status}`);
      }
      
      const keysData = await response.json() as ApiKeysResponse;
      setApiKeys({
        anon: keysData.anon_key || '',
        service: keysData.service_role_key || ''
      });
    } catch (err) {
      console.error('❌ Erro ao carregar chaves de API:', err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copiado para a área de transferência`))
      .catch(() => toast.error('Falha ao copiar para a área de transferência'));
  };

  // Resolver o erro de comparação de tipo viewMode
  const isDatabaseView = viewMode === 'database';
  if (isDatabaseView) {
    // Passamos o ref em vez do id para o DatabaseManager
    return <DatabaseManager projectId={projectRef || projectId} onBack={() => setViewMode('details')} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <motion.div
          className="i-ph-spinner-bold w-8 h-8 text-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-2 text-bolt-elements-textSecondary">Carregando detalhes do projeto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message="Erro ao carregar projeto" details={error} />
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            Voltar para projetos
          </button>
        </div>
      </div>
    );
  }

  if (!projectDetails) {
    return (
      <div className="space-y-4">
        <ErrorMessage message="Projeto não encontrado" />
        <div className="flex justify-center">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            Voltar para projetos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botão de voltar */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onBack}
          className="p-1 rounded-md text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-1 transition-colors"
        >
          <span className="i-ph-arrow-left-bold w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary">{projectDetails.name}</h3>
        <span className={classNames(
          "text-xs px-2 py-0.5 rounded-full",
          projectDetails.status === 'active' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
        )}>
          {projectDetails.status === 'active' ? 'Active' : projectDetails.status}
        </span>
      </div>

      {/* Tabs de navegação */}
      <div className="border-b border-bolt-elements-borderColor">
        <nav className="flex space-x-4">
          <button
            onClick={() => setViewMode('details')}
            className={classNames(
              'py-2 px-1 text-sm font-medium border-b-2 -mb-px',
              viewMode === 'details'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:border-bolt-elements-borderColor'
            )}
          >
            Detalhes do Projeto
          </button>
          <button
            onClick={() => setViewMode('database')}
            className={classNames(
              'py-2 px-1 text-sm font-medium border-b-2 -mb-px',
              isDatabaseView
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:border-bolt-elements-borderColor'
            )}
          >
            Banco de Dados
          </button>
        </nav>
      </div>

      {/* Informações do projeto */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard 
            title="Project Reference" 
            value={projectDetails.ref}
            icon="i-ph-hash-bold" 
          />
          
          <InfoCard 
            title="Region" 
            value={projectDetails.region || 'N/A'}
            icon="i-ph-globe-bold" 
          />
          
          {projectDetails.created_at && (
            <InfoCard 
              title="Created At" 
              value={new Date(projectDetails.created_at).toLocaleDateString()}
              icon="i-ph-calendar-bold" 
            />
          )}
          
          {projectDetails.db_host && (
            <InfoCard 
              title="Database Host" 
              value={projectDetails.db_host}
              icon="i-ph-database-bold" 
              canCopy
              onCopy={() => copyToClipboard(projectDetails.db_host || '', 'Database Host')}
            />
          )}
        </div>

        {/* URLs e Endpoints */}
        <div className="pt-2">
          <h4 className="text-sm font-medium text-bolt-elements-textSecondary mb-2">Endpoints</h4>
          <div className="space-y-2">
            {projectDetails.api_url && (
              <EndpointItem 
                label="API URL" 
                value={projectDetails.api_url}
                onCopy={() => copyToClipboard(projectDetails.api_url || '', 'API URL')}
              />
            )}
            
            {projectDetails.db_url && (
              <EndpointItem 
                label="Database URL" 
                value={projectDetails.db_url}
                onCopy={() => copyToClipboard(projectDetails.db_url || '', 'Database URL')}
              />
            )}
          </div>
        </div>

        {/* API Keys */}
        {apiKeys && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-bolt-elements-textSecondary">API Keys</h4>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
              >
                {showKeys ? 'Ocultar' : 'Mostrar'} chaves
              </button>
            </div>
            
            <div className="space-y-2">
              <EndpointItem 
                label="Anon Key" 
                value={showKeys ? apiKeys.anon : '••••••••••••••••••••••'}
                onCopy={() => copyToClipboard(apiKeys.anon, 'Anon Key')}
              />
              
              <EndpointItem 
                label="Service Role Key" 
                value={showKeys ? apiKeys.service : '••••••••••••••••••••••'}
                onCopy={() => copyToClipboard(apiKeys.service, 'Service Role Key')}
              />
            </div>
          </div>
        )}

        {/* Botão para abrir gerenciador de banco de dados */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => setViewMode('database')}
            className="px-4 py-2 text-sm font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2"
          >
            <span className="i-ph-database-bold w-4 h-4" />
            Gerenciar Banco de Dados
          </button>
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  icon: string;
  canCopy?: boolean;
  onCopy?: () => void;
}

function InfoCard({ title, value, icon, canCopy, onCopy }: InfoCardProps) {
  return (
    <div className="bg-bolt-elements-background-depth-1 rounded-md p-3 flex items-start justify-between">
      <div className="flex items-center space-x-2">
        <span className={classNames(icon, "w-4 h-4 text-bolt-elements-textTertiary")} />
        <div>
          <p className="text-xs text-bolt-elements-textTertiary">{title}</p>
          <p className="text-sm text-bolt-elements-textPrimary font-medium">{value}</p>
        </div>
      </div>
      
      {canCopy && onCopy && (
        <button
          onClick={onCopy}
          className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
        >
          <span className="i-ph-copy-simple-bold w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface EndpointItemProps {
  label: string;
  value: string;
  onCopy: () => void;
}

function EndpointItem({ label, value, onCopy }: EndpointItemProps) {
  return (
    <div className="flex items-center space-x-2 bg-bolt-elements-background-depth-1 rounded-md px-3 py-2 group">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-bolt-elements-textTertiary">{label}</p>
        <p className="text-sm text-bolt-elements-textPrimary font-mono truncate">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors p-1"
      >
        <span className="i-ph-copy-bold w-4 h-4" />
      </button>
    </div>
  );
} 