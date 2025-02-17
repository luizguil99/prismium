import { Edit2, Trash2 } from 'lucide-react';
import type { Database } from '~/types/supabase';

type SupabaseComponent = Database['public']['Tables']['components']['Row'];

interface ComponentCardProps {
  component: SupabaseComponent;
  onEdit: (component: SupabaseComponent) => void;
  onDelete: (id: string) => void;
}

export function ComponentCard({ component, onEdit, onDelete }: ComponentCardProps) {
  return (
    <div
      className="group bg-[#1D1D1D] rounded-lg overflow-hidden border border-zinc-800 hover:border-[#548BE4]/30 transition-all"
    >
      {/* Preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
        {component.preview_url ? (
          <img
            src={component.preview_url}
            alt={component.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            Sem preview
          </div>
        )}
        {component.is_new && (
          <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-[#86efac] text-[#052e16]">
            Novo
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-white">{component.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{component.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">{component.category}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">{component.subcategory}</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
          <button
            onClick={() => onEdit(component)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(component.id)}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 