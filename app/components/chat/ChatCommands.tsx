import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/ui/dialog';
import React, { useState, useEffect } from 'react';
import { webcontainer } from '~/lib/webcontainer';
import type { WebContainer } from '@webcontainer/api';

// Declaração global para a variável de callback
declare global {
  var fileExplorerSelectCallback: ((file: string) => void) | null;
  var fileExplorerOpenState: boolean;
  interface Window {
    selectedContextFiles?: string[];
  }
}

// Função para obter recursivamente todos os arquivos do WebContainer
const getAllFiles = async (container: WebContainer, dir: string): Promise<Record<string, string>> => {
  try {
    const files: Record<string, string> = {};
    
    // Função recursiva para navegar pelos diretórios
    const processDirectory = async (dirPath: string) => {
      try {
        const dirEntries = await container.fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of dirEntries) {
          const fullPath = `${dirPath}/${entry.name}`;
          
          if (entry.isDirectory()) {
            // Ignora node_modules e .git
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
              await processDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            try {
              // Lê o conteúdo do arquivo
              const content = await container.fs.readFile(fullPath, 'utf-8');
              files[fullPath] = content;
            } catch (error) {
              console.error(`Erro ao ler arquivo ${fullPath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao ler diretório ${dirPath}:`, error);
      }
    };
    
    await processDirectory(dir);
    return files;
  } catch (error) {
    console.error('Erro ao obter arquivos:', error);
    throw error;
  }
};

interface ChatCommand {
  description: string;
  handler: (supabase?: any) => Promise<string[] | string | void | { files: string[], event: string }>;
}

// Interface para os itens retornados pela API
interface FileSystemItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
}

// Componente para o explorador de arquivos
export const FileExplorer = ({ 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (file: string) => void;
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen) {
      loadItems('');
    }
  }, [isOpen]);
  
  const loadItems = async (path: string) => {
    setLoading(true);
    try {
      // Usamos a API fetch para obter arquivos e pastas
      const response = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Falha ao carregar arquivos');
      
      const data = await response.json() as { items: FileSystemItem[] };
      setItems(data.items);
      setCurrentPath(path);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Não foi possível carregar os arquivos');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-[#09090B]/95 border border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Files and Folders</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-80 overflow-y-auto py-2">
          {currentPath && (
            <div 
              className="flex items-center gap-1 mb-2 p-2 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors"
              onClick={() => loadItems(currentPath.split('/').slice(0, -1).join('/'))}
            >
              <div className="i-ph:arrow-left text-zinc-400" />
              <span>Go back</span>
            </div>
          )}
          
          {loading ? (
            <div className="py-4 flex justify-center">
              <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-xl animate-spin" />
            </div>
          ) : (
            items.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 hover:bg-zinc-800/50 rounded-md cursor-pointer transition-colors"
                onClick={() => {
                  if (item.type === 'directory') {
                    loadItems(`${currentPath}${currentPath ? '/' : ''}${item.name}`);
                  } else {
                    onSelect(`${currentPath}${currentPath ? '/' : ''}${item.name}`);
                    onClose();
                  }
                }}
              >
                <div className={item.type === 'directory' ? "i-ph:folder text-yellow-500" : "i-ph:file-text text-blue-500"} />
                <span>{item.name}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Função para abrir o explorador de arquivos
const openFileExplorer = (callback: (file: string) => void): void => {
  globalThis.fileExplorerOpenState = true;
  globalThis.fileExplorerSelectCallback = callback;
  
  // Forçar atualização da UI
  const event = new CustomEvent('fileexplorer:open');
  window.dispatchEvent(event);
};

// Função para fechar o explorador de arquivos
const closeFileExplorer = (): void => {
  globalThis.fileExplorerOpenState = false;
  
  // Forçar atualização da UI
  const event = new CustomEvent('fileexplorer:close');
  window.dispatchEvent(event);
};

// Função para adicionar arquivos ao contexto
const addFilesToContext = (fileList: string[]): string => {
  if (typeof window !== 'undefined') {
    // Inicializa a lista se não existir
    if (!window.selectedContextFiles) {
      window.selectedContextFiles = [];
    }
    
    // Limpa a lista existente e adiciona os novos arquivos
    window.selectedContextFiles = [];
    
    // Adicionar os arquivos à lista
    for (const file of fileList) {
      window.selectedContextFiles.push(file);
    }
    
    // Armazena em localStorage para persistência
    localStorage.setItem('selectedContextFiles', JSON.stringify(window.selectedContextFiles));
  }
  
  return `Added all ${fileList.length} files to context. Files include:\n${fileList.slice(0, 10).map(f => `- ${f}`).join('\n')}${fileList.length > 10 ? `\n... and ${fileList.length - 10} more files` : ''}`;
};

export const CHAT_COMMANDS: Record<string, ChatCommand> = {
  '@allfiles': {
    description: 'Get all files from the WebContainer workspace for AI context',
    handler: async (): Promise<{ files: string[], event: string }> => {
      try {
        const container = await webcontainer;
        const files = await getAllFiles(container, '/');
        
        // Formatar a lista de arquivos para exibição
        const fileList = Object.keys(files);
        
        // Retornar a lista de arquivos e o tipo de evento
        return { 
          files: fileList,
          event: 'showFilesInCommand'
        };
        
      } catch (error) {
        console.error('Erro ao obter arquivos do WebContainer:', error);
        toast.error('Erro ao obter arquivos do WebContainer');
        throw error;
      }
    }
  },
  '@addfiles': {
    description: 'Upload files to Supabase',
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
  '@help': {
    description: 'Show available commands',
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
  // Verifica se há algum token que começa com @
  const tokens = command.split(' ');
  const commandToken = tokens.find(token => token.startsWith('@'));
  
  if (!commandToken) return false;
  
  const chatCommand = CHAT_COMMANDS[commandToken as keyof typeof CHAT_COMMANDS];

  if (chatCommand) {
    try {
      if (commandToken === '@addfiles') {
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
      } else if (commandToken === '@allfiles') {
        // Para o comando @allfiles digitado, emitimos o evento que será capturado pelo CommandCard
        const result = await chatCommand.handler() as { files: string[], event: string };
        
        if (result && result.files) {
          // Emite evento para mostrar os arquivos no card de comandos
          const filesEvent = new CustomEvent(result.event, { 
            detail: { 
              files: result.files,
              onConfirm: () => {
                // Adiciona os arquivos ao contexto quando o usuário confirmar
                const message = addFilesToContext(result.files);
                
                // Envia a mensagem para o chat
                const syntheticEvent = {
                  type: 'synthetic',
                  bubbles: true
                } as React.UIEvent;
                props.handleSendMessage(syntheticEvent, message);
              }
            } 
          });
          window.dispatchEvent(filesEvent);
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