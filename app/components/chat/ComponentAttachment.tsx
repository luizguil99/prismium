import type { Component } from '~/components/workbench/components-list';
import { classNames } from '~/utils/classNames';
import { LayoutTemplate, Code2 } from 'lucide-react';

interface ComponentAttachmentProps {
  component: Component;
}

export const ComponentAttachment = ({ component }: ComponentAttachmentProps) => {
  return (
    <div className={classNames(
      'flex flex-col gap-4 p-4 rounded-lg',
      'bg-[#1D1D1D] border border-bolt-elements-borderColor',
      'transition-all duration-200 hover:border-[#548BE4]/30'
    )}>
      {/* Preview */}
      {component.preview && (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black/20">
          <img
            src={component.preview}
            alt={component.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-[#548BE4]/10 rounded-md">
          <Code2 className="w-5 h-5 text-[#548BE4]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-bolt-elements-item-contentDefault">
              {component.name}
            </h3>
            {component.isNew && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[#86efac] text-[#052e16]">
                New
              </span>
            )}
          </div>
          {component.description && (
            <p className="mt-1 text-sm text-bolt-elements-item-contentDefault/60">
              {component.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 