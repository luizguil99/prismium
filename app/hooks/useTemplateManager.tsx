import { useState } from 'react';
import type { Message } from 'ai';
import { useGit } from '~/lib/hooks/useGit';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { toast } from 'react-toastify';
import ignore from 'ignore';
import { templates } from '~/utils/templates';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

export function useTemplateManager() {
  const { ready, gitClone } = useGit();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Função para processar o prompt e clonar o template
  const handlePromptAndClone = async (
    prompt: string,
    importChat?: (description: string, messages: Message[]) => Promise<void>,
  ) => {
    if (!ready) {
      toast.error('Sistema Git não está pronto');
      return false;
    }

    // Sempre usa o template Shadcn + JavaScript
    const selectedTemplate = templates[0];
    setLoadingId(selectedTemplate.id);

    try {
      const { workdir, data } = await gitClone(selectedTemplate.repo);

      if (importChat) {
        const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
        const textDecoder = new TextDecoder('utf-8');

        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);

        const commands = await detectProjectCommands(fileContents);
        const commandsMessage = createCommandsMessage(commands);

        // Mensagem do sistema sobre o setup
        const setupMessage: Message = {
          role: 'assistant',
          content: `Configurando o template ${selectedTemplate.title}...
<boltArtifact id="imported-files" title="Arquivos do Template" type="bundled">
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

        // Importa a mensagem de setup
        await importChat(`Setup: ${selectedTemplate.title}`, [setupMessage, commandsMessage].filter(Boolean));

        // Aguarda um momento para garantir que o setup foi processado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Inicia uma nova conversa para desenvolvimento
        const readyMessage: Message = {
          role: 'assistant',
          content: 'Template configurado com sucesso! Como posso ajudar com o desenvolvimento do card usando Shadcn UI?',
          id: generateId(),
          createdAt: new Date(),
        };

        await importChat(`Desenvolvimento: ${selectedTemplate.title}`, [readyMessage]);
        return true;
      }
    } catch (error) {
      console.error('Erro durante a importação:', error);
      toast.error('Falha ao importar o repositório');
    } finally {
      setLoadingId(null);
    }

    return false;
  };

  return {
    handlePromptAndClone,
    loadingId,
  };
}
