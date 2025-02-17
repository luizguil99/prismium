import { Dialog, DialogTitle, DialogDescription } from "~/components/ui/Dialog";
import { ThemeSwitch } from "~/components/ui/ThemeSwitch";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog onClose={onClose}>
      <DialogTitle>Admin Settings</DialogTitle>
      <DialogDescription>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Dark Mode
            </span>
            <ThemeSwitch />
          </div>
          {/* Adicione mais configurações aqui */}
        </div>
      </DialogDescription>
    </Dialog>
  );
} 