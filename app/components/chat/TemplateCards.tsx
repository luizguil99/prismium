import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { Folder, ArrowRight } from 'lucide-react';
import { templates } from '~/utils/templates';
import { useTemplateManager } from '~/hooks/useTemplateManager';

interface TemplateCardsProps {
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function TemplateCards({ importChat }: TemplateCardsProps) {
  const { ready } = useGit();
  const { handlePromptAndClone, loadingId } = useTemplateManager();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleClone = async (template: (typeof templates)[0]) => {
    if (!ready) {
      toast.error('Sistema Git não está pronto');
      return;
    }

    try {
      await handlePromptAndClone('', importChat);
    } catch (error) {
      console.error('Erro ao clonar template:', error);
    }
  };

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-6 text-center text-bolt-elements-textPrimary">Templates Populares</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative bg-bolt-elements-background-depth-2 rounded-xl border border-bolt-elements-borderColor overflow-hidden hover:border-bolt-elements-borderColorHover transition-all duration-200 shadow-sm hover:shadow-md"
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {loadingId === template.id && <LoadingOverlay />}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-lg text-bolt-elements-textPrimary group-hover:text-bolt-elements-textPrimaryHover transition-colors">
                  {template.title}
                </h3>
                <Folder className="w-5 h-5 text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimaryHover transition-colors" />
              </div>
              <p className="text-bolt-elements-textSecondary text-sm mb-6 line-clamp-2">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-bolt-elements-background-depth-3 rounded-md text-xs text-bolt-elements-textSecondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleClone(template)}
                disabled={!ready || loadingId !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-4 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 text-bolt-elements-textPrimary group-hover:text-bolt-elements-textPrimaryHover"
              >
                <span>Usar Template</span>
                <ArrowRight
                  className={`w-4 h-4 transition-transform duration-200 ${hoveredId === template.id ? 'translate-x-1' : ''}`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
