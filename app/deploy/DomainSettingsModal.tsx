import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

interface DomainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName?: string;
  currentDomain: string;
  netlifyToken: string;
  onDomainUpdate?: (newDomain: string) => void;
}

// Tipo para resposta da API do Netlify
interface NetlifySiteData {
  name: string;
  custom_domain?: string;
  [key: string]: any;
}

export const DomainSettingsModal = ({
  isOpen,
  onClose,
  siteId,
  siteName,
  currentDomain,
  netlifyToken,
  onDomainUpdate
}: DomainSettingsModalProps) => {
  // Log para depuração
  console.log('DomainSettingsModal props:', { siteId, siteName, currentDomain });
  
  // Estado para armazenar o nome do site
  const [fullSiteName, setFullSiteName] = useState<string | undefined>(siteName);
  
  // Buscar informações do site quando o modal é aberto
  useEffect(() => {
    const fetchSiteInfo = async () => {
      if (siteId && netlifyToken) {
        try {
          const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
            headers: {
              Authorization: `Bearer ${netlifyToken}`,
            },
          });
          
          if (response.ok) {
            const siteData = await response.json() as NetlifySiteData;
            setFullSiteName(siteData.name);
            console.log('Site data fetched:', siteData);
          }
        } catch (error) {
          console.error('Error fetching site info:', error);
        }
      }
    };
    
    fetchSiteInfo();
  }, [siteId, netlifyToken]);
  
  // Remover "http://" ou "https://" do currentDomain
  const cleanDomain = (domain: string) => {
    return domain.replace(/^https?:\/\//, '');
  };
  
  // Estado para armazenar o novo domínio, já limpo de http:// ou https://
  const [newDomain, setNewDomain] = useState(cleanDomain(currentDomain || ''));
  
  // Estado para controlar o carregamento durante a atualização
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para armazenar mensagens de erro
  const [error, setError] = useState('');

  // Estado para controlar o tipo de domínio (personalizado ou subdomínio Netlify)
  const [domainType, setDomainType] = useState<'custom' | 'netlify'>('custom');
  
  // Estado para armazenar o subdomínio Netlify
  const [netlifySubdomain, setNetlifySubdomain] = useState('');

  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy');
    });
  };

  // Validar domínio personalizado
  const validateCustomDomain = (domain: string): boolean => {
    // Regex para validar domínio
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  // Função para atualizar o domínio via API do Netlify
  const updateDomain = async () => {
    // Determinar o domínio a ser usado com base no tipo selecionado
    const domainToUse = domainType === 'custom' 
      ? newDomain.trim() 
      : `${netlifySubdomain.trim()}.netlify.app`;

    // Validar se o domínio foi fornecido
    if (domainType === 'custom') {
      if (!newDomain.trim()) {
        setError('Please enter a domain');
        return;
      }
      
      // Validar formato do domínio personalizado
      if (!validateCustomDomain(newDomain.trim())) {
        setError('Please enter a valid domain (e.g., example.com)');
        return;
      }
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
      // Prepare o payload com base no tipo de domínio
      const payload: Record<string, any> = {};
      
      if (domainType === 'custom') {
        payload.custom_domain = domainToUse;
      } else {
        // Para subdomínios Netlify, enviamos uma atualização diferente
        payload.name = netlifySubdomain.trim();
        // Se houver um domínio personalizado anteriormente, limpamos ele
        if (currentDomain && !currentDomain.endsWith('.netlify.app')) {
          payload.custom_domain = null;
        }
      }

      // Fazer a requisição para a API do Netlify
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${netlifyToken}`
        },
        body: JSON.stringify(payload)
      });

      // Log para depuração
      console.log('Request payload:', payload);
      
      // Verificar se a requisição foi bem-sucedida
      if (!response.ok) {
        // Tentar obter detalhes do erro da resposta
        let errorMessage = 'Failed to update domain';
        try {
          const errorData = await response.json() as { message?: string, errors?: Array<{message: string}> };
          errorMessage = errorData.message || 
                        (errorData.errors && errorData.errors.length > 0 ? errorData.errors[0].message : errorMessage);
        } catch (e) {
          // Se não conseguir analisar a resposta JSON, usar mensagem padrão
        }
        throw new Error(errorMessage);
      }

      // Obter os dados da resposta
      const data = await response.json() as NetlifySiteData;
      
      // Formatar o URL correto do site atualizado para retornar
      let updatedDomainUrl = '';
      if (domainType === 'custom') {
        updatedDomainUrl = domainToUse; // Domínio personalizado como está
      } else {
        // Para subdomínios Netlify, certificar-se de incluir .netlify.app
        updatedDomainUrl = `${data.name}.netlify.app`;
      }
      
      // Mostrar mensagem de sucesso
      toast.success(`Domain updated to ${updatedDomainUrl}`);
      
      // Chamar o callback de atualização, se fornecido
      if (onDomainUpdate) {
        // Formato padronizado para o callback: apenas o domínio sem http/https
        onDomainUpdate(updatedDomainUrl);
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

  // Função para extrair o formato correto do nome do site (sempre prismium-ai-[chatId]-[timestamp])
  const getCanonicalSiteName = () => {
    // Log para debug dos valores disponíveis
    console.log('CNAME Debug:', { fullSiteName, siteId, currentDomain });
    
    // Primeiro tenta extrair de currentDomain se estiver disponível
    if (currentDomain) {
      // Remove http:// ou https:// e .netlify.app se presente
      const cleanedDomain = currentDomain
        .replace(/^https?:\/\//, '')
        .replace(/\.netlify\.app$/, '');
      
      // Verifica se o domínio limpo corresponde ao padrão
      const prismiumPattern = /^prismium-ai-[a-zA-Z0-9-]+-\d+$/;
      if (prismiumPattern.test(cleanedDomain)) {
        return cleanedDomain;
      }
    }
    
    // Tenta extrair do nome completo do site, se disponível
    if (fullSiteName) {
      const prismiumPattern = /^prismium-ai-[a-zA-Z0-9-]+-\d+$/;
      if (prismiumPattern.test(fullSiteName)) {
        return fullSiteName;
      }
      
      // Tenta encontrar o padrão em qualquer parte do nome do site
      const match = fullSiteName.match(/prismium-ai-[a-zA-Z0-9-]+-\d+/);
      if (match) {
        return match[0];
      }
    }
    
    // Tenta extrair do siteId, se disponível
    if (siteId) {
      const prismiumPattern = /^prismium-ai-[a-zA-Z0-9-]+-\d+$/;
      if (prismiumPattern.test(siteId)) {
        return siteId;
      }
      
      // Tenta encontrar o padrão em qualquer parte do siteId
      const match = siteId.match(/prismium-ai-[a-zA-Z0-9-]+-\d+/);
      if (match) {
        return match[0];
      }
    }
    
    // Se não conseguiu extrair o padrão de nenhum lugar, extrai do siteId ou do nome do site
    // Isso é uma tentativa de último recurso para não exibir o placeholder genérico
    if (siteId && siteId.includes('prismium-ai')) {
      return siteId;
    }
    
    if (fullSiteName && fullSiteName.includes('prismium-ai')) {
      return fullSiteName;
    }
    
    // Se todas as tentativas falharem, retorna o placeholder genérico
    return 'prismium-ai-site';
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
                  <span className="i-ph:globe-simple w-5 h-5 text-accent-500" />
                  Custom Domain Settings
                </Dialog.Title>

                <div className="mt-4">
                  <div className="text-sm text-bolt-elements-textSecondary mb-4">
                    Update the custom domain for your Netlify site.
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                        Current Domain
                      </label>
                      <div className="px-3 py-2 rounded-lg text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textSecondary mb-4">
                        {cleanDomain(currentDomain) || 'No custom domain configured'}
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
                            onChange={(e) => setNewDomain(cleanDomain(e.target.value))}
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
                      
                      <div className="mt-2 text-xs text-bolt-elements-textTertiary">
                        Example: mysite.com or app.mydomain.com
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="text-sm text-red-500 flex items-center gap-2">
                          <span className="i-ph:warning-circle w-4 h-4" />
                          {error}
                        </div>
                      </div>
                    )}

                    {/* DNS Configuration Instructions */}
                    {domainType === 'custom' && (
                      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2 flex items-center gap-2">
                          <span className="i-ph:info w-4 h-4 text-blue-500" />
                          Domain Configuration
                        </h4>
                        <div className="text-xs text-bolt-elements-textSecondary mb-2">
                          After adding a custom domain, you'll need to configure your DNS settings:
                        </div>
                        <div className="space-y-1 text-xs text-bolt-elements-textSecondary">
                          <div className="p-2 bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor flex justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">CNAME</span>
                              <span>www</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-bolt-elements-textTertiary truncate max-w-[120px]">
                                {getCanonicalSiteName()}.netlify.app
                              </span>
                              <button 
                                onClick={() => copyToClipboard(`${getCanonicalSiteName()}.netlify.app`)}
                                className="p-1.5 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textSecondary rounded-md transition-colors"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                                  <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                                </svg>
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
                            <div className="flex items-center gap-1">
                              <span className="text-bolt-elements-textTertiary">75.2.60.5</span>
                              <button 
                                onClick={() => copyToClipboard('75.2.60.5')}
                                className="p-1.5 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 text-bolt-elements-textSecondary rounded-md transition-colors"
                                title="Copy to clipboard"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                                  <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-bolt-elements-textTertiary">
                          <span className="font-medium">Note:</span> The CNAME value is your Netlify site's name in the format "prismium-ai-[chatId]-[timestamp]", which is used to configure your DNS settings.
                        </div>
                        <div className="mt-2 text-xs text-bolt-elements-textTertiary">
                          For detailed instructions, check Netlify's official documentation.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex bg-transparent justify-center rounded-md border border-bolt-elements-borderColor px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 focus:outline-none"
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
                        <span className="i-ph:circle-notch w-4 h-4 mr-2 animate-spin" />
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