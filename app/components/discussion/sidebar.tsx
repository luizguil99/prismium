import { Button } from "~/../@/components/ui/ui/button";
import { classNames } from "~/utils/classNames";
import { Menu, MessageSquare, Clock, Star, Settings, ExternalLink, Plus, Bot } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

const recentChats = [
  { id: 1, title: "React Discussion", icon: MessageSquare },
  { id: 2, title: "TypeScript Help", icon: MessageSquare },
  { id: 3, title: "CSS Questions", icon: MessageSquare },
];

export function Sidebar({ isOpen, onToggle, onNewChat }: SidebarProps) {
  return (
    <>
      {/* Header Mobile */}
      <div className="border-b border-zinc-800/50 p-4 flex items-center bg-[#101012] lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-zinc-800/50 bg-transparent"
          onClick={onToggle}
        >
          <Menu className="h-5 w-5 text-zinc-400" />
        </Button>
        <div className="ml-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <h1 className="font-semibold text-zinc-200">Prismium AI</h1>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={classNames(
          "w-72 border-r border-zinc-800/50 bg-[#101012] transition-all duration-300 flex flex-col",
          "fixed top-0 bottom-0 left-0 z-40 lg:static",
          { "-translate-x-full lg:translate-x-0": !isOpen }
        )}
      >
        <div className="p-4 flex flex-col flex-1">
          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center gap-2 mb-6 px-2">
            <Bot className="h-6 w-6 text-blue-500" />
            <h1 className="font-semibold text-lg text-zinc-200">Prismium AI</h1>
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 hover:bg-blue-500/10 hover:text-blue-500 mb-4 bg-zinc-800/30 text-zinc-300 group transition-all duration-200"
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4 transition-all duration-200 group-hover:rotate-90" />
            <span>New Chat</span>
          </Button>

          {/* Recent Chats */}
          <div className="space-y-1">
            <div className="px-2 py-2 text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Recent Chats
            </div>
            {recentChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-2.5 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 h-auto rounded-lg bg-transparent group transition-colors"
              >
                <chat.icon className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
                <span className="truncate text-sm">{chat.title}</span>
              </Button>
            ))}
          </div>

          {/* Favorites */}
          <div className="mt-6 space-y-1">
            <div className="px-2 py-2 text-xs font-medium text-zinc-500 flex items-center gap-2">
              <Star className="h-3.5 w-3.5" />
              Favorite Chats
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 py-2.5 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 h-auto rounded-lg bg-transparent group transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
              <span className="truncate text-sm">Important Chat</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-auto space-y-1 pt-4 border-t border-zinc-800/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 rounded-lg bg-transparent group transition-colors"
            >
              <Settings className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
              <span className="text-sm">Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 rounded-lg bg-transparent group transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
              <span className="text-sm">Updates</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
