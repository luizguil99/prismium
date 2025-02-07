import { Button } from "~/../@/components/ui/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/../@/components/ui/ui/dropdown-menu";
import { LLMManager } from "~/lib/modules/llm/manager";
import { useEffect, useState } from "react";
import type { Env } from "~/types/env";
import type { ModelInfo } from "~/lib/modules/llm/types";
import type { BaseProvider } from "~/lib/modules/llm/base-provider";

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  selectedProvider?: string;
  onSelectProvider?: (provider: string) => void;
}

export function Header({ 
  onToggleSidebar, 
  selectedModel, 
  onSelectModel,
  selectedProvider = "Anthropic",
  onSelectProvider
}: HeaderProps) {
  const [models, setModels] = useState<Array<{id: string, name: string}>>([]);
  const [providers, setProviders] = useState<BaseProvider[]>([]);
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  useEffect(() => {
    const env = import.meta.env as unknown as Env;
    const llmManager = LLMManager.getInstance(env);
    const availableProviders = llmManager.getAllProviders()
      .filter(provider => !['LMStudio', 'Ollama'].includes(provider.name));
    setProviders(availableProviders);
    
    const provider = llmManager.getProvider(selectedProvider);
    if (provider) {
      const providerModels = provider.staticModels.map(m => ({
        id: m.name,
        name: m.label
      }));
      setModels(providerModels);
    }
  }, [selectedProvider]);

  return (
    <div className="border-b border-zinc-800/50 p-4 flex items-center justify-between bg-[#101012]">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-zinc-800/50 bg-transparent lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5 text-zinc-400" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Provider Selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-200 h-9 px-3 rounded-lg"
              >
                {selectedProvider}
                <ChevronDown className="w-4 h-4 ml-2 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[200px] bg-[#101012] border border-zinc-800/50 text-zinc-200 rounded-lg shadow-xl"
            >
              {providers.map((provider) => (
                <DropdownMenuItem
                  key={provider.name}
                  className={`
                    px-2 py-2 cursor-pointer text-sm
                    ${provider.name === selectedProvider 
                      ? 'bg-blue-500/10 text-blue-500' 
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100'
                    }
                  `}
                  onClick={() => onSelectProvider?.(provider.name)}
                >
                  {provider.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Model Selection */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-200 h-9 px-3 rounded-lg"
              >
                {currentModel?.name || "Select model"}
                <ChevronDown className="w-4 h-4 ml-2 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[200px] bg-[#101012] border border-zinc-800/50 text-zinc-200 rounded-lg shadow-xl"
            >
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  className={`
                    px-2 py-2 cursor-pointer text-sm
                    ${model.id === selectedModel 
                      ? 'bg-blue-500/10 text-blue-500' 
                      : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100'
                    }
                  `}
                  onClick={() => onSelectModel(model.id)}
                >
                  {model.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Space for additional buttons */}
      </div>
    </div>
  );
}
