import { X, Code2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useGit } from '~/lib/hooks/useGit';
import { templates } from '~/utils/templates';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
}

export function CreateProjectModal({ isOpen, onClose, templateType }: CreateProjectModalProps) {
  const { ready, gitClone } = useGit();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleClone = async (templateId: number) => {
    if (!ready) {
      console.error('Sistema Git não está pronto');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setLoadingId(template.id);

    try {
      const { workdir, data } = await gitClone(template.repo);

      if (data) {
        const textDecoder = new TextDecoder('utf-8');
        const filePaths = Object.keys(data);

        const fileContents = filePaths
          .map((filePath) => {
            const { data: content, encoding } = data[filePath];
            return {
              path: filePath,
              content: encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '',
            };
          })
          .filter((f) => f.content);

        console.log(
          'Arquivos clonados:',
          fileContents.map((f) => f.path),
        );
      }

      console.log(`Template clonado com sucesso em ${workdir}`);
      onClose();
    } catch (error) {
      console.error('Erro ao clonar template:', error);
    } finally {
      setLoadingId(null);
    }
  };

  // Filtra apenas os templates Shadcn
  const shadcnTemplates = templates.filter((t) => t.keywords.includes('shadcn'));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#11161E] to-[#0B0E14] border border-[#2A2F3A]/50 rounded-xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
        <div className="absolute right-4 top-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors group">
            <X size={20} className="text-[#8B98A9] group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-[#D9DFE7] text-2xl font-semibold">Create New {templateType} Project</h2>
            </div>
            <p className="text-[#8B98A9] text-base">
              Configure your project settings to get started with {templateType}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[#8B98A9] text-sm font-medium uppercase tracking-wider mb-4">Select Language</h3>

              {shadcnTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleClone(template.id)}
                  disabled={loadingId !== null}
                  className="w-full group flex items-center justify-between p-4 rounded-lg border border-[#2A2F3A]/50 bg-[#151922]/50 hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200 relative"
                >
                  {loadingId === template.id && (
                    <div className="absolute inset-0 bg-[#151922]/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-blue-400">Clonando template...</div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 font-mono text-sm font-bold">
                        {template.title.includes('TypeScript') ? 'TS' : 'JS'}
                      </span>
                    </div>
                    <div className="text-left">
                      <h4 className="text-[#D9DFE7] font-medium">{template.title}</h4>
                      <p className="text-[#8B98A9] text-sm">{template.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8B98A9] group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
