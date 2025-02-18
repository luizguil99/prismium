import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';

interface ChatCommand {
  description: string;
  handler: (supabase?: any) => Promise<string[] | string | void>;
}

export const CHAT_COMMANDS: Record<string, ChatCommand> = {
  '/addfiles': {
    description: 'Fazer upload de arquivos para o Supabase',
    handler: async (supabase: any): Promise<string[]> => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      
      return new Promise((resolve) => {
        input.onchange = async (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          const uploadedUrls: string[] = [];
          
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

              uploadedUrls.push(publicUrl);
              
            } catch (error) {
              console.error('Erro ao fazer upload:', error);
              toast.error(`Erro ao fazer upload de ${file.name}`);
            }
          }
          
          if (uploadedUrls.length > 0) {
            toast.success(`${uploadedUrls.length} arquivo(s) enviado(s) com sucesso!`);
          }
          
          resolve(uploadedUrls);
        };
        input.click();
      });
    }
  },
  '/help': {
    description: 'Mostra a lista de comandos disponíveis',
    handler: async (): Promise<string> => {
      return Object.entries(CHAT_COMMANDS).map(([cmd, info]) => 
        `${cmd} - ${info.description}`
      ).join('\n');
    }
  }
};

interface ChatCommandsHandlerProps {
  input: string;
  handleSendMessage: (event: React.UIEvent, message?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const handleChatCommand = async (
  command: string,
  props: ChatCommandsHandlerProps
): Promise<boolean> => {
  const [cmd] = command.split(' ');
  const chatCommand = CHAT_COMMANDS[cmd as keyof typeof CHAT_COMMANDS];

  if (chatCommand) {
    try {
      if (cmd === '/addfiles') {
        const supabase = getOrCreateClient();
        const urls = await chatCommand.handler(supabase);
        
        if (urls && Array.isArray(urls) && urls.length > 0) {
          // Envia as URLs como mensagem
          const syntheticEvent = {
            type: 'synthetic',
            bubbles: true
          } as React.UIEvent;
          props.handleSendMessage(syntheticEvent, urls.join('\n'));
        }
      } else {
        const result = await chatCommand.handler();
        if (result) {
          const syntheticEvent = {
            type: 'synthetic',
            bubbles: true
          } as React.UIEvent;
          props.handleSendMessage(syntheticEvent, result.toString());
        }
      }
      
      // Limpa o input após executar o comando
      if (props.handleInputChange) {
        const syntheticEvent = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        props.handleInputChange(syntheticEvent);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      toast.error('Erro ao executar comando');
    }
  }
  
  return false;
}; 