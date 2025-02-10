import { workbenchStore } from '~/lib/stores/workbench';
import { supabaseStore } from '~/lib/stores/supabase';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

interface WorkbenchSidebarProps {
  isSyncing: boolean;
  onSyncFiles: () => void;
  onOpenComponents: () => void;
  onOpenSupabase: () => void;
}

const SidebarButton = ({ 
  icon, 
  label, 
  onClick, 
  isActive = false,
  disabled = false 
}: { 
  icon: string; 
  label: string; 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full px-2 py-2 flex flex-col items-center gap-1
      transition-all duration-200 bg-black
      ${isActive ? 'text-[#548BE4]' : 'text-bolt-elements-item-contentDefault hover:text-[#548BE4]'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className={`text-lg ${icon} [&_svg]:text-current [&_svg]:fill-current [&_svg]:stroke-current`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const WorkbenchSidebar = ({
  isSyncing,
  onSyncFiles,
  onOpenComponents,
  onOpenSupabase
}: WorkbenchSidebarProps) => {
  const handleGitHubPush = () => {
    const repoName = prompt('Please enter a name for your new GitHub repository:', 'bolt-generated-project');
    if (!repoName) {
      toast.error('Repository name is required');
      return;
    }

    const githubUsername = Cookies.get('githubUsername');
    const githubToken = Cookies.get('githubToken');

    if (!githubUsername || !githubToken) {
      const usernameInput = prompt('Please enter your GitHub username:');
      const tokenInput = prompt('Please enter your GitHub personal access token:');

      if (!usernameInput || !tokenInput) {
        toast.error('GitHub credentials required');
        return;
      }

      workbenchStore.pushToGitHub(repoName, usernameInput, tokenInput);
    } else {
      workbenchStore.pushToGitHub(repoName, githubUsername, githubToken);
    }
  };

  return (
    <div className="h-full w-16 bg-[#000000] border-r border-zinc-800 flex flex-col">
      <div className="flex-1 flex flex-col pt-2 bg-[#000000]">
        <SidebarButton
          icon="i-ph-puzzle-piece-bold"
          label="Components"
          onClick={onOpenComponents}
        />

        <SidebarButton
          icon="i-ph-code-bold"
          label="Download"
          onClick={() => workbenchStore.downloadZip()}
        />

        <SidebarButton
          icon={`${isSyncing ? "i-ph-spinner-bold" : "i-ph-cloud-arrow-down-bold"}`}
          label={isSyncing ? "Syncing" : "Sync"}
          onClick={onSyncFiles}
          disabled={isSyncing}
        />

        <SidebarButton
          icon="i-ph-terminal-bold"
          label="Terminal"
          onClick={() => workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get())}
        />

        <SidebarButton
          icon="i-ph-database-bold"
          label="Supabase"
          onClick={onOpenSupabase}
          isActive={supabaseStore.isConnected.get()}
        />
      </div>

      <div className="border-t border-zinc-800">
        <SidebarButton
          icon="i-ph-github-logo-bold"
          label="GitHub"
          onClick={handleGitHubPush}
        />
      </div>
    </div>
  );
}; 