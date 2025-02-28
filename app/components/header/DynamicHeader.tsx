import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { useAuth } from '~/components/supabase/auth-context';
import { NewHeader } from '~/components/header/NewHeader';
import { NotSignedHeader } from '~/components/header/NotSignedHeader';

interface DynamicHeaderProps {
  chatStarted: boolean;
}

export const DynamicHeader = ({ chatStarted }: DynamicHeaderProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Pequeno atraso para suavizar a transição
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // Se o usuário estiver logado e o chat não iniciado, não renderizamos o conteúdo do header
  // mas ainda retornamos um elemento vazio para manter o layout
  if (user && !chatStarted) {
    return <div className="h-0 overflow-hidden"></div>;
  }

  return (
    <div 
      className="transition-opacity duration-300" 
      style={{ opacity: isMounted ? 1 : 0 }}
    >
      <ClientOnly>
        {() => {
          if (chatStarted) {
            return (
              <div className="w-full z-30">
                <NewHeader />
              </div>
            );
          } else if (!user) {
            return (
              <div className="w-full z-30">
                <NotSignedHeader />
              </div>
            );
          }
          
          return null;
        }}
      </ClientOnly>
    </div>
  );
}; 