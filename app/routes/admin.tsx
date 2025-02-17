import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "~/utils/supabase.server.js";
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { useState } from "react";
import { Header } from "~/admin-components/Header";
import { StatsCards } from "~/admin-components/StatsCards";
import { AdminTabs } from "~/admin-components/AdminTabs";
import { SettingsDialog } from "~/admin-components/SettingsDialog";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createServerClient(request, response);

  // Verifica autenticação de forma segura
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Erro de autenticação:", userError);
    return redirect("/login");
  }

  // Busca o perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    console.error("Erro ao verificar perfil de admin:", profileError);
    return redirect("/");
  }

  // Busca estatísticas gerais
  const { data: stats, error: statsError } = await supabase
    .from("profiles")
    .select("subscription_plan, subscription_status");

  if (statsError) {
    console.error("Erro ao buscar estatísticas:", statsError);
    throw statsError;
  }

  const totalUsers = stats?.length || 0;
  const proUsers = stats?.filter(u => u.subscription_plan === 'pro').length || 0;
  const activeTrials = stats?.filter(u => u.subscription_status === 'trial').length || 0;

  return { 
    user, 
    profile,
    stats: {
      totalUsers,
      proUsers,
      activeTrials
    }
  };
};

export default function AdminPage() {
  const { user, profile, stats } = useLoaderData<typeof loader>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header 
          email={profile.email}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StatsCards
            totalUsers={stats.totalUsers}
            proUsers={stats.proUsers}
            activeTrials={stats.activeTrials}
          />
          <AdminTabs />
        </div>

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
} 