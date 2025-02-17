interface StatsCardsProps {
  totalUsers: number;
  proUsers: number;
  activeTrials: number;
}

export function StatsCards({ totalUsers, proUsers, activeTrials }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
        <p className="mt-2 text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
          {totalUsers}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pro Users</h3>
        <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
          {proUsers}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Trials</h3>
        <p className="mt-2 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">
          {activeTrials}
        </p>
      </div>
    </div>
  );
} 