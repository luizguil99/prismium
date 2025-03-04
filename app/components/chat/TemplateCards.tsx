import { templates } from '~/utils/templates';
import { useGit } from '~/lib/hooks/useGit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import ignore from 'ignore';
import { ArrowRight } from 'lucide-react';

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

interface TemplateCardsProps {
  importChat?: (description: string, messages: any[]) => Promise<void>;
}

export default function TemplateCards({ importChat }: TemplateCardsProps) {
  const { ready, gitClone } = useGit();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleClone = async (template: any) => {
    if (!ready) {
      toast.error('Git system is not ready');
      return;
    }

    setLoadingId(template.id);

    try {
      const { workdir, data } = await gitClone(template.repo);

      if (importChat) {
        const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
        console.log(filePaths);

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

        const filesMessage = {
          role: 'assistant',
          content: `Cloning the template ${template.title} into ${workdir}
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
      }

      setLoadingId(null);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to import repository');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-zinc-400 font-['Segoe UI'] text-sm font-medium uppercase tracking-wider">
          Popular Templates
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleClone(template)}
            disabled={!ready || loadingId !== null}
            className="group relative flex flex-col h-[180px] bg-[#09090B] border border-zinc-800/60 rounded-xl text-left hover:bg-[#111113] hover:border-blue-500/30 transition-all duration-200 p-5 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingId === template.id && (
              <LoadingOverlay message="Waiting while cloning template..." />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col h-full">
              <div className="mb-3 transform group-hover:translate-x-1 transition-transform duration-200">
                <img
                  src={template.image}
                  alt={template.title}
                  className="w-8 h-8 object-cover rounded-lg"
                />
              </div>
              <div className="mt-auto">
                <h3 className="text-zinc-200 font-['Segoe UI'] text-lg font-semibold leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                  {template.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 group-hover:text-zinc-300 transition-colors mb-3">
                  {template.description}
                </p>
                <div className="flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Usar Template</span>
                  <ArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
