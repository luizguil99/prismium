import { atom } from 'nanostores';
import { toast } from 'react-toastify';
import { createClient } from '@supabase/supabase-js';

// Usando any para evitar problemas de tipagem específica
type SupabaseClient = any;

interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  secretKey?: string;
  projectRef?: string;
}

// Estado para armazenar informações do Supabase
export const supabaseStore = {
  config: atom<SupabaseConfig | null>(null),
  isConnected: atom<boolean>(false),
  firstMessageSent: atom<boolean>(false),
  client: atom<SupabaseClient | null>(null),

  // Armazenar configuração do Supabase
  async connectToSupabase(projectUrl: string, anonKey: string, secretKey?: string) {
    try {
      // Cria o cliente Supabase
      const client = createClient(projectUrl, anonKey);
      
      // Testa a conexão tentando fazer uma query simples
      const { error } = await client.auth.getSession();
      
      if (error) throw error;

      // Salva as configurações
      this.config.set({ projectUrl, anonKey, secretKey });
      this.client.set(client);
      this.isConnected.set(true);
      this.firstMessageSent.set(false);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      this.disconnect();
      return { success: false, error };
    }
  },

  // Desconectar do Supabase
  disconnect() {
    this.config.set(null);
    this.client.set(null);
    this.isConnected.set(false);
    this.firstMessageSent.set(false);
  },

  // Obter cliente Supabase
  getClient() {
    return this.client.get();
  },

  // Verificar se está conectado
  isSupabaseConnected() {
    return this.isConnected.get();
  },

  // Obter metadados do projeto
  async getProjectMetadata() {
    const client = this.getClient();
    if (!client) {
      throw new Error('Não conectado ao Supabase');
    }

    try {
      // Busca tabelas do schema public
      const { data: tables } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      // Busca funções do schema public
      const { data: functions } = await client
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public');

      return {
        tables: tables?.map((t: { table_name: string }) => t.table_name) || [],
        functions: functions?.map((f: { routine_name: string }) => f.routine_name) || []
      };
    } catch (error) {
      console.error('Erro ao obter metadados:', error);
      throw error;
    }
  },

  // Obter contexto para a IA
  getAIContext(): string {
    const config = this.config.get();
    if (!config) return '';

    return `
// Configuração do Supabase
const supabaseUrl = "${config.projectUrl}"
const supabaseKey = "${config.anonKey}"
${config.secretKey ? `const supabaseSecretKey = "${config.secretKey}"` : ''}

// Instruções para a IA:
1. Use @supabase/supabase-js para integração
2. Inicialize o cliente Supabase no início da aplicação
3. Utilize as funções do cliente para operações no banco
4. Mantenha a segurança das credenciais

// Exemplo de uso:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseUrl, supabaseKey)
${config.secretKey ? `
// Para operações administrativas (use com cuidado):
const adminSupabase = createClient(supabaseUrl, supabaseSecretKey)` : ''}

// Operações comuns:
const { data, error } = await supabase
  .from('sua_tabela')
  .select('*')

// Funções disponíveis:
- getClient(): Obtém o cliente Supabase configurado
- getProjectMetadata(): Obtém metadados do projeto (tabelas e funções)
- isSupabaseConnected(): Verifica se está conectado
`;
  },

  // Verificar se tem permissões necessárias
  async checkPermissions() {
    const client = this.getClient();
    if (!client) return false;

    try {
      // Tenta acessar algumas funcionalidades básicas para verificar permissões
      const { error: tablesError } = await client
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (tablesError) throw tablesError;

      return true;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }
};
