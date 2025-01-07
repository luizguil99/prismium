import { useState, useEffect } from 'react';
import type { Message } from 'ai';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGit } from '~/lib/hooks/useGit';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { templates, type Template } from '~/config/templates';
import { BaseChat } from './BaseChat';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="flex flex-col gap-2 rounded-lg border p-4 hover:border-gray-400 hover:bg-gray-50"
    >
      <h3 className="text-lg font-semibold">{template.title}</h3>
      <p className="text-sm text-gray-600">{template.description}</p>
      <div className="flex flex-wrap gap-2">
        {template.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

interface ConditionalChatProps {
  message: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  isTypeScript: boolean;
  onSelect?: (template: Template) => void;
  onBack?: () => void;
}

export default function ConditionalChat({ message, importChat, isTypeScript, onSelect, onBack }: ConditionalChatProps) {
  const { ready, gitClone } = useGit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = templates.filter((t) => (isTypeScript ? t.id === 2 : t.id === 1));

  const handleTemplateClone = async (_message: string) => {
    if (!ready || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const template = templates.find((t) => (isTypeScript ? t.id === 2 : t.id === 1));

      if (!template) {
        toast.error('Template não encontrado');
        return;
      }

      const { workdir, data } = await gitClone(template.repo);

      if (importChat) {
        const filePaths = Object.keys(data);
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

        const filesMessage: Message = {
          role: 'assistant',
          content: `Cloning the repo ${template.repo} into ${workdir}
<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
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

        await importChat(`Git Project: ${template.title}`, messages);
      }
    } catch (error) {
      console.error('Erro ao clonar template:', error);
      toast.error('Erro ao clonar template');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    onSelect?.(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    onBack?.();
  };

  useEffect(() => {
    if (message && (message.toLowerCase().includes('fazer') || message.toLowerCase().includes('criar'))) {
      handleTemplateClone(message);
    }
  }, [message]);

  return (
    <div className="flex flex-col gap-4">
      {!selectedTemplate && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
            ))}
          </div>
        </>
      )}

      {selectedTemplate && (
        <div className="flex flex-col gap-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar para templates
          </button>
          <BaseChat />
        </div>
      )}
    </div>
  );
}
