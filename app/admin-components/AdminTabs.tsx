import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import UserManagement from "./UserManagement";

export function AdminTabs() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="flex space-x-2 mb-6 bg-white dark:bg-gray-800 p-1 rounded-lg">
        <TabsTrigger
          value="users"
          className="flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900"
        >
          Users
        </TabsTrigger>
        <TabsTrigger
          value="analytics"
          className="flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900"
        >
          Analytics
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className="flex-1 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900"
        >
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <UserManagement />
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Usage Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analytics dashboard em desenvolvimento...
          </p>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configurações do sistema em desenvolvimento...
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
} 