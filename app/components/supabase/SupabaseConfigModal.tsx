import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectUrl && anonKey) {
      setIsLoading(true);
      supabaseStore.connectToSupabase(projectUrl, anonKey);
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-bolt-elements-background-depth-2 rounded-lg p-6 w-[450px] border border-bolt-elements-borderColor shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
                <span className="i-simple-icons-supabase w-5 h-5" />
                Supabase Configuration
              </h2>
              <button
                onClick={onClose}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <span className="i-ph-x-bold w-5 h-5" />
              </button>
            </div>

            <p className="text-bolt-elements-textSecondary mb-6 text-sm">
              Configure your Supabase connection. You can find these settings in Project Settings &gt; API.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className={classNames(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                    'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                    'transition-all'
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Anon Key
                </label>
                <input
                  type="password"
                  placeholder="your-anon-key"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className={classNames(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                    'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                    'transition-all'
                  )}
                />
                <p className="mt-1 text-xs text-bolt-elements-textTertiary">
                  Find your anon key in Project Settings &gt; API &gt; Project API keys
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6 bg-transparent">
                <button
                  type="button"
                  onClick={onClose}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-md bg-transparent',
                    'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                    'transition-colors'
                  )}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !projectUrl || !anonKey}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-md bg-transparent',
                    'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                    'transition-colors flex items-center gap-2',
                    (isLoading || !projectUrl || !anonKey) ? 'opacity-70 cursor-not-allowed' : ''
                  )}
                >
                  {isLoading ? (
                    <>
                      <motion.span 
                        className="i-ph-spinner-bold w-4 h-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="i-ph-check-bold w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
