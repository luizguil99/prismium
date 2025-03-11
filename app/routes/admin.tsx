import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { createServerClient } from "~/utils/supabase.server";
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { useState } from "react";
import { Header } from "~/admin-components/Header";
import { AdminSidebar } from "~/admin-components/AdminSidebar";
import { useAuth } from "~/components/supabase/auth-context";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('🔐 Admin: Checking permissions...');
  
  const response = new Response();
  const supabase = createServerClient(request, response);

  // Verifica autenticação de forma segura
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ Admin: Erro de autenticação:", userError);
    return redirect("/login", {
      headers: response.headers
    });
  }

  // Busca o perfil do usuário com verificação de admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("❌ Admin: Erro ao buscar perfil:", profileError);
    return redirect("/", {
      headers: response.headers
    });
  }

  if (!profile.is_admin) {
    console.log("⚠️ Admin: Usuário não é administrador:", user.email);
    return redirect("/", {
      headers: response.headers
    });
  }

  console.log('✅ Admin: Acesso permitido para o administrador:', user.email);
  
  return json({ profile }, {
    headers: response.headers
  });
};

export default function AdminPage() {
  const { profile } = useLoaderData<typeof loader>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { loading } = useAuth();

  // Mostra loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[#09090B]">
        {/* Sidebar fixa */}
        <AdminSidebar />
        
        {/* Conteúdo principal com scroll */}
        <div className="flex-1 flex flex-col ml-64">
          {/* Header fixo */}
          <Header 
            email={profile.email}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Área de conteúdo com scroll */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}