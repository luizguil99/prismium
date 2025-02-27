import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import NetlifySvgLogo from './netlifysvglogo';
import DomainSettingsModal from '../../deploy/DomainSettingsModal';
import { useStore } from '@nanostores/react';
import { netlifyConnection } from '~/lib/stores/netlify';
import { chatId } from '~/lib/persistence/useChatHistory';

interface DeployLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
  siteName: string;
  siteId: string;
}

export const DeployLinkModal = ({ isOpen, onClose, siteUrl, siteName, siteId }: DeployLinkModalProps) => {
  // URL para a página de configurações de domínio do site no Netlify
  // Formato correto: https://app.netlify.com/sites/SITE_NAME/domain-management
  
  // Garantir que o nome do site não contenha "http://" ou "https://"
  const cleanSiteName = siteName.replace(/^https?:\/\//, '');
  
  // URL para a página de configurações de domínio
  const netlifyDomainSettingsUrl = `https://app.netlify.com/sites/${cleanSiteName}/domain-management`;
  
  // Estado para controlar o ícone de cópia
  const [copied, setCopied] = useState(false);
  
  // Estado para controlar o modal de configurações de domínio
  const [domainSettingsModalOpen, setDomainSettingsModalOpen] = useState(false);
  
  // Função para formatar um URL corretamente
  const formatUrl = (url: string): string => {
    // Remover localhost ou caminhos incorretos, se presentes
    let cleanedUrl = url.replace(/^https?:\/\/localhost:[0-9]+\/.*?\//, '');
    
    // Remover http:// ou https:// se presentes
    cleanedUrl = cleanedUrl.replace(/^https?:\/\//, '');
    
    // Readicionar o protocolo https://
    return cleanedUrl.includes('://') ? cleanedUrl : `https://${cleanedUrl}`;
  };
  
  // Estado local para armazenar o URL do site (para atualização quando o domínio mudar)
  const [currentSiteUrl, setCurrentSiteUrl] = useState(formatUrl(siteUrl));
  
  // Obter o token do Netlify do store
  const connection = useStore(netlifyConnection);
  
  // Obter o chatId atual
  const currentChatId = useStore(chatId);
  
  // Função para salvar informações do domínio no localStorage
  const saveDomainInfo = (siteId: string, url: string) => {
    if (!currentChatId) return;
    
    try {
      // Salvamos a informação do domínio em uma chave diferente do ID do site
      const key = `netlify-domain-${currentChatId}-${siteId}`;
      localStorage.setItem(key, url);
      console.log('Domínio salvo no localStorage pelo DeployLinkModal:', { siteId, url, key });
    } catch (error) {
      console.error('Erro ao salvar informações do domínio:', error);
    }
  };
  
  // Carregar domínio personalizado do localStorage, se existir
  useEffect(() => {
    if (currentChatId && siteId) {
      try {
        const key = `netlify-domain-${currentChatId}-${siteId}`;
        const savedDomain = localStorage.getItem(key);
        
        if (savedDomain) {
          // Usar o domínio salvo em vez do padrão
          setCurrentSiteUrl(savedDomain);
          console.log('Carregado domínio personalizado do localStorage:', savedDomain);
        }
      } catch (error) {
        console.error('Erro ao carregar domínio do localStorage:', error);
      }
    }
  }, [currentChatId, siteId]);
  
  // Função para copiar o URL para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentSiteUrl);
    setCopied(true);
    
    // Resetar o estado após 2 segundos
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Função para abrir o modal de configurações de domínio
  const openDomainSettings = () => {
    setDomainSettingsModalOpen(true);
  };

  // Monitorar mudanças no siteUrl prop
  useEffect(() => {
    if (siteUrl) {
      const formatted = formatUrl(siteUrl);
      setCurrentSiteUrl(formatted);
      
      // Salvar o URL no localStorage sempre que for atualizado via props
      if (currentChatId && siteId) {
        saveDomainInfo(siteId, formatted);
      }
    }
  }, [siteUrl, currentChatId, siteId]);

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
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <NetlifySvgLogo width={20} height={20} />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-bolt-elements-textPrimary"
                    >
                      Deployment Successful!
                    </Dialog.Title>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-bolt-elements-textSecondary mb-4">
                      Your site has been successfully deployed to Netlify. You can access it using the link below:
                    </p>

                    {/* Link do site */}
                    <div className="p-3 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-bolt-elements-textSecondary truncate max-w-[250px]">
                          {currentSiteUrl}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={copyToClipboard}
                            className="p-1.5 rounded-md hover:bg-bolt-elements-background-depth-3 bg-transparent text-bolt-elements-textSecondary"
                            title="Copy to clipboard"
                          >
                            <div className={`${copied ? 'i-ph:check-bold text-green-500' : 'i-ph:copy'} w-4 h-4 transition-all duration-200`} />
                          </button>
                          <a
                            href={currentSiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary"
                            title="Open in new tab"
                          >
                            <div className="i-ph:arrow-square-out w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Instruções para mudar o domínio */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-bolt-elements-textPrimary">
                        How to customize your domain
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center justify-center mr-2">
                              <span className="text-xs">1</span>
                            </div>
                            <p className="text-xs text-bolt-elements-textSecondary">
                              You can customize your domain directly from Prismium.
                            </p>
                          </div>
                          
                          <div className="ml-7">
                            <button
                              onClick={openDomainSettings}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-500 hover:bg-accent-600 text-white rounded-md transition-colors"
                            >
                              <div className="i-ph:gear-six w-3.5 h-3.5" />
                              Change Domain Settings
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center justify-center mr-2">
                              <span className="text-xs">2</span>
                            </div>
                            <p className="text-xs text-bolt-elements-textSecondary">
                              Alternatively, you can go to Netlify's domain management page:
                            </p>
                          </div>
                          
                          <div className="ml-7">
                            <a
                              href={netlifyDomainSettingsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent-500 hover:bg-bolt-elements-background-depth-2 rounded-md transition-colors"
                            >
                              <div className="i-ph:gear-six w-3.5 h-3.5" />
                              Open Domain Settings in Netlify
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor focus:outline-none"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Modal de configurações de domínio */}
      {domainSettingsModalOpen && (
        <DomainSettingsModal
          isOpen={domainSettingsModalOpen}
          onClose={() => setDomainSettingsModalOpen(false)}
          siteId={siteId}
          siteName={siteName}
          currentDomain={currentSiteUrl.replace(/^https?:\/\//, '')}
          netlifyToken={connection.token || ''}
          onDomainUpdate={(newDomain) => {
            // Atualizar o estado local com o novo domínio, formatando corretamente
            const formattedDomain = formatUrl(newDomain);
            setCurrentSiteUrl(formattedDomain);
            
            // Salvar o novo domínio no localStorage
            if (currentChatId) {
              saveDomainInfo(siteId, formattedDomain);
            }
            
            console.log('Domínio atualizado:', formattedDomain);
          }}
        />
      )}
    </>
  );
};

export default DeployLinkModal;
