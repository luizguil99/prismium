import { useEffect, useState } from "react";
import { getOrCreateClient } from "~/components/supabase/client";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_admin: boolean;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'expired' | 'trial';
  total_tokens_used: number;
  monthly_tokens_used: number;
  last_login_at: string | null;
  login_count: number;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getOrCreateClient();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<Profile[]>();

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminStatus(profileId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentStatus })
        .eq("id", profileId);

      if (error) throw error;
      
      // Atualiza a lista localmente
      setProfiles(profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, is_admin: !currentStatus }
          : profile
      ));
    } catch (error) {
      console.error("Error updating admin status:", error);
    }
  }

  if (loading) {
    return <div className="text-center">Loading profiles...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tokens Used
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Admin
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                  {profile.subscription_plan}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  profile.subscription_status === 'active' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' :
                  profile.subscription_status === 'trial' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100' :
                  'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
                }`}>
                  {profile.subscription_status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {profile.monthly_tokens_used.toLocaleString()} / {profile.total_tokens_used.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => toggleAdminStatus(profile.id, profile.is_admin)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.is_admin
                      ? 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {profile.is_admin ? 'Admin' : 'User'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 