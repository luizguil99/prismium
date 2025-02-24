import { useState, useEffect } from 'react';
import { supabaseStore } from '~/lib/stores/supabase';

interface SupabaseProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectDetails: any;
}

export function SupabaseProjectModal({ isOpen, onClose, projectDetails }: SupabaseProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-[500px] border border-zinc-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Connected to Supabase</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Project Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Name:</span>
                <span className="text-white font-medium">{projectDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reference:</span>
                <span className="text-white font-medium">{projectDetails.ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Region:</span>
                <span className="text-white font-medium">{projectDetails.region}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Connection Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Database URL:</span>
                <span className="text-white font-medium truncate ml-4">
                  {`https://${projectDetails.ref}.supabase.co`}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-zinc-400">API Key:</span>
                <span className="text-white font-medium truncate ml-4 max-w-[250px]">
                  {projectDetails.anon_key}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
