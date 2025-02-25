import React from 'react';
import { classNames } from '~/utils/classNames';

interface SupabaseProject {
  id: string;
  name: string;
  ref: string;
}

interface ProjectListProps {
  projects: SupabaseProject[];
  onCreateProject: () => void;
  onDisconnect: () => void;
}

export function ProjectList({ projects, onCreateProject, onDisconnect }: ProjectListProps) {
  return (
    <div className="space-y-4">
      <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-md">
        <p className="text-green-800 dark:text-green-400 font-medium">Connected to Supabase!</p>
        <p className="text-sm text-green-700 dark:text-green-500 mt-1">
          Your account is connected and you can manage your Supabase projects.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Your Projects</h3>
          <button
            onClick={onCreateProject}
            className={classNames(
              'px-3 py-1 text-sm font-medium rounded-md',
              'bg-emerald-600 hover:bg-emerald-700 text-white',
              'transition-colors flex items-center gap-1'
            )}
          >
            <span className="i-ph-plus-bold w-4 h-4" />
            Create Project
          </button>
        </div>
        
        {projects.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="border border-bolt-elements-borderColor rounded-md p-3 hover:bg-bolt-elements-background-depth-1 transition-colors"
              >
                <h4 className="font-medium text-bolt-elements-textPrimary">{project.name}</h4>
                <p className="text-sm text-bolt-elements-textSecondary">{project.ref}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-bolt-elements-textTertiary">No projects found</p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onDisconnect}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-md',
            'bg-red-500/10 text-red-500 hover:bg-red-500/20',
            'transition-colors'
          )}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
} 