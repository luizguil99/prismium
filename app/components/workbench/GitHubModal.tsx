import { useState } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { workbenchStore } from '~/lib/stores/workbench';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal = ({ isOpen, onClose }: GitHubModalProps) => {
  const [repoName, setRepoName] = useState('');
  const [username, setUsername] = useState(Cookies.get('githubUsername') || '');
  const [token, setToken] = useState(Cookies.get('githubToken') || '');
  const [isLoading, setIsLoading] = useState(false);
  const hasCredentials = !!Cookies.get('githubUsername') && !!Cookies.get('githubToken');

  const handleDisconnect = () => {
    Cookies.remove('githubUsername');
    Cookies.remove('githubToken');
    Cookies.remove('git:github.com');
    setUsername('');
    setToken('');
    toast.success('GitHub connection removed successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoName || !username || !token) {
      toast.error('All fields are required');
      return;
    }

    setIsLoading(true);

    try {
      // Save credentials if they're new
      if (!Cookies.get('githubUsername')) {
        Cookies.set('githubUsername', username);
      }
      if (!Cookies.get('githubToken')) {
        Cookies.set('githubToken', token);
      }

      await workbenchStore.pushToGitHub(repoName, username, token);
      toast.success('Successfully pushed to GitHub!');
      onClose();
    } catch (error) {
      toast.error('Failed to push to GitHub. Please check your credentials.');
    } finally {
      setIsLoading(false);
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
            className="bg-bolt-elements-background-depth-2 rounded-lg p-6 w-[400px] border border-bolt-elements-borderColor shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
                <span className="i-ph-github-logo-bold w-6 h-6" />
                Push to GitHub
              </h2>
              <div className="flex items-center gap-2">
                {hasCredentials && (
                  <button
                    onClick={handleDisconnect}
                    className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 text-sm bg-transparent"
                  >
                    <span className="i-ph-sign-out-bold w-4 h-4" />
                    Disconnect
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <span className="i-ph-x-bold w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {hasCredentials && (
                <div className="mb-4 p-2 bg-green-500/10 rounded-md border border-green-500/20">
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <span className="i-ph-check-circle-bold w-4 h-4" />
                    Connected as {username}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-project"
                  className={classNames(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                    'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                    'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                    'transition-all'
                  )}
                />
              </div>
              
              {!Cookies.get('githubUsername') && (
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className={classNames(
                      'w-full px-3 py-2 rounded-md text-sm',
                      'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                      'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                      'transition-all'
                    )}
                  />
                </div>
              )}
              
              {!Cookies.get('githubToken') && (
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-1 flex items-center justify-between">
                    <span>GitHub Token</span>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#548BE4] hover:text-[#548BE4]/80 text-sm font-medium transition-colors"
                    >
                      Get your access token
                      <span className="i-ph-arrow-right-bold ml-1 inline-block w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxx..."
                    className={classNames(
                      'w-full px-3 py-2 rounded-md text-sm',
                      'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary',
                      'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                      'transition-all'
                    )}
                  />
                </div>
              )}
              
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
                  disabled={isLoading}
                  className={classNames(
                    'px-4 py-2 text-sm font-medium rounded-md bg-transparent',
                    'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                    'transition-colors flex items-center gap-2',
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  )}
                >
                  {isLoading ? (
                    <>
                      <motion.span 
                        className="i-ph-spinner-bold w-4 h-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Pushing...
                    </>
                  ) : (
                    <>
                      <span className="i-ph-arrow-right-bold w-4 h-4" />
                      Push to GitHub
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
};
