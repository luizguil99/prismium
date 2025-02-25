import { useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { GitHubModal } from './GitHubModal';
import { SupabaseConfigModal } from '../supabase/SupabaseConfigModal';

interface WorkbenchSidebarProps {
  isSyncing: boolean;
  onSyncFiles: () => void;
  onOpenComponents: () => void;
}

const SidebarButton = ({ 
  icon, 
  label, 
  onClick, 
  isActive = false,
  disabled = false,
  customIcon = null
}: { 
  icon?: string; 
  label: string; 
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  customIcon?: React.ReactNode;
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
    {customIcon ? (
      <div className="text-lg flex items-center justify-center">{customIcon}</div>
    ) : (
      <div className={`text-lg ${icon} [&_svg]:text-current [&_svg]:fill-current [&_svg]:stroke-current`} />
    )}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// Logo do Supabase como componente
const SupabaseLogo = ({ className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
    <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fillOpacity="0.2"/>
    <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04075L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
    <defs>
      <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
        <stop stopColor="#249361"/>
        <stop offset="1" stopColor="#3ECF8E"/>
      </linearGradient>
      <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="106.916" gradientUnits="userSpaceOnUse">
        <stop/>
        <stop offset="1" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

export const WorkbenchSidebar = ({
  isSyncing,
  onSyncFiles,
  onOpenComponents,
}: WorkbenchSidebarProps) => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

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
          customIcon={<SupabaseLogo />}
          label="Supabase"
          onClick={() => setIsSupabaseModalOpen(true)}
        />
      </div>

      <div className="border-t border-zinc-800">
        <SidebarButton
          icon="i-ph-github-logo-bold"
          label="GitHub"
          onClick={() => setIsGitHubModalOpen(true)}
        />
        <GitHubModal 
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
        />
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </div>
    </div>
  );
}; 