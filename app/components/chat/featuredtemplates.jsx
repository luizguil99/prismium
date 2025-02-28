import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { featuredTemplates } from '../../utils/featuredTemplates';
import { useGit } from '../../lib/hooks/useGit';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { detectProjectCommands, createCommandsMessage } from '../../utils/projectCommands';
import { generateId } from '../../utils/fileUtils';
import ignore from 'ignore';

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

export default function FeaturedTemplates({ importChat }) {
  const { ready, gitClone } = useGit();
  const [loadingId, setLoadingId] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClone = async (template) => {
    if (!ready) {
      toast.error('Sistema Git não está pronto');
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

      toast.success(`Template ${template.title} clonado com sucesso em ${workdir}`);
    } catch (error) {
      console.error('Erro ao clonar template:', error);
      toast.error('Falha ao importar repositório');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#8B98A9] font-['Segoe UI'] text-sm font-medium uppercase tracking-wider">
          Featured Templates
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-black/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 rounded-lg bg-black/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-200 ease-in-out transform ${
          isAnimating ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100'
        }`}>
          {featuredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleClone(template)}
              disabled={!ready || loadingId !== null}
              className="group relative flex flex-col h-[180px] bg-black/60 backdrop-blur-sm border border-[#2A2F3A]/50 rounded-xl text-left hover:bg-black/80 hover:border-blue-500/30 transition-all duration-200 p-5 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <h3 className="text-[#D9DFE7] font-['Segoe UI'] text-lg font-semibold leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-[#8B98A9] text-sm leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Usar Template</span>
                    <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
