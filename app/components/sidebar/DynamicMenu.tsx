import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { useAuth } from '~/components/supabase/auth-context';
import { Menu } from './Menu.client';

interface DynamicMenuProps {
  chatStarted?: boolean;
}

export const DynamicMenu = ({ chatStarted = false }: DynamicMenuProps) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeno atraso para garantir que o estado de autenticação esteja carregado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Se o componente não está pronto ou o usuário não está autenticado e o chat não está iniciado
  // não renderizamos o menu
  if (!isReady || (!user && !chatStarted)) {
    return null;
  }

  return (
    <ClientOnly>
      {() => <Menu />}
    </ClientOnly>
  );
}; 