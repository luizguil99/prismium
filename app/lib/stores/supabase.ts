import { atom } from 'nanostores';
import { toast } from 'react-toastify';

interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
}

// Estado para armazenar informações do Supabase
export const supabaseStore = {
  config: atom<SupabaseConfig | null>(null),
  isConnected: atom<boolean>(false),
  firstMessageSent: atom<boolean>(false), // Controla se a primeira mensagem já foi enviada

  // Armazenar configuração do Supabase
  async connectToSupabase(projectUrl: string, anonKey: string) {
    try {
      this.config.set({ projectUrl, anonKey });
      this.isConnected.set(true);
      this.firstMessageSent.set(false); // Reseta quando conecta
      toast.success('Configuração do Supabase salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração do Supabase:', error);
      toast.error('Erro ao salvar configuração do Supabase.');
      this.config.set(null);
      this.isConnected.set(false);
      this.firstMessageSent.set(false);
    }
  },

  // Desconectar do Supabase
  disconnect() {
    this.config.set(null);
    this.isConnected.set(false);
    this.firstMessageSent.set(false);
    toast.info('Configuração do Supabase removida');
  },

  // Obter contexto para a IA
  getAIContext(): string {
    const config = this.config.get();
    if (!config) return '';

    return `
// Configuração do Supabase
const supabaseUrl = "${config.projectUrl}"
const supabaseKey = "${config.anonKey}"

// Instruções para a IA:
1. Use @supabase/supabase-js para integração
2. Inicialize o cliente Supabase no início da aplicação
3. Use as funções do Supabase para auth, database, storage conforme necessário
4. Mantenha as boas práticas de segurança ao usar o Supabase
`;
  },
};
