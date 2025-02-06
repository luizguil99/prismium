import { Button } from "~/../@/components/ui/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/../@/components/ui/ui/dropdown-menu";

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const models = [
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];

export function Header({ onToggleSidebar, selectedModel, onSelectModel }: HeaderProps) {
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

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
              {currentModel.name}
              <ChevronDown className="h-4 w-4 text-[#A1A1AA]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[200px] bg-[#18181B] border border-[#1C1C1F] text-[#E2E2E2] rounded-lg shadow-lg"
          >
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                className={`
                  flex items-center gap-2 cursor-pointer px-3 py-2 text-sm
                  ${model.id === selectedModel ? 'bg-[#27272A]' : 'hover:bg-[#27272A]'}
                  transition-colors duration-150 ease-in-out
                `}
                onClick={() => onSelectModel(model.id)}
              >
                <div className="flex flex-col flex-1">
                  <span className="text-sm">{model.name}</span>
                  {model.id === selectedModel && (
                    <span className="text-xs text-[#A1A1AA]">Modelo atual</span>
                  )}
                </div>
              </DropdownMenuItem>
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
