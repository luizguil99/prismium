import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Templates disponíveis com projetos reais e úteis
const templates = [
  {
    id: 1,
    title: 'Shadcn + JavaScript',
    description: 'Template completo com Vite, Tailwind e Shadcn UI',
    repo: 'https://github.com/luizguil99/Shadcn-js-template',
    tags: ['Next.js', 'Tailwind', 'TypeScript'],
  },
  {
    id: 2,
    title: 'Shadcn + TypeScript',
    description: 'Template completo com Vite, Tailwind e Shadcn UI em TypeScript',
    repo: 'https://github.com/shadcn-ui/ui',
    tags: ['Vite', 'React', 'Tailwind', 'TypeScript'],
  }
];

interface ConditionalChatProps {
  message: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ConditionalChat: React.FC<ConditionalChatProps> = ({ message, importChat }) => {
  const { ready, gitClone } = useGit();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTemplateClone = async (message: string) => {
    if (!ready || isProcessing) {
      toast.error('Sistema Git não está pronto ou já está processando');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Identificar o template baseado na mensagem
      const lowerMessage = message.toLowerCase();
      const isTypeScript = lowerMessage.includes('typescript') || lowerMessage.includes('ts');
      const template = templates.find(t => isTypeScript ? t.id === 2 : t.id === 1);

      if (!template) {
        toast.error('Template não encontrado');
        return;
      }

      // Clonar o repositório
      const { workdir, data } = await gitClone(template.repo);

      if (importChat) {
        const textDecoder = new TextDecoder('utf-8');
        const filePaths = Object.keys(data);

        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content:
                encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);

        // Detectar comandos do projeto
        const commands = await detectProjectCommands(fileContents);
        const commandsMessage = createCommandsMessage(commands);

        // Criar mensagem com os arquivos
        const filesMessage: Message = {
          role: 'assistant',
          content: `Template ${template.title} clonado com sucesso em ${workdir}! 
          
Agora vou ajudar você a criar o card que deseja usando ${isTypeScript ? 'TypeScript' : 'JavaScript'} com Shadcn UI.

<boltArtifact id="imported-files" title="Template Files" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
          id: generateId(),
          createdAt: new Date(),
        };

        const messages = [filesMessage];
        if (commandsMessage) {
          messages.push(commandsMessage);
        }

        await importChat(`Template: ${template.title}`, messages);
        toast.success('Template clonado com sucesso! Agora vou ajudar você a criar o card.');
      }
    } catch (error) {
      console.error('Erro ao clonar template:', error);
      toast.error('Erro ao clonar template');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (message && (message.toLowerCase().includes('fazer') || message.toLowerCase().includes('criar'))) {
      handleTemplateClone(message);
    }
  }, [message]);

  return null;
};

export default ConditionalChat;
