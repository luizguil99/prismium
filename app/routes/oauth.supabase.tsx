import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    throw new Error("Parâmetros de autenticação ausentes");
  }

  // Retorna os parâmetros para o cliente
  return { code, state };
}

export default function SupabaseCallback() {
  const { code, state } = useLoaderData<typeof loader>();

  useEffect(() => {
    // Envia a mensagem para a janela pai com os parâmetros
    if (window.opener) {
      const params = new URLSearchParams({ code, state });
      window.opener.postMessage(params.toString(), window.location.origin);
      window.close();
    }
  }, [code, state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-xl font-semibold">Autenticando com Supabase...</h1>
        <p className="text-gray-600">
          Esta janela será fechada automaticamente.
        </p>
      </div>
    </div>
  );
}
