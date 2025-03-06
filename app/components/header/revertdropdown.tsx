import React, { useState, useEffect } from 'react';
import { GitBranch, ChevronDown } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from '@remix-run/react';
import { getMessages, openDatabase } from '~/lib/persistence/db';
import type { Message } from 'ai';

interface RevertDropdownProps {
  className?: string;
}

export function RevertDropdown({ className }: RevertDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const chatId = params.id;
  const currentRewindId = searchParams.get('rewindTo');

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      
      try {
        const db = await openDatabase();
        const chatData = await getMessages(db, chatId);
        setMessages(chatData.messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleRevert = (messageId: string) => {
    if (!chatId) return;
    
    window.location.href = `/chat/${chatId}?rewindTo=${messageId}`;
    setIsOpen(false);
  };

  // Filter user and assistant messages (exclude system messages)
  const filteredMessages = messages.filter(
    msg => msg.role === 'user' || msg.role === 'assistant'
  );

  // Get current message based on rewindTo parameter
  const getCurrentMessageIndex = () => {
    if (!currentRewindId) return filteredMessages.length;
    
    const index = filteredMessages.findIndex(msg => msg.id === currentRewindId);
    return index !== -1 ? index + 1 : filteredMessages.length;
  };

  const currentIndex = getCurrentMessageIndex();

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <GitBranch size={14} />
        <span>{currentIndex < filteredMessages.length ? `main@${currentIndex}` : 'main'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 origin-top-left rounded-xl bg-transparent shadow-2xl">
          <div className="p-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl backdrop-blur-sm">
            <div className="text-sm font-medium px-3 py-2 text-accent-500 flex items-center gap-2">
              <div className="i-ph:git-branch" />
              <span>Version History</span>
            </div>
            
            <div className="mt-1 max-h-80 overflow-y-auto">
              {filteredMessages.map((message, index) => (
                <button
                  key={message.id}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-bolt-elements-textPrimary focus:outline-none focus:ring-0 ${
                    currentRewindId === message.id ? 'bg-accent-500/10 text-accent-500' : ''
                  }`}
                  onClick={() => handleRevert(message.id)}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {message.role === 'user' 
                      ? <div className="i-ph:user-circle" /> 
                      : <div className="i-ph:robot" />}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                    <span className="text-xs text-bolt-elements-textTertiary truncate">
                      {typeof message.content === 'string' 
                        ? message.content.substring(0, 25) + (message.content.length > 25 ? '...' : '') 
                        : 'Complex message'}
                    </span>
                  </div>
                  <span className="text-xs text-bolt-elements-textTertiary font-mono">@{index + 1}</span>
                </button>
              ))}
              
              {filteredMessages.length === 0 && (
                <div className="px-4 py-2 text-sm text-bolt-elements-textTertiary">No messages found</div>
              )}
            </div>
            
            {currentRewindId && (
              <div className="border-t border-bolt-elements-borderColor pt-2 mt-2">
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md bg-transparent hover:bg-bolt-elements-background-depth-1 hover:scale-[1.02] transition-all text-accent-500 focus:outline-none focus:ring-0"
                  onClick={() => {
                    window.location.href = `/chat/${chatId}`;
                    setIsOpen(false);
                  }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="i-ph:arrow-clockwise" />
                  </div>
                  <span className="text-sm font-medium">Reset to latest</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
