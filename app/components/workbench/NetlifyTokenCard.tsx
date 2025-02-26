import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { netlifyConnection, updateNetlifyConnection } from '~/lib/stores/netlify';
import NetlifySvgLogo from './netlifysvglogo';

interface NetlifyTokenCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetlifyTokenCard = ({ isOpen, onClose }: NetlifyTokenCardProps) => {
  const connection = useStore(netlifyConnection);
  const [netlifyToken, setNetlifyToken] = useState('');

  // Initialize form token with current value (if exists)
  useEffect(() => {
    if (connection.token) {
      setNetlifyToken(connection.token);
    }
  }, [connection.token]);

  // Function to save Netlify token
  const saveNetlifyToken = () => {
    if (!netlifyToken.trim()) {
      toast.error('Token cannot be empty');
      return;
    }
    
    updateNetlifyConnection({
      ...connection,
      token: netlifyToken
    });
    
    toast.success('Netlify token saved successfully');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bolt-elements-background-depth-1 p-6 shadow-xl transition-all border border-bolt-elements-borderColor">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-bolt-elements-textPrimary flex items-center gap-2"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <NetlifySvgLogo width={20} height={20} />
                  </div>
                  Netlify Access Token
                </Dialog.Title>
                
                <div className="mt-4">
                  <p className="text-sm text-bolt-elements-textSecondary">
                    Enter your Netlify personal access token to enable automated deployments.
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                        Personal Access Token
                      </label>
                      <input
                        type="password"
                        value={netlifyToken}
                        onChange={(e) => setNetlifyToken(e.target.value)}
                        placeholder="Enter your token here"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-accent-500"
                      />
                    </div>
                    
                    <div className="text-sm text-bolt-elements-textSecondary">
                      <a
                        href="https://app.netlify.com/user/applications#personal-access-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-500 hover:underline inline-flex items-center gap-1"
                      >
                        Get your token on Netlify
                        <div className="i-ph:arrow-square-out w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border bg-transparent border-bolt-elements-borderColor px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-500"
                    onClick={saveNetlifyToken}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 