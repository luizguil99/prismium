import React, { useCallback } from 'react';
import { GitPullRequest, GitMerge, Menu } from 'lucide-react';
import { classNames } from '~/utils/classNames';
import { RevertDropdown } from './revertdropdown';
import { ClientOnly } from 'remix-utils/client-only';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

interface NewHeaderProps {
  className?: string;
}

export function NewHeader({ className }: NewHeaderProps) {
  // Callback que só será recriado quando necessário
  const handleRevert = useCallback((messageId: string | null) => {
    // Implementação opcional de ações adicionais ao reverter
    console.log("Version changed to:", messageId || "latest");
  }, []);

  return (
    <div className={classNames("sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-bolt-elements-borderColor bg-[#09090B]/95 backdrop-blur-sm", className)}>
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
          <Menu size={14} className="text-zinc-300" />
        </button>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10">
          <GitPullRequest size={14} className="text-blue-400" />
        </div>
        
        <ClientOnly>
          {() => <ChatDescription />}
        </ClientOnly>
        
        <span className="px-1.5 py-0.5 text-xs font-medium text-green-400 bg-green-500/10 rounded-full">Open</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-800/30 rounded-md">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>CI Passing</span>
        </div>
        <RevertDropdown onRevert={handleRevert} />
       
      </div>
    </div>
  );
}