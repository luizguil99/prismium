import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { netlifyConnection, updateNetlifyConnection, fetchNetlifyStats } from '~/lib/stores/netlify';
import NetlifySvgLogo from './netlifysvglogo';
import { chatId } from '~/lib/persistence/useChatHistory';
import DomainSettingsModal from '../../deploy/DomainSettingsModal';

interface NetlifyTokenCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetlifyTokenCard = ({ isOpen, onClose }: NetlifyTokenCardProps) => {
  const connection = useStore(netlifyConnection);
  const [netlifyToken, setNetlifyToken] = useState('');
  const currentChatId = useStore(chatId);

  // Estado para controlar o modal de configurações de domínio
  const [domainSettingsModalOpen, setDomainSettingsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<{ id: string, name: string, url: string } | null>(null);

  // Initialize form token with current value (if exists)
  useEffect(() => {
    if (connection.token) {
      setNetlifyToken(connection.token);
    }
  }, [connection.token]);

  // Buscar estatísticas do Netlify quando o token ou chatId mudar
  useEffect(() => {
    if (connection.token && currentChatId) {
      fetchNetlifyStats(connection.token);
    }
  }, [connection.token, currentChatId]);

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

  // Encontrar sites implantados para o chat atual
  const deployedSites = connection.stats?.sites?.filter((site) => 
    site.name.includes(`prismium-ai-${currentChatId}`)
  ) || [];

  // Função para abrir o modal de configurações de domínio
  const openDomainSettings = (site: { id: string, name: string, url: string }) => {
    setSelectedSite(site);
    setDomainSettingsModalOpen(true);
  };

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy');
    });
  };

  return (
    <>
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

                    {/* Seção de sites implantados */}
                    {deployedSites.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-bolt-elements-borderColor">
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
                          Deployed Sites
                        </h4>
                        <div className="space-y-2">
                          {deployedSites.map((site) => (
                            <div key={site.id} className="flex items-center justify-between p-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4">
                                  <NetlifySvgLogo width={16} height={16} />
                                </div>
                                <span className="text-xs text-bolt-elements-textSecondary truncate max-w-[180px]">
                                  {site.url && !site.url.includes('.netlify.app') 
                                    ? site.url.replace(/^https?:\/\//, '')
                                    : site.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openDomainSettings(site)}
                                  className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-accent-500 rounded-md inline-flex items-center gap-1 transition-colors group relative"
                                  title="Change domain settings"
                                >
                                  <div className="i-ph:gear-six w-3 h-3" />
                                  Domain
                                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium group-hover:scale-110 transition-transform">?</span>
                                </button>
                                <a
                                  href={site.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 text-xs bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-accent-500 rounded-md inline-flex items-center gap-1 transition-colors"
                                >
                                  Visit
                                  <div className="i-ph:arrow-square-out w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Seção informativa sobre DNS - Sempre visível */}
                    <div className="mt-6 pt-4 border-t border-bolt-elements-borderColor">
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2 flex items-center gap-2">
                        <div className="i-ph:info w-4 h-4 text-blue-500" />
                        Domain Configuration
                      </h4>
                      <p className="text-xs text-bolt-elements-textSecondary mb-2">
                        After adding a custom domain, you'll need to configure your DNS settings:
                      </p>
                      <div className="space-y-1 text-xs text-bolt-elements-textSecondary">
                        <div className="p-2 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor flex justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">CNAME</span>
                            <span>www</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-bolt-elements-textTertiary truncate max-w-[120px]">
                              {deployedSites.length > 0 && deployedSites[0].name ? 
                                `${deployedSites[0].name}.netlify.app` : 
                                'your-site.netlify.app'}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(deployedSites.length > 0 && deployedSites[0].name ? 
                                `${deployedSites[0].name}.netlify.app` : 
                                'your-site.netlify.app')}
                              className="p-1 bg-transparent text-xs hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary rounded-md transition-colors"
                              title="Copy to clipboard"
                            >
                              <div className="i-ph:copy w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-center py-1">
                          <span className="text-xs font-medium text-bolt-elements-textSecondary bg-bolt-elements-background-depth-3 px-2 py-0.5 rounded">OR</span>
                        </div>
                        
                        <div className="p-2 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor flex justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">A</span>
                            <span>@</span>
                          </div>
                          <span className="text-bolt-elements-textTertiary">75.2.60.5</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-bolt-elements-textTertiary">
                        For detailed instructions, click the "Domain" button on any deployed site.
                      </p>
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

      {/* Modal de configurações de domínio */}
      {domainSettingsModalOpen && selectedSite && (
        <DomainSettingsModal
          isOpen={domainSettingsModalOpen}
          onClose={() => setDomainSettingsModalOpen(false)}
          siteId={selectedSite.id}
          siteName={selectedSite.name}
          currentDomain={selectedSite.url.replace(/^https?:\/\//, '')}
          netlifyToken={connection.token || ''}
          onDomainUpdate={(newDomain) => {
            // Atualizar as estatísticas do Netlify após a atualização do domínio
            if (connection.token) {
              fetchNetlifyStats(connection.token);
            }
            toast.success(`Domain updated to ${newDomain}`);
          }}
        />
      )}
    </>
  );
};