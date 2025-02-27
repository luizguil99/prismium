import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

interface DomainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  currentDomain: string;
  netlifyToken: string;
  onDomainUpdate?: (newDomain: string) => void;
}

export const DomainSettingsModal = ({
  isOpen,
  onClose,
  siteId,
  currentDomain,
  netlifyToken,
  onDomainUpdate
}: DomainSettingsModalProps) => {
  // Estado para armazenar o novo domínio
  const [newDomain, setNewDomain] = useState(currentDomain || '');
  
  // Estado para controlar o carregamento durante a atualização
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para armazenar mensagens de erro
  const [error, setError] = useState('');

  // Estado para controlar o tipo de domínio (personalizado ou subdomínio Netlify)
  const [domainType, setDomainType] = useState<'custom' | 'netlify'>('custom');
  
  // Estado para armazenar o subdomínio Netlify
  const [netlifySubdomain, setNetlifySubdomain] = useState('');

  // Função para atualizar o domínio via API do Netlify
  const updateDomain = async () => {
    // Determinar o domínio a ser usado com base no tipo selecionado
    const domainToUse = domainType === 'custom' 
      ? newDomain.trim() 
      : `${netlifySubdomain.trim()}.netlify.app`;

    // Validar se o domínio foi fornecido
    if (domainType === 'custom' && !newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    // Validar se o subdomínio Netlify foi fornecido
    if (domainType === 'netlify' && !netlifySubdomain.trim()) {
      setError('Please enter a Netlify subdomain');
      return;
    }

    // Validar se o token do Netlify foi fornecido
    if (!netlifyToken) {
      setError('Netlify token is required');
      return;
    }

    // Limpar erro anterior
    setError('');
    
    // Iniciar carregamento
    setIsLoading(true);

    try {
      // Fazer a requisição para a API do Netlify
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${netlifyToken}`
        },
        body: JSON.stringify({
          custom_domain: domainToUse
        })
      });

      // Verificar se a requisição foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Failed to update domain');
      }

      // Obter os dados da resposta
      const data = await response.json();
      
      // Mostrar mensagem de sucesso
      toast.success(`Domain updated to ${domainToUse}`);
      
      // Chamar o callback de atualização, se fornecido
      if (onDomainUpdate) {
        onDomainUpdate(domainToUse);
      }
      
      // Fechar o modal
      onClose();
    } catch (err) {
      // Mostrar mensagem de erro
      const errorMessage = err instanceof Error ? err.message : 'Failed to update domain';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Finalizar carregamento
      setIsLoading(false);
    }
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
                  <div className="i-ph:globe-simple w-5 h-5 text-accent-500" />
                  Custom Domain Settings
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-bolt-elements-textSecondary mb-4">
                    Update the custom domain for your Netlify site.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                        Current Domain
                      </label>
                      <div className="px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textSecondary mb-4">
                        {currentDomain || 'No custom domain configured'}
                      </div>
                      
                      <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                        Domain Type
                      </label>
                      <div className="flex space-x-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setDomainType('custom')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                            domainType === 'custom'
                              ? 'bg-accent-500 text-white border-accent-500'
                              : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor text-bolt-elements-textSecondary'
                          } transition-colors`}
                        >
                          Custom Domain
                        </button>
                        <button
                          type="button"
                          onClick={() => setDomainType('netlify')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                            domainType === 'netlify'
                              ? 'bg-accent-500 text-white border-accent-500'
                              : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor text-bolt-elements-textSecondary'
                          } transition-colors`}
                        >
                          Netlify Subdomain
                        </button>
                      </div>
                      
                      {domainType === 'custom' ? (
                        <>
                          <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                            New Domain
                          </label>
                          <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="Enter your custom domain"
                            className="w-full px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-accent-500"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                            Netlify Subdomain
                          </label>
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={netlifySubdomain}
                              onChange={(e) => setNetlifySubdomain(e.target.value)}
                              placeholder="your-site-name"
                              className="flex-1 px-3 py-2 rounded-l-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-1 focus:ring-accent-500"
                            />
                            <span className="px-3 py-2 rounded-r-lg text-sm bg-bolt-elements-background-depth-3 border border-l-0 border-bolt-elements-borderColor text-bolt-elements-textSecondary">
                              .netlify.app
                            </span>
                          </div>
                        </>
                      )}
                      
                      <p className="mt-2 text-xs text-bolt-elements-textTertiary">
                        Example: mysite.com or app.mydomain.com
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-500 flex items-center gap-2">
                          <div className="i-ph:warning-circle w-4 h-4" />
                          {error}
                        </p>
                      </div>
                    )}

                    {/* DNS Configuration Instructions */}
                    {domainType === 'custom' && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2 flex items-center gap-2">
                          <div className="i-ph:info w-4 h-4 text-blue-500" />
                          How to point your domain to Netlify
                        </h4>
                        <ol className="text-xs text-bolt-elements-textSecondary space-y-2 list-decimal pl-4">
                          <li>Go to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                          <li>Find the DNS management section for your domain</li>
                          <li>Add these DNS records to point to Netlify:
                            <div className="mt-2 overflow-x-auto">
                              <table className="min-w-full text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-bolt-elements-borderColor">
                                    <th className="px-2 py-1 text-left">Type</th>
                                    <th className="px-2 py-1 text-left">Name</th>
                                    <th className="px-2 py-1 text-left">Value</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-bolt-elements-borderColor/50">
                                    <td className="px-2 py-1">CNAME</td>
                                    <td className="px-2 py-1">www</td>
                                    <td className="px-2 py-1">{siteId ? `${siteId}.netlify.app` : 'your-site.netlify.app'}</td>
                                  </tr>
                                  <tr>
                                    <td className="px-2 py-1">A</td>
                                    <td className="px-2 py-1">@</td>
                                    <td className="px-2 py-1">75.2.60.5</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-2 text-xs text-bolt-elements-textTertiary">
                              <strong>Note:</strong> The CNAME value above is your site's unique Netlify identifier, which may be different from your current display URL.
                            </div>
                          </li>
                          <li>Wait for DNS changes to propagate (can take up to 48 hours)</li>
                          <li>After adding the domain here, Netlify will verify it automatically</li>
                        </ol>
                        <div className="mt-2 text-xs">
                          <a 
                            href="https://docs.netlify.com/domains-https/custom-domains/" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-500 hover:underline inline-flex items-center gap-1"
                          >
                            Read Netlify's official documentation
                            <div className="i-ph:arrow-square-out w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-bolt-elements-borderColor px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 focus:outline-none"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none ${
                      isLoading 
                        ? 'bg-accent-500/70 cursor-not-allowed' 
                        : 'bg-accent-500 hover:bg-accent-600'
                    }`}
                    onClick={updateDomain}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="i-ph:circle-notch w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Domain'
                    )}
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

export default DomainSettingsModal;