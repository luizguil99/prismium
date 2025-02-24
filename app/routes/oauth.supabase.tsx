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

  console.log("[Action] Iniciando troca de token...");

  try {
    // Troca o código por um token de acesso
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

    const { access_token } = await tokenResponse.json() as TokenResponse;
    console.log("[Action] Token obtido com sucesso");

    // Primeiro obtém a lista de projetos
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!projectsResponse.ok) {
      const projectError = await projectsResponse.text();
      throw new Error(`Falha ao obter lista de projetos: ${projectError}`);
    }

    const projects = await projectsResponse.json();
    console.log("[Action] Projetos recebidos:", JSON.stringify(projects, null, 2));

    if (!projects || !projects.length) {
      throw new Error('Nenhum projeto encontrado');
    }

    // Pega o primeiro projeto
    const project = projects[0];
    console.log("[Action] Projeto selecionado:", JSON.stringify(project, null, 2));

    // Agora obtém os detalhes do projeto específico
    const projectDetailsResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!projectDetailsResponse.ok) {
      const detailsError = await projectDetailsResponse.text();
      throw new Error(`Falha ao obter chaves do projeto: ${detailsError}`);
    }

    const apiKeys = await projectDetailsResponse.json();
    console.log("[Action] Chaves do projeto:", JSON.stringify(apiKeys, null, 2));

    // Procura a anon key
    const anonKey = apiKeys.find((key: any) => key.name === 'anon')?.api_key;
    
    if (!project.id || !anonKey) {
      console.error("[Action] Dados ausentes:", {
        temId: !!project.id,
        temAnonKey: !!anonKey,
        project,
        apiKeys
      });
      throw new Error('Dados do projeto incompletos');
    }

    const projectDetails = {
      project_url: `https://${project.id}.supabase.co`,
      anon_key: anonKey,
    };

    console.log("[Action] Detalhes do projeto montados:", {
      url: projectDetails.project_url,
      hasKey: !!projectDetails.anon_key
    });

    return json({ success: true, ...projectDetails });
  } catch (error) {
    console.error("[Action] Erro:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 400 });
  }
}

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

  useEffect(() => {
    const processOAuth = async () => {
      try {
        setStatus('Verificando estado...');
        const savedState = localStorage.getItem('supabase_oauth_state');
        console.log("[Callback] Estado salvo:", savedState);
        console.log("[Callback] Estado recebido:", state);

        if (state !== savedState) {
          throw new Error('Estado OAuth inválido');
        }

        setStatus('Trocando código por token...');
        console.log("[Callback] Iniciando troca de token...");

        // Usa o fetcher para chamar a action
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

  // Processa a resposta da action
  useEffect(() => {
    const processResponse = async () => {
      if (fetcher.data) {
        try {
          if (!fetcher.data.success) {
            throw new Error(fetcher.data.error);
          }

          const { project_url, anon_key } = fetcher.data;
          if (!project_url || !anon_key) {
            throw new Error('Dados do projeto incompletos');
          }

          setStatus('Conectando ao Supabase...');
          console.log("[Callback] Tentando conectar com:", {
            url: project_url,
            hasKey: !!anon_key
          });

          // Conecta ao Supabase
          const { success, error } = await supabaseStore.connectToSupabase(project_url, anon_key);
          
          if (!success) {
            throw error || new Error('Falha ao conectar ao Supabase');
          }

          console.log("[Callback] Conectado com sucesso!");
          setStatus('Conexão estabelecida! Fechando...');

          // Limpa o estado
          localStorage.removeItem('supabase_oauth_state');

          // Fecha a janela após um breve delay
          setTimeout(() => {
            window.close();
          }, 1500);

        } catch (error) {
          console.error("[Callback] Erro ao processar resposta:", error);
          setError(error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }
    };

    processResponse();
  }, [fetcher.data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <div className="rounded-lg bg-zinc-800 p-8 shadow-md text-white max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-semibold text-center">Erro na Autenticação</h1>
          </div>
          <p className="text-zinc-300 text-center mb-6">{error}</p>
          <p className="text-sm text-zinc-400 text-center">
            Você pode fechar esta janela e tentar novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="rounded-lg bg-zinc-800 p-8 shadow-md text-white">
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
          <p className="text-sm text-zinc-500 mt-4">
            Esta janela será fechada automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
