import React from 'react';
import { useAuth } from '~/components/supabase/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/ui/dialog';
import { Button } from '@/components/ui/ui/button';
import { Link } from '@remix-run/react';

// Lista de exemplos de prompts para o usuário
const EXAMPLE_PROMPTS = [
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI' },
  { text: 'Make a space invaders game' },
  { text: 'Make a Tic Tac Toe game in html, css and js only' },
];

export interface ExamplePromptsProps {
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

export function ExamplePrompts({ sendMessage }: ExamplePromptsProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  // Login Modal Component
  const LoginModal = () => (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="bg-[#09090B]/95 border border-zinc-800 text-zinc-100 shadow-2xl [&>button]:text-white [&>button]:bg-transparent [&>button]:border-0 [&>button]:hover:bg-[#09090B] [&>button]:transition-colors [&>button]:p-1.5">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="text-lg font-semibold text-zinc-100">Authentication Required</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 text-center">
          <div className="flex justify-center">
            <div className="i-ph:lock-key text-5xl text-blue-500 mb-4" />
          </div>
          <h3 className="text-xl font-medium text-white">Sign in to use the chat</h3>
          <p className="text-zinc-400">
            You need to be authenticated to send messages and interact with our AI assistant.
          </p>
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4 flex justify-center">
          <Link
            to="/login"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
          >
            Sign in or Register
          </Link>
          <Button
            variant="outline"
            onClick={() => setShowLoginModal(false)}
            className="ml-2 bg-[#09090B] hover:bg-[#09090B] text-zinc-100 border-zinc-800"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const handleExampleClick = (event: React.UIEvent, text: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    sendMessage?.(event, text);
  };

  return (
    <div id="examples" className="relative flex flex-col gap-4 w-full max-w-3xl mx-auto mt-6">
      <LoginModal />
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => handleExampleClick(event, examplePrompt.text)}
              className="border border-white/10 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
