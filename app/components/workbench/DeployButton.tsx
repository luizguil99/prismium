import { memo, useState, useEffect } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import NetlifySvgLogo from './netlifysvglogo';
import VercelSvgLogo from './vercelsvglogo';
import CloudflareSvgLogo from './cloudflaresvglogo';
import { netlifyConnection, fetchNetlifyStats } from '~/lib/stores/netlify';
import { chatId } from '~/lib/persistence/useChatHistory';
import { webcontainer } from '~/lib/webcontainer';
import { logStore } from '~/lib/stores/logs';
import nodePath from 'node:path';
import type { WebContainer } from '@webcontainer/api';
import type { NetlifySiteInfo } from '~/types/netlify';
import { workbenchStore } from '~/lib/stores/workbench';
import { BoltShell } from '~/utils/shell';
import { NetlifyTokenCard } from './NetlifyTokenCard';
import DeployLinkModal from './DeployLinkModal';

// Interfaces para tipagem
interface DeployResponse {
  success: boolean;
  deploy: {
    id: string;
    state: string;
    url?: string;
  };
  site: NetlifySiteInfo;
}

export const DeployButton = memo(() => {
  // Estado para gerenciar o deploy em andamento
  const [deployingTo, setDeployingTo] = useState<string | null>(null);
  const connection = useStore(netlifyConnection);
  const currentChatId = useStore(chatId);
  
  // Estado para armazenar o site ID do Netlify (se existir)
  const [netlifyId, setNetlifyId] = useState<string | null>(null);
  
  // Estado para controlar o modal de configuração do Netlify
  const [showNetlifyConfig, setShowNetlifyConfig] = useState(false);
  
  // Estado para controlar o modal de link de deploy
  const [deployLinkModalOpen, setDeployLinkModalOpen] = useState(false);
  const [deployedSiteInfo, setDeployedSiteInfo] = useState<{url: string, name: string, id: string} | null>(null);
  
  // Carrega o ID do site do Netlify do localStorage, se existir
  useEffect(() => {
    if (currentChatId) {
      const storedId = localStorage.getItem(`netlify-site-${currentChatId}`);
      if (storedId) {
        setNetlifyId(storedId);
      }
    }
  }, [currentChatId]);

  // Função para obter recursivamente todos os arquivos de um diretório
  const getAllFiles = async (container: WebContainer, dir: string, buildDir: string): Promise<Record<string, string>> => {
    try {
      const files: Record<string, string> = {};
      
      // Função recursiva para navegar pelos diretórios
      const processDirectory = async (dirPath: string) => {
        try {
          const dirEntries = await container.fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of dirEntries) {
            const fullPath = `${dirPath}/${entry.name}`;
            
            if (entry.isDirectory()) {
              // Ignora node_modules e .git
              if (entry.name !== 'node_modules' && entry.name !== '.git') {
                await processDirectory(fullPath);
              }
            } else if (entry.isFile()) {
              try {
                // Lê o conteúdo do arquivo
                const content = await container.fs.readFile(fullPath, 'utf-8');
                // Salva o caminho relativo ao diretório de build
                const relativePath = fullPath.replace(buildDir, '');
                files[relativePath] = content;
              } catch (error) {
                console.error(`Error reading file ${fullPath}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dirPath}:`, error);
        }
      };
      
      await processDirectory(dir);
      return files;
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  };

  // Função para executar o build e fazer deploy no Netlify
  const deployToNetlify = async () => {
    if (deployingTo) {
      toast.info(`A deployment is already in progress for ${deployingTo}`);
      return;
    }
    
    if (!connection.token) {
      setShowNetlifyConfig(true);
      return;
    }
    
    if (!currentChatId) {
      toast.error('Chat ID not found');
      return;
    }
    
    try {
      setDeployingTo('Netlify');
      toast.info('Starting deployment to Netlify...');
      
      // Show terminal
      workbenchStore.showTerminal.set(true);
      
      // Obtém o WebContainer
      const container = await webcontainer;
      
      // Verifica se o projeto tem um package.json
      let hasPackageJson = false;
      let hasNpmBuild = false;
      
      try {
        const rootFiles = await container.fs.readdir('/');
        hasPackageJson = rootFiles.includes('package.json');
        
        if (hasPackageJson) {
          const packageJsonContent = await container.fs.readFile('/package.json', 'utf-8');
          const packageJson = JSON.parse(packageJsonContent);
          hasNpmBuild = packageJson.scripts && packageJson.scripts.build;
        }
      } catch (error) {
        console.error('Error checking package.json:', error);
      }
      
      // Diretório onde os arquivos estão ou serão gerados
      let buildDir = '/';
      
      // Se o projeto tem um script de build, tenta executá-lo usando o terminal Bolt
      if (hasNpmBuild) {
        toast.info('Running project build via terminal...');
        try {
          // Usar o terminal Bolt para executar o build
          const boltTerminal = workbenchStore.boltTerminal;
          
          if (boltTerminal) {
            const result = await boltTerminal.executeCommand(
              'build', 
              'npm run build', 
              () => { console.log('Build aborted'); }
            );
            
            if (result?.exitCode !== 0) {
              throw new Error(`Build failed with exit code ${result?.exitCode}`);
            }
            
            toast.info('Build completed successfully!');
          } else {
            throw new Error('Terminal not available');
          }
          
          // Determina o diretório de build (geralmente 'dist' ou 'build')
          try {
            // Verifica os diretórios comuns de build
            const buildDirs = ['/dist', '/build', '/public', '/out'];
            for (const dir of buildDirs) {
              try {
                await container.fs.readdir(dir);
                buildDir = dir;
                break;
              } catch {
                // Diretório não existe, continua para o próximo
              }
            }
          } catch (error) {
            console.error('Error determining build directory:', error);
            buildDir = '/'; // Usa o diretório raiz como fallback
          }
        } catch (error) {
          console.error('Error during build:', error);
          toast.warning('Build failed. Trying to deploy existing files...');
          
          // Se o build falhar, procura por diretórios comuns
          try {
            const buildDirs = ['/dist', '/build', '/public', '/out'];
            for (const dir of buildDirs) {
              try {
                await container.fs.readdir(dir);
                buildDir = dir;
                toast.info(`Using files from directory ${dir} for deployment`);
                break;
              } catch {
                // Diretório não existe, continua para o próximo
              }
            }
          } catch (error) {
            console.error('Error determining build directory:', error);
          }
        }
      } else {
        // Se não tiver script de build, verifica se existe um diretório público
        try {
          const buildDirs = ['/public', '/dist', '/build', '/out'];
          for (const dir of buildDirs) {
            try {
              await container.fs.readdir(dir);
              buildDir = dir;
              toast.info(`Using files from directory ${dir} for deployment`);
              break;
            } catch {
              // Diretório não existe, continua para o próximo
            }
          }
        } catch (error) {
          console.error('Error checking public directories:', error);
          toast.info('Using files from root directory for deployment');
        }
      }
      
      toast.info('Collecting files for deployment...');
      
      // Coleta todos os arquivos do diretório de build
      const files = await getAllFiles(container, buildDir, buildDir);
      
      if (Object.keys(files).length === 0) {
        // Se não encontrar arquivos no diretório de build, tenta usar o diretório raiz
        if (buildDir !== '/') {
          toast.warning(`No files found in ${buildDir}. Trying to use root directory...`);
          buildDir = '/';
          const rootFiles = await getAllFiles(container, buildDir, buildDir);
          
          // Exclui node_modules e outros diretórios grandes do deploy
          const filteredFiles: Record<string, string> = {};
          for (const [path, content] of Object.entries(rootFiles)) {
            if (!path.includes('node_modules/') && !path.includes('.git/')) {
              filteredFiles[path] = content;
            }
          }
          
          if (Object.keys(filteredFiles).length === 0) {
            throw new Error('No files found for deployment');
          }
          
          // Usa os arquivos do diretório raiz
          Object.assign(files, filteredFiles);
        } else {
          throw new Error('No files found for deployment');
        }
      }
      
      if (!files['/index.html'] && !files['index.html']) {
        // Se não encontrar um index.html, cria um básico
        toast.warning('index.html file not found. Creating a basic file...');
        files['/index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployed with Prismium</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f7f7f7;
      color: #333;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #00AD9F;
    }
    p {
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Site Deployed with Prismium</h1>
    <p>This site was successfully deployed to Netlify via Prismium. Edit your files to customize this site.</p>
    <p>ChatID: ${currentChatId}</p>
  </div>
</body>
</html>`;
      }
      
      toast.info(`Collected ${Object.keys(files).length} files for deployment`);
      
      // Faz o deploy no Netlify
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          token: connection.token,
          chatId: currentChatId,
          siteId: netlifyId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as { error: string };
        throw new Error(errorData.error || 'Deployment error');
      }
      
      const data = await response.json() as DeployResponse;
      
      // Armazena o ID do site para futuros deploys
      if (data.site?.id) {
        localStorage.setItem(`netlify-site-${currentChatId}`, data.site.id);
        setNetlifyId(data.site.id);
      }
      
      toast.success(`Deployment to Netlify completed successfully! 🚀`);
      
      // Salvar informações do site e abrir o modal de link de deploy
      if (data.site?.url) {
        // Abre o site em uma nova aba
        window.open(data.site.url, '_blank');
        
        // Extrair nome do site da URL (formato: https://prismium-ai-xxxx.netlify.app)
        // Este é o subdomínio que o Netlify usa para identificar o site
        const netlifySubdomain = data.site.url.replace(/^https?:\/\//, '').split('.')[0];
        
        setDeployedSiteInfo({
          url: data.site.url,
          name: netlifySubdomain,
          id: data.site.id
        });
        
        // Atualizar as estatísticas do Netlify antes de abrir o modal
        // para garantir que as informações de domínio estejam disponíveis
        if (connection.token) {
          await fetchNetlifyStats(connection.token);
        }
        
        setDeployLinkModalOpen(true);
      }
      
    } catch (error) {
      console.error('Deployment error:', error);
      logStore.logError('Failed to deploy to Netlify', { error });
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeployingTo(null);
    }
  };

  return (
    <>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button 
              className="flex items-center justify-center px-3 h-8 rounded-lg bg-transparent hover:bg-bolt-elements-background-depth-3 transition-colors text-accent-500 group focus:outline-none focus:ring-0"
              aria-label="Deployment options"
            >
              <div className="flex items-center gap-1.5">
                <div className={`i-ph:rocket w-5 h-5 ${deployingTo ? 'animate-pulse' : ''} text-accent-500`} />
                <span className="text-sm font-medium text-accent-500 transition-colors">Deploy</span>
              </div>
            </Popover.Button>
            
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Popover.Panel className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-xl bg-transparent shadow-2xl">
                <div className="p-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl backdrop-blur-sm">
                  <div className="text-sm font-medium px-3 py-2 text-accent-500 flex items-center gap-2">
                    <div className="i-ph:rocket-launch" />
                    <span>Deploy Project</span>
                  </div>
                  
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={deployToNetlify}
                      disabled={!!deployingTo}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm focus:outline-none focus:ring-0"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <NetlifySvgLogo width={20} height={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Deploy to Netlify</span>
                        <span className="text-xs text-bolt-elements-textTertiary">
                          {!connection.token 
                            ? "Not connected" 
                            : netlifyId 
                              ? "Update existing site" 
                              : "Create new site"}
                        </span>
                      </div>
                      {deployingTo === 'Netlify' && (
                        <div className="ml-auto animate-spin w-4 h-4 i-ph:circle-notch text-cyan-600" />
                      )}
                    </button>
                    
                    <button
                      disabled={true}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm focus:outline-none focus:ring-0"
                    >
                      <div className="w-5 h-5 text-bolt-elements-textPrimary">
                        <VercelSvgLogo width={20} height={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Deploy to Vercel</span>
                        <span className="text-xs text-bolt-elements-textTertiary">Coming Soon</span>
                      </div>
                    </button>
                    
                    <button
                      disabled={true}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm focus:outline-none focus:ring-0"
                    >
                      <div className="w-5 h-5 text-orange-500">
                        <CloudflareSvgLogo width={20} height={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Deploy to Cloudflare</span>
                        <span className="text-xs text-bolt-elements-textTertiary">Coming Soon</span>
                      </div>
                    </button>
                    
                    {/* Divider */}
                    <div className="h-px bg-bolt-elements-borderColor my-2 mx-2" />
                    
                    {/* Netlify Config Button */}
                    <button
                      onClick={() => setShowNetlifyConfig(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary hover:shadow-sm focus:outline-none focus:ring-0"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="i-ph:gear-six w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Configs and Links</span>
                        <span className="text-xs text-bolt-elements-textTertiary">
                          {connection.token ? "Update access token" : "Set access token"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      
      {/* Netlify Token Configuration Modal */}
      <NetlifyTokenCard 
        isOpen={showNetlifyConfig} 
        onClose={() => setShowNetlifyConfig(false)} 
      />
      
      {deployedSiteInfo && (
        <DeployLinkModal
          isOpen={deployLinkModalOpen}
          onClose={() => {
            // Atualizar as estatísticas do Netlify antes de fechar o modal
            // para garantir que as informações de domínio estejam atualizadas
            if (connection.token) {
              import('~/lib/stores/netlify').then(({ fetchNetlifyStats }) => {
                fetchNetlifyStats(connection.token || '');
              });
            }
            setDeployLinkModalOpen(false);
          }}
          siteUrl={deployedSiteInfo.url}
          siteName={deployedSiteInfo.name}
          siteId={deployedSiteInfo.id}
        />
      )}
    </>
  );
});