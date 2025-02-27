import { useStore } from '@nanostores/react';
import { netlifyConnection, fetchNetlifyStats } from '~/lib/stores/netlify';
import { chatId } from '~/lib/persistence/useChatHistory';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useEffect, useState } from 'react';

export function NetlifyDeploymentLink() {
  const connection = useStore(netlifyConnection);
  const currentChatId = useStore(chatId);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

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

  // Função para carregar informações do domínio do localStorage
  const loadDomainInfo = (siteId: string): string | null => {
    if (!currentChatId) return null;
    
    try {
      const key = `netlify-domain-${currentChatId}-${siteId}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error loading domain info:', error);
      return null;
    }
  };

  useEffect(() => {
    if (connection.token && currentChatId) {
      fetchNetlifyStats(connection.token);
    }
  }, [connection.token, currentChatId]);

  useEffect(() => {
    const deployedSite = connection.stats?.sites?.find((site) => site.name.includes(`prismium-ai-${currentChatId}`));
    
    if (deployedSite) {
      // Verificar se existe um domínio personalizado no localStorage
      const savedDomain = loadDomainInfo(deployedSite.id);
      
      if (savedDomain) {
        // Formatar o domínio salvo para garantir consistência
        setSiteUrl(formatUrl(savedDomain));
      } else {
        // Se não houver domínio personalizado, usar a URL do site formatada
        setSiteUrl(formatUrl(deployedSite.url));
      }
    } else {
      setSiteUrl(null);
    }
  }, [connection.stats, currentChatId]);

  if (!siteUrl) {
    return null;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textSecondary hover:text-[#00AD9F] z-50"
            onClick={(e) => {
              e.stopPropagation(); // Add this to prevent click from bubbling up
            }}
          >
            <div className="i-ph:rocket-launch w-5 h-5" />
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="px-3 py-2 rounded bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary text-xs z-50"
            sideOffset={5}
          >
            {siteUrl}
            <Tooltip.Arrow className="fill-bolt-elements-background-depth-3" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}