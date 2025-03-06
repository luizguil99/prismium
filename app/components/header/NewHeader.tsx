import React from 'react';
import { GitPullRequest, GitMerge, Menu } from 'lucide-react';
import { classNames } from '~/utils/classNames';
import { RevertDropdown } from './revertdropdown';

interface NewHeaderProps {
  className?: string;
}

export function NewHeader({ className }: NewHeaderProps) {
  return (
    <div className={classNames("sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-bolt-elements-borderColor bg-[#09090B]/95 backdrop-blur-sm", className)}>
      <div className="flex items-center gap-2">
        <button className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
          <Menu size={14} className="text-zinc-300" />
        </button>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10">
          <GitPullRequest size={14} className="text-blue-400" />
        </div>
        <span className="text-sm font-medium text-zinc-300">PR (Diff with Main Branch)</span>
        <span className="px-1.5 py-0.5 text-xs font-medium text-green-400 bg-green-500/10 rounded-full">Open</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-800/30 rounded-md">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>CI Passing</span>
        </div>
        <RevertDropdown />
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors">
          <GitMerge size={14} />
          <span>Merge PR</span>
        </button>
      </div>
    </div>
  );
}