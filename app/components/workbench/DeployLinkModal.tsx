import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import NetlifySvgLogo from './netlifysvglogo';

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
  
  // Função para copiar o URL para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    
    // Resetar o estado após 2 segundos
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
                        {siteUrl}
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
                          href={siteUrl}
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
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center justify-center mt-0.5">
                          <span className="text-xs">1</span>
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary">
                          Go to your Netlify site settings by clicking the button below.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center justify-center mt-0.5">
                          <span className="text-xs">2</span>
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary">
                          Navigate to the "Domain management" section.
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary flex items-center justify-center mt-0.5">
                          <span className="text-xs">3</span>
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary">
                          Click "Add custom domain" to connect your own domain or "Options" next to the Netlify subdomain to customize it.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <a
                        href={netlifyDomainSettingsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent-500 hover:underline"
                      >
                        <div className="i-ph:gear-six w-3.5 h-3.5" />
                        Open Domain Settings in Netlify
                      </a>
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
  );
};

export default DeployLinkModal;
