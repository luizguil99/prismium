import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { SupabaseLogo } from './SupabaseLogo';

interface ConnectPageProps {
  isConnecting: boolean;
  onConnect: () => void;
}

export function ConnectPage({ isConnecting, onConnect }: ConnectPageProps) {
  return (
    <div className="space-y-6">
      <p className="text-bolt-elements-textSecondary">
        Connect to Supabase to manage your organizations and projects directly 
        from our application. This will allow you to create and manage Supabase resources
        for your applications.
      </p>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary">What you can do:</h3>
        <ul className="list-disc list-inside text-sm text-bolt-elements-textSecondary space-y-1">
          <li>Access and manage your existing projects</li>
          <li>Create new projects</li>
          <li>Configure authentication and databases</li>
          <li>Manage access and permissions</li>
        </ul>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-md',
            'bg-emerald-600 hover:bg-emerald-700 text-white',
            'transition-colors flex items-center gap-2',
            isConnecting ? 'opacity-70 cursor-not-allowed' : ''
          )}
        >
          {isConnecting ? (
            <>
              <motion.span 
                className="i-ph-spinner-bold w-4 h-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Connecting...
            </>
          ) : (
            <>
              <SupabaseLogo size={16} color="white" />
              Connect to Supabase
            </>
          )}
        </button>
      </div>
    </div>
  );
} 