import { useState, useEffect } from 'react';
import { useAuth } from '~/components/supabase/auth-context';
import { classNames } from '~/utils/classNames';

export const SidebarIcon = () => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir que o estado de autenticação esteja carregado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (user && typeof window !== 'undefined' && (window as any).__sidebarControl) {
      (window as any).__sidebarControl.openMenu();
    }
  };

  return (
    <div 
      className={classNames(
        "i-ph:sidebar-simple-duotone absolute top-4 left-4 text-xl text-bolt-elements-textPrimary transition-colors duration-200 z-50",
        {
          "hover:text-blue-500 cursor-pointer": user,
          "opacity-50 cursor-default": !user && isReady
        }
      )}
      onClick={handleClick}
      title={user ? "Abrir menu" : "Faça login para acessar o menu"}
    />
  );
}; 