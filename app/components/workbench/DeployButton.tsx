import { memo, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import NetlifySvgLogo from './netlifysvglogo';
import VercelSvgLogo from './vercelsvglogo';
import CloudflareSvgLogo from './cloudflaresvglogo';

export const DeployButton = memo(() => {
  // Estado para simular deploy em andamento
  const [deployingTo, setDeployingTo] = useState<string | null>(null);

  // Função de simulação de deploy
  const simulateDeploy = async (platform: string) => {
    if (deployingTo) {
      toast.info(`A deployment is already in progress for ${deployingTo}`);
      return;
    }

    try {
      setDeployingTo(platform);
      toast.info(`Starting deployment to ${platform}...`);
      
      // Simula o tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Deployment to ${platform} completed successfully!`);
    } catch (error) {
      console.error(`Error deploying to ${platform}:`, error);
      toast.error(`Failed to deploy to ${platform}`);
    } finally {
      setDeployingTo(null);
    }
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button 
            className="flex items-center justify-center px-3 h-8 rounded-lg bg-transparent hover:bg-bolt-elements-background-depth-3 transition-colors text-accent-500 group"
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
                    onClick={() => simulateDeploy('Netlify')}
                    disabled={!!deployingTo}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <NetlifySvgLogo width={20} height={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Deploy to Netlify</span>
                      <span className="text-xs text-bolt-elements-textTertiary">Hosting with CI/CD</span>
                    </div>
                    {deployingTo === 'Netlify' && (
                      <div className="ml-auto animate-spin w-4 h-4 i-ph:circle-notch text-cyan-600" />
                    )}
                  </button>
                  
                  <button
                    disabled={true}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
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
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                  >
                    <div className="w-5 h-5 text-orange-500">
                      <CloudflareSvgLogo width={20} height={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Deploy to Cloudflare</span>
                      <span className="text-xs text-bolt-elements-textTertiary">Coming Soon</span>
                    </div>
                  </button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
});