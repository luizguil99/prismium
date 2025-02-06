import { Button } from "~/../@/components/ui/ui/button";
import { classNames } from "~/utils/classNames";
import { Menu, MessageSquare, Clock, Star, Settings, ExternalLink } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

const recentChats = [
  { id: 1, title: "Discussão sobre React", icon: MessageSquare },
  { id: 2, title: "Ajuda com TypeScript", icon: MessageSquare },
  { id: 3, title: "Dúvidas de CSS", icon: MessageSquare },
];

export function Sidebar({ isOpen, onToggle, onNewChat }: SidebarProps) {
  return (
    <>
      {/* Header Mobile */}
      <div className="border-b border-[#1C1C1F] p-4 flex items-center bg-[#101012] lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[#18181B] bg-transparent"
          onClick={onToggle}
        >
          <Menu className="h-5 w-5 text-[#A1A1AA]" />
        </Button>
        <h1 className="ml-4 font-semibold text-[#E2E2E2]">Chat</h1>
      </div>

      {/* Sidebar */}
      <div
        className={classNames(
          "w-64 border-r border-[#1C1C1F] bg-[#101012] transition-all duration-300 flex flex-col",
          "fixed top-0 bottom-0 left-0 z-40 lg:static",
          { "-translate-x-full lg:translate-x-0": !isOpen }
        )}
      >
        <div className="p-4 flex flex-col flex-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-[#18181B] hover:text-[#E2E2E2] mb-4 bg-[#18181B]/40"
            onClick={onNewChat}
          >
            <span>Nova Conversa</span>
          </Button>

          {/* Chats Recentes */}
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-[#A1A1AA] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#A1A1AA]" />
              Recentes
            </div>
            {recentChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-2 text-[#A1A1AA] hover:bg-[#18181B] h-auto rounded-lg bg-transparent"
              >
                <chat.icon className="h-4 w-4 text-[#A1A1AA]" />
                <span className="truncate text-sm">{chat.title}</span>
              </Button>
            ))}
          </div>

          {/* Favoritos */}
          <div className="mt-4 space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-[#A1A1AA] flex items-center gap-2">
              <Star className="h-4 w-4 text-[#A1A1AA]" />
              Favoritos
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-2 text-[#A1A1AA] hover:bg-[#18181B] h-auto rounded-lg bg-transparent"
            >
              <MessageSquare className="h-4 w-4 text-[#A1A1AA]" />
              <span className="truncate text-sm">Chat Importante</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-auto space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-[#A1A1AA] hover:bg-[#18181B] rounded-lg bg-transparent"
            >
              <Settings className="h-4 w-4 text-[#A1A1AA]" />
              <span>Configurações</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-[#A1A1AA] hover:bg-[#18181B] rounded-lg bg-transparent"
            >
              <ExternalLink className="h-4 w-4 text-[#A1A1AA]" />
              <span>Updates</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
