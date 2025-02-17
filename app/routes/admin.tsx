import { redirect, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { useState, useEffect } from "react";
import { Header } from "~/admin-components/Header";
import { StatsCards } from "~/admin-components/StatsCards";
import { AdminTabs } from "~/admin-components/AdminTabs";
import { SettingsDialog } from "~/admin-components/SettingsDialog";
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

  // Busca estatísticas gerais
  const { data: stats, error: statsError } = await supabase
    .from("profiles")
    .select("subscription_plan, subscription_status");

  if (statsError) {
    console.error("❌ Admin: Erro ao buscar estatísticas:", statsError);
    throw json({ error: "Erro ao carregar estatísticas" }, { status: 500 });
  }

  const totalUsers = stats?.length || 0;
  const proUsers = stats?.filter(u => u.subscription_plan === 'pro').length || 0;
  const activeTrials = stats?.filter(u => u.subscription_status === 'trial').length || 0;

  console.log('✅ Admin: Dados carregados com sucesso');
  
  return json({ 
    profile,
    stats: {
      totalUsers,
      proUsers,
      activeTrials
    }
  });
};

export default function AdminPage() {
  const { profile, stats } = useLoaderData<typeof loader>();
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
      <div className="min-h-screen bg-[#09090B]">
        <Header 
          email={profile.email}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">Gerencie usuários e monitore estatísticas do sistema</p>
          </div>

          <StatsCards
            totalUsers={stats.totalUsers}
            proUsers={stats.proUsers}
            activeTrials={stats.activeTrials}
          />

          <div className="mt-8">
            <AdminTabs />
          </div>
        </main>

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
} 