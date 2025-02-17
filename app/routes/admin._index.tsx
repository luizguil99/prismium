import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { StatsCards } from "~/admin-components/StatsCards";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL ?? '',
    import.meta.env.SUPABASE_ANON_KEY ?? '',
    { request, response }
  );

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

  return json({
    stats: {
      totalUsers,
      proUsers,
      activeTrials
    }
  });
};

export default function AdminIndexPage() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-2">Monitore as estatísticas do sistema</p>
      </div>

      <StatsCards
        totalUsers={stats.totalUsers}
        proUsers={stats.proUsers}
        activeTrials={stats.activeTrials}
      />
    </div>
  );
} 