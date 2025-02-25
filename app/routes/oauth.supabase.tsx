import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { supabaseStore } from '~/lib/stores/supabase';
import supabaseCookies from '~/lib/utils/supabase-cookies';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SupabaseProject {
  id: string;
  name: string;
  region: string;
  status: string;
  organization_id: string;
  created_at: string;
  database: {
    postgres_engine: string;
    version: string;
  };
}

interface SupabaseKey {
  name: string;
  api_key: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  organization: string;
  region: string;
  status: string;
  database: {
    postgres_engine: string;
    version: string;
  };
  createdAt: string;
  host: string;
  postgresVersion: string;
  dbVersion: string;
}

// Interface para o projeto na lista
interface ProjectItem {
  id: string;
  name: string;
  region: string;
  status: string;
  database: any;
  createdAt: string;
}

interface ActionResponse {
  success: boolean;
  error?: string;
  needsProjectSelection?: boolean;
  accessToken?: string;
  projects?: ProjectItem[];
  projectUrl?: string;
  anonKey?: string;
  secretKey?: string;
  projectDetails?: ProjectDetails;
}

// Etapas do processo de seleção de projeto
type ConnectionStep = 
  | 'initial' 
  | 'selecting_project'
  | 'fetching_keys'
  | 'connecting_client'
  | 'saving_cookies'
  | 'notifying_parent'
  | 'complete'
  | 'error';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const code = formData.get("code") as string;
  const projectId = formData.get("projectId") as string;
  const accessToken = formData.get("accessToken") as string;

  try {
    console.log("[Action] Iniciando processamento...");

    // Se tiver access token, pula a troca de código
    let finalAccessToken = accessToken;

    if (!finalAccessToken) {
      console.log("[Action] Iniciando troca de token...");
      const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.VITE_SUPABASE_CLIENT_ID!,
          client_secret: process.env.VITE_SUPABASE_CLIENT_SECRET!,
          redirect_uri: process.env.VITE_SUPABASE_REDIRECT_URI!,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[Action] Erro na resposta do token:", errorText);
        throw new Error(`Falha ao obter token de acesso: ${errorText}`);
      }

      const tokenData = await tokenResponse.json() as TokenResponse;
      finalAccessToken = tokenData.access_token;
      console.log("[Action] Token obtido com sucesso");
    }

    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${finalAccessToken}`,
      },
    });

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.error("[Action] Erro na resposta dos projetos:", errorText);
      throw new Error('Falha ao obter lista de projetos');
    }

    const projects = await projectsResponse.json() as SupabaseProject[];
    console.log("[Action] Projetos recebidos:", projects);

    if (!projects || projects.length === 0) {
      throw new Error('Nenhum projeto encontrado');
    }

    // Se não tiver projectId, retorna a lista de projetos
    if (!projectId) {
      return json<ActionResponse>({ 
        success: true,
        needsProjectSelection: true,
        accessToken: finalAccessToken,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          region: p.region,
          status: p.status,
          database: p.database,
          createdAt: p.created_at
        }))
      });
    }

    // Se tiver projectId, busca as chaves desse projeto
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    console.log("[Action] Buscando chaves do projeto:", projectId);
    const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
      headers: {
        Authorization: `Bearer ${finalAccessToken}`,
      },
    });

    if (!keysResponse.ok) {
      const errorText = await keysResponse.text();
      console.error("[Action] Erro ao obter chaves:", errorText);
      throw new Error('Falha ao obter chaves do projeto');
    }

    const keys = await keysResponse.json() as SupabaseKey[];
    const anonKey = keys.find((key) => key.name === 'anon')?.api_key;
    const secretKey = keys.find((key) => key.name === 'service_role')?.api_key;

    if (!anonKey) {
      throw new Error('Chave anon não encontrada');
    }

    const projectUrl = `https://${project.id}.supabase.co`;
    console.log("[Action] Configuração pronta:", { projectUrl });

    return json<ActionResponse>({ 
      success: true,
      needsProjectSelection: false,
      projectUrl,
      anonKey,
      secretKey,
      projectDetails: {
        name: project.name,
        id: project.id,
        organization: project.organization_id,
        region: project.region,
        status: project.status,
        database: project.database,
        createdAt: project.created_at,
        host: `db.${project.id}.supabase.co`,
        postgresVersion: project.database.postgres_engine,
        dbVersion: project.database.version
      }
    });

  } catch (error) {
    console.error("[Action] Erro:", error);
    return json<ActionResponse>({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 400 });
  }
};

interface LoaderData {
  code: string;
  state: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("[Loader] Recebendo parâmetros:", { code, state });

  if (!code || !state) {
    throw new Error("Parâmetros de autenticação ausentes");
  }

  return json<LoaderData>({ code, state });
}

export default function SupabaseCallback() {
  const { code, state } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionResponse>();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState('Iniciando autenticação...');
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('initial');
  const [success, setSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectDetails | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [accessToken, setAccessToken] = useState<string>();
  const [connectionTimeoutId, setConnectionTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Limpa o timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
    };
  }, [connectionTimeoutId]);

  useEffect(() => {
    const processOAuth = async () => {
      try {
        setConnectionStep('initial');
        setStatus('Verificando estado...');
        console.log("[Callback] Iniciando processamento com:", { code, state });
        
        // Verifica o estado OAuth
        const savedState = supabaseCookies.getCookie(supabaseCookies.COOKIE_NAMES.OAUTH_STATE);
        console.log("[Callback] Estado salvo em cookie:", savedState);
        console.log("[Callback] Estado recebido na URL:", state);

        if (!savedState || state !== savedState) {
          console.error("[Callback] Estado inválido. Esperado:", savedState, "Recebido:", state);
          throw new Error('Estado OAuth inválido');
        }

        // Limpa o cookie após validação
        supabaseCookies.clearOAuthState();

        setStatus('Trocando código por token...');
        console.log("[Callback] Iniciando troca de token...");

        fetcher.submit(
          { code },
          { method: "post" }
        );

      } catch (error) {
        console.error("[Callback] Erro:", error);
        setConnectionStep('error');
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    if (!fetcher.data && !fetcher.formData) {
      processOAuth();
    }
  }, [code, state, fetcher]);

  // Função para notificar a janela principal com garantia de entrega
  const notifyParentWindow = async (data: any) => {
    if (!window.opener) {
      console.error('[Callback] Janela principal não encontrada');
      return false;
    }

    console.log('[Callback] Enviando mensagem para janela principal:', data);
    
    // Tentativa inicial
    window.opener.postMessage(data, '*');
    
    // Tentativas adicionais com delay crescente para garantir entrega
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
      if (window.opener) {
        window.opener.postMessage(data, '*');
      } else {
        // Janela principal foi fechada
        break;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const processResponse = async () => {
      if (fetcher.data) {
        try {
          if (!fetcher.data.success) {
            setConnectionStep('error');
            throw new Error(fetcher.data.error || 'Erro desconhecido');
          }

          if (fetcher.data.needsProjectSelection && fetcher.data.projects) {
            setProjects(fetcher.data.projects as ProjectItem[]);
            setAccessToken(fetcher.data.accessToken);
            setStatus('Selecione um projeto para conectar');
            return;
          }

          if (!fetcher.data.projectUrl || !fetcher.data.anonKey || !fetcher.data.projectDetails) {
            setConnectionStep('error');
            throw new Error('Resposta incompleta do servidor');
          }

          setConnectionStep('saving_cookies');
          setStatus('Salvando configurações...');
          
          const projectUrl = fetcher.data.projectUrl;
          const anonKey = fetcher.data.anonKey;
          const secretKey = fetcher.data.secretKey;
          const projectDetails = fetcher.data.projectDetails;

          // Salva as informações em cookies
          supabaseCookies.saveSupabaseCredentials(
            projectUrl,
            anonKey,
            projectDetails.id,
            projectDetails.name,
            projectDetails.organization,
            secretKey
          );

          // Conecta ao Supabase
          setConnectionStep('connecting_client');
          setStatus('Conectando ao cliente Supabase...');
          
          const result = await supabaseStore.connectToSupabase(projectUrl, anonKey, secretKey);
          
          if (!result.success) {
            setConnectionStep('error');
            throw new Error('Falha ao conectar com o Supabase');
          }

          // Garante que a janela pai ainda está aberta
          setConnectionStep('notifying_parent');
          setStatus('Notificando aplicação principal...');
          
          const notified = await notifyParentWindow({
            type: 'supabase_connection_success',
            projectDetails: projectDetails
          });

          if (!notified) {
            console.warn('[Callback] Não foi possível notificar a janela principal');
          }

          setConnectionStep('complete');
          setStatus('Conexão estabelecida!');
          setSuccess(true);
          setProjectInfo(projectDetails);

          // Fecha a janela após 3 segundos para dar tempo à mensagem ser processada
          setTimeout(() => {
            if (window.opener) {
              // Envia uma última mensagem de confirmação
              notifyParentWindow({
                type: 'supabase_window_closing',
                projectDetails: projectDetails
              });
            }
            window.close();
          }, 3000);

        } catch (error) {
          console.error("[Callback] Erro:", error);
          setConnectionStep('error');
          setError(error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }
    };

    processResponse();
  }, [fetcher.data]);

  const handleProjectSelect = (projectId: string) => {
    // Limpa qualquer timeout existente
    if (connectionTimeoutId) {
      clearTimeout(connectionTimeoutId);
    }
    
    setSelectedProjectId(projectId);
    setConnectionStep('selecting_project');
    setStatus(`Conectando ao projeto ${projectId}...`);
    
    if (!accessToken) {
      setConnectionStep('error');
      setError('Token de acesso não disponível');
      return;
    }
    
    console.log(`[Callback] Selecionando projeto ${projectId}...`);
    
    // Define um timeout mais longo (60 segundos)
    const timeoutId = setTimeout(() => {
      console.log("[Callback] Timeout de conexão ao selecionar projeto");
      setConnectionStep('error');
      setError(`Tempo limite excedido ao se conectar ao projeto ${projectId}. O servidor Supabase pode estar lento ou o projeto pode estar indisponível.`);
    }, 60000);
    
    setConnectionTimeoutId(timeoutId);
    
    fetcher.submit(
      { projectId, accessToken },
      { method: "post" }
    );
  };

  // Função para texto de status baseado no passo atual
  const getStatusText = () => {
    switch (connectionStep) {
      case 'selecting_project':
        return `Conectando ao projeto ${selectedProjectId}...`;
      case 'fetching_keys':
        return 'Obtendo chaves de API...';
      case 'connecting_client':
        return 'Conectando ao cliente Supabase...';
      case 'saving_cookies':
        return 'Salvando configurações...';
      case 'notifying_parent':
        return 'Finalizando conexão...';
      case 'complete':
        return 'Conexão estabelecida!';
      case 'error':
        return 'Erro de conexão';
      default:
        return status;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="rounded-lg bg-zinc-800 p-8 shadow-md text-white max-w-3xl w-full">
        {error ? (
          <div className="text-red-500 mb-4">
            <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-semibold text-center">Erro na Autenticação</h1>
            <p className="text-zinc-300 text-center mt-4">{error}</p>
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors"
              >
                Voltar para o início
              </button>
            </div>
          </div>
        ) : success ? (
          <div>
            <div className="text-emerald-500 text-center">
              <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h1 className="text-xl font-semibold">Conectado com Sucesso!</h1>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="bg-zinc-900 rounded-lg p-4">
                <h2 className="text-lg font-medium mb-3">Informações do Projeto</h2>
                {projectInfo && (
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Nome:</span>
                        <span className="text-zinc-200">{projectInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Status:</span>
                        <span className={`${
                          projectInfo.status === 'ACTIVE_HEALTHY' ? 'text-emerald-500' : 'text-yellow-500'
                        }`}>
                          {projectInfo.status === 'ACTIVE_HEALTHY' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">ID:</span>
                        <span className="text-zinc-200 font-mono text-xs">{projectInfo.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Região:</span>
                        <span className="text-zinc-200">{projectInfo.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Criado em:</span>
                        <span className="text-zinc-200">
                          {new Date(projectInfo.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                      <h3 className="text-sm font-medium mb-2">Banco de Dados</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Host:</span>
                          <span className="text-zinc-200 font-mono text-xs">{projectInfo.host}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Versão Postgres:</span>
                          <span className="text-zinc-200">{projectInfo.postgresVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Versão DB:</span>
                          <span className="text-zinc-200">{projectInfo.dbVersion}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-zinc-300 mb-4">
                Você já pode fechar esta janela e voltar para a aplicação.
              </p>
              <button
                onClick={() => window.close()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white transition-colors"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        ) : projects.length > 0 ? (
          <div>
            <h1 className="text-xl font-semibold text-center mb-6">Selecione um Projeto</h1>
            
            {connectionStep === 'selecting_project' && (
              <div className="bg-emerald-900/30 border border-emerald-700 rounded-md p-3 mb-4 text-emerald-200 text-sm">
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{getStatusText()}</span>
                </div>
                <p className="mt-2 text-xs opacity-80">
                  Esse processo pode levar até 60 segundos dependendo da resposta do servidor Supabase.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  disabled={selectedProjectId === project.id || connectionStep === 'selecting_project'}
                  className={`p-4 rounded-lg border ${
                    selectedProjectId === project.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
                  } transition-colors text-left ${
                    connectionStep === 'selecting_project' && selectedProjectId !== project.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-zinc-400">
                        Região: {project.region} • Criado em: {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-sm ${
                      project.status === 'ACTIVE_HEALTHY' ? 'text-emerald-500' : 'text-yellow-500'
                    }`}>
                      {project.status === 'ACTIVE_HEALTHY' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg 
                className="animate-spin w-8 h-8" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Autenticando com Supabase</h1>
            <p className="text-zinc-400 text-center">{getStatusText()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
