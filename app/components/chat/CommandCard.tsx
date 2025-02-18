import React from 'react';
import { CHAT_COMMANDS } from './ChatCommands';

interface CommandCardProps {
  onSelect: (command: string) => void;
  isVisible: boolean;
}

export const CommandCard: React.FC<CommandCardProps> = ({ onSelect, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 w-80 bg-[#1E1E1E] border border-zinc-800 rounded-lg shadow-lg overflow-hidden z-10">
      <div className="py-1">
        <div className="text-xs text-gray-500 px-2 pb-1 border-b border-zinc-800">Commands</div>
        <div>
          {Object.entries(CHAT_COMMANDS).map(([command, info]) => (
            <button
              key={command}
              className="w-full px-2 py-1.5 text-left bg-transparent hover:bg-zinc-800/50 transition-colors duration-200 flex items-center gap-2 text-sm"
              onClick={() => onSelect(command)}
            >
              <span className="text-blue-500 font-medium">{command}</span>
              <span className="text-gray-400">{info.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};