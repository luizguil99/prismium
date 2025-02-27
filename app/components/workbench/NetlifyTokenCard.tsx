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
  const [netlifyToken, setNetlifyToken] = useState(connection.token || '');
  const currentChatId = useStore(chatId);

  // Estado para controlar o modal de configurações de domínio
  const [domainSettingsModalOpen, setDomainSettingsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<{ id: string, name: string, url: string } | null>(null);
  
  // Estado local para armazenar os sites implantados (para atualização imediata)
  const [localDeployedSites, setLocalDeployedSites] = useState<Array<{ id: string, name: string, url: string }>>([]);
  
  // Estado para forçar a atualização da lista de sites
  const [forceUpdate, setForceUpdate] = useState(0);

  // Função para salvar informações do domínio no localStorage
  const saveDomainInfo = (siteId: string, url: string) => {
    if (!currentChatId) return;
    
    try {
      // Salvamos a URL completa (com https://) na mesma chave usada para domínios personalizados
      const key = `netlify-domain-${currentChatId}-${siteId}`;
      localStorage.setItem(key, url);
      console.log('Domínio salvo no localStorage:', { siteId, url, key });
    } catch (error) {
      console.error('Erro ao salvar informações do domínio:', error);
    }
  };

  // Função para carregar informações do domínio do localStorage
  const loadDomainInfo = (siteId: string): string | null => {
    if (!currentChatId) return null;
    
    try {
      const key = `netlify-domain-${currentChatId}-${siteId}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Erro ao carregar informações do domínio:', error);
      return null;
    }
  };

  // Carregar sites do localStorage na inicialização
  useEffect(() => {
    if (!currentChatId) return;
    
    try {
      // Verificar se existe um site ID para este chat
      const siteId = localStorage.getItem(`netlify-site-${currentChatId}`);
      
      if (siteId) {
        // Verificar se existe informação de domínio salva
        const savedDomain = loadDomainInfo(siteId);
        
        if (savedDomain) {
          // Criar um site local com as informações salvas
          const localSite = {
            id: siteId,
            name: `prismium-ai-${currentChatId}`,
            url: savedDomain
          };
          
          // Adicionar ao estado local
          setLocalDeployedSites([localSite]);
          console.log('Site carregado do localStorage:', localSite);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sites do localStorage:', error);
    }
  }, [currentChatId]);

  // Função para formatar URLs corretamente
  const formatUrl = (url: string): string => {
    // Se a URL estiver vazia, retornar vazia
    if (!url) return '';
    
    // Remover localhost ou caminhos incorretos, se presentes
    let cleanedUrl = url.replace(/^https?:\/\/localhost:[0-9]+\/.*?\//, '');
    
    // Remover http:// ou https:// se presentes
    cleanedUrl = cleanedUrl.replace(/^https?:\/\//, '');
    
    // Adicionar https:// se não estiver presente
    return cleanedUrl.includes('://') ? cleanedUrl : `https://${cleanedUrl}`;
  };

  // Função para carregar sites atualizados do localStorage
  const loadUpdatedSites = () => {
    if (!currentChatId || !connection.stats?.sites) return;
    
    try {
      // Obter todos os sites do Netlify para o chat atual
      const netlifyOriginalSites = connection.stats.sites
        .filter(site => site.name.includes(`prismium-ai-${currentChatId}`));
      
      // Verificar se algum site tem um domínio personalizado no localStorage
      const updatedSites = netlifyOriginalSites.map(site => {
        const savedDomain = loadDomainInfo(site.id);
        
        if (savedDomain) {
          return {
            ...site,
            url: savedDomain,
            _manuallyUpdated: true
          };
        }
        
        return site;
      });
      
      // Atualizar o estado local
      if (updatedSites.length > 0) {
        setLocalDeployedSites(updatedSites);
      }
    } catch (error) {
      console.error('Erro ao carregar sites atualizados:', error);
    }
  };

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
  
  // Efeito para atualizar os sites quando o token ou o chatId mudar
  useEffect(() => {
    if (connection.token) {
      // Buscar dados do Netlify
      fetchNetlifyStats(connection.token);
      
      // Carregar sites atualizados do localStorage
      if (connection.stats?.sites) {
        loadUpdatedSites();
      }
    }
  }, [connection.token, currentChatId, forceUpdate, connection.stats]);

  // Efeito para processar os sites do Netlify quando os stats mudarem
  useEffect(() => {
    if (connection.stats?.sites && currentChatId) {
      // Carregar sites atualizados do localStorage
      loadUpdatedSites();
    }
  }, [connection.stats, currentChatId, forceUpdate]);

  // Função para atualizar localmente um site após a mudança de domínio
  const updateLocalSite = (siteId: string, newDomain: string) => {
    // Garantir que o domínio tenha o formato correto
    const formattedDomain = newDomain.startsWith('http') ? newDomain : `https://${newDomain}`;
    
    // Primeiro, encontrar o site atual para preservar todas as suas propriedades
    const currentSite = localDeployedSites.find(site => site.id === siteId) || 
                        deployedSites.find(site => site.id === siteId);
    
    if (!currentSite) {
      console.error('Site não encontrado para atualização:', siteId);
      return;
    }
    
    // Criar uma cópia atualizada do site
    const updatedSite = {
      ...currentSite,
      url: formattedDomain,
      // Adicionar uma flag para indicar que este site foi atualizado manualmente
      _manuallyUpdated: true
    };
    
    // Atualizar a lista local de sites
    setLocalDeployedSites(prevSites => {
      // Verificar se o site já existe na lista
      const siteExists = prevSites.some(site => site.id === siteId);
      
      if (siteExists) {
        // Atualizar o site existente
        return prevSites.map(site => 
          site.id === siteId ? updatedSite : site
        );
      } else {
        // Adicionar o novo site à lista
        return [...prevSites, updatedSite];
      }
    });
    
    // Salvar as informações do domínio no localStorage
    saveDomainInfo(siteId, formattedDomain);
    
    console.log('Site atualizado localmente:', { 
      siteId, 
      newDomain: formattedDomain
    });
    
    // Forçar o refresh dos dados do Netlify
    if (connection.token) {
      setTimeout(() => {
        fetchNetlifyStats(connection.token);
      }, 500);
    }
    
    // Forçar a atualização da lista de sites
    setForceUpdate(forceUpdate + 1);
  };

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
  const deployedSites = localDeployedSites.length > 0 
    ? localDeployedSites 
    : connection.stats?.sites
        ?.filter((site) => site.name.includes(`prismium-ai-${currentChatId}`))
        .map(site => ({
          ...site,
          url: formatUrl(site.url)
        })) || [];

  // Filtrar sites para exibição (remover duplicatas por ID)
  const filteredSites = deployedSites.reduce((acc, site) => {
    // Verificar se já existe um site com o mesmo ID
    const existingIndex = acc.findIndex(s => s.id === site.id);
    
    if (existingIndex >= 0) {
      // Se existir, substituir apenas se o site atual for mais recente (manualmente atualizado)
      if (site._manuallyUpdated) {
        acc[existingIndex] = site;
      }
    } else {
      // Se não existir, adicionar à lista
      acc.push(site);
    }
    
    return acc;
  }, [] as typeof deployedSites);

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

  // Excluir domínios problemáticos ou a string "localhost" da lista de sites
  const filteredSitesList = filteredSites.filter(site => {
    const url = site.url.toLowerCase();
    return !url.includes('localhost') && 
           !url.includes('undefined') && 
           url.length > 0;
  });

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
                    {filteredSitesList.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-bolt-elements-borderColor">
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">
                          Deployed Sites
                        </h4>
                        <div className="space-y-2">
                          {filteredSitesList.map((site) => (
                            <div key={site.id} className="flex items-center justify-between p-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4">
                                  <NetlifySvgLogo width={16} height={16} />
                                </div>
                                <span className="text-xs text-bolt-elements-textSecondary truncate max-w-[180px]">
                                  {site.url.replace(/^https?:\/\//, '')}
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
            // Atualizar localmente o site com o novo domínio
            updateLocalSite(selectedSite.id, newDomain);
            
            // Fechar o modal
            setDomainSettingsModalOpen(false);
            
            toast.success(`Domain updated to ${newDomain}`);
          }}
        />
      )}
    </>
  );
};