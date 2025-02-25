// Arquivo vazio para resolver erros de importação
// Este arquivo substitui a funcionalidade do Supabase que foi removida

import { atom } from 'nanostores';

// Store vazio para compatibilidade
export const supabaseStore = {
  isConnected: atom(false),
  firstMessageSent: atom(false),
  getAIContext: () => '',
  getClient: () => null,
  connectToSupabase: () => {},
  disconnect: () => {}
};
