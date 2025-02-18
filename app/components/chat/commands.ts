import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ImageContext {
  type: 'image_context';
  url: string;
  filename: string;
  timestamp: string;
  size: number;
}

export interface ChatCommand {
  description: string;
  handler: (params: CommandParams) => Promise<string[] | string | void>;
}

interface CommandParams {
  supabase: SupabaseClient;
  setImageContexts?: (contexts: string[]) => void;
  handleInputChange?: (value: string) => void;
}

export const CHAT_COMMANDS: Record<string, ChatCommand> = {
  '/addfiles': {
    description: 'Fazer upload de arquivos para o Supabase',
    handler: async ({ supabase, setImageContexts }: CommandParams): Promise<void> => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      
      return new Promise((resolve) => {
        input.onchange = async (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          const contexts: string[] = [];
          
          for (const file of files) {
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
              const filePath = `project-images/${fileName}`;

              const { data, error } = await supabase.storage
                .from('components-previews')
                .upload(filePath, file);

              if (error) throw error;

              const { data: { publicUrl } } = supabase.storage
                .from('components-previews')
                .getPublicUrl(filePath);

              // Cria o contexto da imagem
              const imageContext: ImageContext = {
                type: 'image_context',
                url: publicUrl,
                filename: fileName,
                timestamp: new Date().toISOString(),
                size: file.size
              };
              
              contexts.push(JSON.stringify(imageContext));
              
            } catch (error) {
              console.error('Erro ao fazer upload:', error);
              toast.error(`Erro ao fazer upload de ${file.name}`);
            }
          }
          
          if (contexts.length > 0) {
            setImageContexts?.(contexts);
            toast.success(`${contexts.length} arquivo(s) enviado(s) com sucesso!`);
          }
          
          resolve();
        };
        input.click();
      });
    }
  },
  '/help': {
    description: 'Mostra a lista de comandos disponíveis',
    handler: async (): Promise<string> => {
      return Object.entries(CHAT_COMMANDS)
        .map(([cmd, info]) => `${cmd} - ${info.description}`)
        .join('\n');
    }
  }
};