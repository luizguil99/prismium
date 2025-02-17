import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { useState, useEffect } from "react";
import { Header } from "~/admin-components/Header";
import { AdminSidebar } from "~/admin-components/AdminSidebar";
import { useAuth } from "~/components/supabase/auth-context";
import { useNavigate } from "@remix-run/react";
import { toast } from 'react-toastify';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('🔐 Admin: Verificando permissões...');
  
  const response = new Response();
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL ?? '',
    import.meta.env.SUPABASE_ANON_KEY ?? '',
    { request, response }
  );

  // Verifica autenticação de forma segura usando getUser
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ Admin: Erro de autenticação:", userError);
    return redirect("/login");
  }

  // Busca o perfil do usuário com verificação de admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("❌ Admin: Erro ao buscar perfil:", profileError);
    return redirect("/");
  }

  if (!profile.is_admin) {
    console.log("⚠️ Admin: Usuário não é administrador:", user.email);
    return redirect("/");
  }

  console.log('✅ Admin: Dados carregados com sucesso');
  
  return json({ profile });
};

export default function AdminPage() {
  const { profile } = useLoaderData<typeof loader>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Verifica autenticação no cliente
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('⚠️ Admin Client: Usuário não autenticado');
        navigate("/login");
        return;
      }

      if (!profile?.is_admin) {
        console.log('⚠️ Admin Client: Usuário não é administrador');
        toast.error('Você não tem permissão para acessar esta página');
        navigate("/");
      }
    }
  }, [user, profile, navigate, loading]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Não renderiza nada se não estiver autenticado ou não for admin
  if (!user || !profile?.is_admin) {
    return null;
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
            className="flex-shrink-0"
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