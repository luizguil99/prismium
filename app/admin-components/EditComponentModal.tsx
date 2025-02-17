import { useRef, useState } from 'react';
import { Save, X, Image, Loader2 } from 'lucide-react';
import type { Database } from '~/types/supabase';
import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';
import { classNames } from '~/utils/classNames';

type SupabaseComponent = Database['public']['Tables']['components']['Row'];

interface EditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  component: SupabaseComponent;
}

// Função auxiliar para criar URL proxy segura
const getProxiedImageUrl = (url: string) => {
  if (!url) return '';
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export function EditComponentModal({ isOpen, onClose, onSave, component }: EditComponentModalProps) {
  const supabase = getOrCreateClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: component.name,
    description: component.description || '',
    preview_url: component.preview_url || '',
    is_new: component.is_new,
    prompt: component.prompt
  });

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `components/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('components-previews')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('components-previews')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, preview_url: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('components')
        .update({
          name: formData.name,
          description: formData.description,
          preview_url: formData.preview_url,
          is_new: formData.is_new,
          prompt: formData.prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', component.id);

      if (error) throw error;

      toast.success('Componente atualizado com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar componente:', error);
      toast.error('Erro ao atualizar componente');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className="relative bg-[#1D1D1D] rounded-lg w-full max-w-2xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">
              Editar Componente
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Preview da imagem */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/20 rounded-lg">
              {formData.preview_url ? (
                <img
                  src={getProxiedImageUrl(formData.preview_url)}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                  <Image className="w-8 h-8" />
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={classNames(
                  "absolute bottom-4 right-4 px-3 py-2 rounded-md text-sm font-medium",
                  "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
                  "text-white transition-colors",
                  "flex items-center gap-2",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    Alterar imagem
                  </>
                )}
              </button>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white resize-none h-24"
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Prompt
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white resize-none h-32"
                required
              />
            </div>

            {/* Is New */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_new"
                checked={formData.is_new}
                onChange={(e) => setFormData(prev => ({ ...prev, is_new: e.target.checked }))}
                className="w-4 h-4 text-[#548BE4] bg-[#2D2D2D] border-zinc-700 rounded focus:ring-[#548BE4] focus:ring-2"
              />
              <label htmlFor="is_new" className="ml-2 text-sm text-zinc-400">
                Marcar como novo
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="component-form"
              disabled={isSaving}
              className={classNames(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium",
                "bg-[#548BE4] hover:bg-[#4A7CCF] text-white transition-colors",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
