import { IconButton } from "~/components/ui/IconButton";
import { ThemeSwitch } from "~/components/ui/ThemeSwitch";
import WithTooltip from "~/components/ui/Tooltip";

interface HeaderProps {
  email: string;
  onOpenSettings: () => void;
}

export function Header({ email, onOpenSettings }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            <WithTooltip tooltip="Configurações">
              <IconButton
                icon="settings"
                onClick={onOpenSettings}
              />
            </WithTooltip>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {email}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 