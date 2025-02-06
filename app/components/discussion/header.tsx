import { Button } from "~/../@/components/ui/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
    // Carrega os provedores e modelos
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
    <div className="border-b border-[#1C1C1F] p-4 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[#18181B] bg-transparent lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5 text-[#A1A1AA]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="bg-transparent hover:bg-[#18181B] text-[#E2E2E2] gap-2 flex items-center"
            >
              {selectedProvider} - {currentModel?.name || "Selecione um modelo"}
              <ChevronDown className="h-4 w-4 text-[#A1A1AA]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[300px] bg-[#18181B] border border-[#1C1C1F] text-[#E2E2E2] rounded-lg shadow-lg"
          >
            {providers.map((provider) => (
              <DropdownMenuSub key={provider.name}>
                <DropdownMenuSubTrigger
                  className={`
                    flex items-center gap-2 cursor-pointer px-3 py-2 text-sm
                    ${provider.name === selectedProvider ? 'bg-[#27272A]' : 'hover:bg-[#27272A]'}
                    transition-colors duration-150 ease-in-out
                  `}
                >
                  {provider.icon && (
                    <img 
                      src={provider.icon} 
                      alt={provider.name} 
                      className="w-4 h-4"
                    />
                  )}
                  <span>{provider.name}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  className="min-w-[200px] bg-[#18181B] border border-[#1C1C1F] text-[#E2E2E2] rounded-lg shadow-lg"
                >
                  {provider.staticModels.map((model) => (
                    <DropdownMenuItem
                      key={model.name}
                      className={`
                        flex items-center gap-2 cursor-pointer px-3 py-2 text-sm
                        ${model.name === selectedModel ? 'bg-[#27272A]' : 'hover:bg-[#27272A]'}
                        transition-colors duration-150 ease-in-out
                      `}
                      onClick={() => {
                        onSelectProvider?.(provider.name);
                        onSelectModel(model.name);
                      }}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="text-sm">{model.label}</span>
                        <span className="text-xs text-[#A1A1AA]">
                          Max tokens: {model.maxTokenAllowed.toLocaleString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center">
        {/* Área para botões adicionais no futuro */}
      </div>
    </div>
  );
}
