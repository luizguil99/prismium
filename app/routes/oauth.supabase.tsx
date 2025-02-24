import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { supabaseStore } from '~/lib/stores/supabase';

interface TokenResponse {
  access_token: string;
}

interface ProjectResponse {
  project_url: string;
  anon_key: string;
}

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

      const { access_token } = await tokenResponse.json();
      finalAccessToken = access_token;
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

    const projects = await projectsResponse.json();
    console.log("[Action] Projetos recebidos:", projects);

    if (!projects || !projects.length) {
      throw new Error('Nenhum projeto encontrado');
    }

    // Se não tiver projectId, retorna a lista de projetos
    if (!projectId) {
      return json({ 
        success: true,
        needsProjectSelection: true,
        accessToken: finalAccessToken,
        projects: projects.map((p: any) => ({
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
    const project = projects.find((p: any) => p.id === projectId);
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

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

    const keys = await keysResponse.json();
    const anonKey = keys.find((key: any) => key.name === 'anon')?.api_key;

    if (!anonKey) {
      throw new Error('Chave anon não encontrada');
    }

    const projectUrl = `https://${project.id}.supabase.co`;
    console.log("[Action] Configuração pronta:", { projectUrl });

    return json({ 
      success: true,
      needsProjectSelection: false,
      projectUrl,
      anonKey,
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
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 400 });
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  console.log("[Loader] Recebendo parâmetros:", { code, state });

  if (!code || !state) {
    throw new Error("Parâmetros de autenticação ausentes");
  }

  return { code, state };
}

export default function SupabaseCallback() {
  const { code, state } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState('Iniciando autenticação...');
  const [success, setSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [accessToken, setAccessToken] = useState<string>();

  useEffect(() => {
    const processOAuth = async () => {
      try {
        setStatus('Verificando estado...');
        console.log("[Callback] Iniciando processamento com:", { code, state });
        
        const savedState = localStorage.getItem('supabase_oauth_state');
        console.log("[Callback] Estado salvo:", savedState);
        console.log("[Callback] Estado recebido:", state);

        if (state !== savedState) {
          throw new Error('Estado OAuth inválido');
        }

        setStatus('Trocando código por token...');
        console.log("[Callback] Iniciando troca de token...");

        fetcher.submit(
          { code },
          { method: "post" }
        );

      } catch (error) {
        console.error("[Callback] Erro:", error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    };

    if (!fetcher.data && !fetcher.formData) {
      processOAuth();
    }
  }, [code, state, fetcher]);

  useEffect(() => {
    const processResponse = async () => {
      if (fetcher.data) {
        try {
          if (!fetcher.data.success) {
            throw new Error(fetcher.data.error);
          }

          if (fetcher.data.needsProjectSelection) {
            setProjects(fetcher.data.projects);
            setAccessToken(fetcher.data.accessToken);
            setStatus('Selecione um projeto para conectar');
            return;
          }

          const { projectUrl, anonKey, projectDetails } = fetcher.data;
          if (!projectUrl || !anonKey) {
            throw new Error('Dados do projeto incompletos');
          }

          setStatus('Conectando ao Supabase...');
          console.log("[Callback] Tentando conectar com:", {
            url: projectUrl,
            hasKey: !!anonKey
          });

          const { success, error: connectError } = await supabaseStore.connectToSupabase(projectUrl, anonKey);
          
          if (!success) {
            throw connectError || new Error('Falha ao conectar ao Supabase');
          }

          console.log("[Callback] Conectado com sucesso!");
          setStatus('Conexão estabelecida!');
          setSuccess(true);
          setProjectInfo(projectDetails);
          localStorage.removeItem('supabase_oauth_state');

        } catch (error) {
          console.error("[Callback] Erro:", error);
          setError(error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }
    };

    processResponse();
  }, [fetcher.data]);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setStatus('Conectando ao projeto...');
    fetcher.submit(
      { projectId, accessToken },
      { method: "post" }
    );
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
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  disabled={selectedProjectId === project.id}
                  className={`p-4 rounded-lg border ${
                    selectedProjectId === project.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
                  } transition-colors text-left`}
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
            <p className="text-zinc-400 text-center">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
