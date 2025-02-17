import { useRef, useState } from 'react';
import { Save, Trash2, X, Image } from 'lucide-react';
import { categories } from '~/components/workbench/components-list';
import type { Database } from '~/types/supabase';
import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';

interface ComponentFormData {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  preview_url?: string;
  is_new?: boolean;
  prompt: string;
}

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: ComponentFormData;
}

// Função auxiliar para criar URL proxy segura
const getProxiedImageUrl = (url: string) => {
  if (!url) return '';
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export function ComponentModal({ isOpen, onClose, onSave, initialData }: ComponentModalProps) {
  const supabase = getOrCreateClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [formData, setFormData] = useState<ComponentFormData>(
    initialData || {
      id: '',
      category: '',
      subcategory: '',
      name: '',
      description: '',
      preview_url: '',
      is_new: false,
      prompt: ''
    }
  );

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

      setFormData(prev => ({
        ...prev,
        preview_url: publicUrl
      }));

      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const componentData = {
        name: formData.name,
        description: formData.description,
        preview_url: formData.preview_url,
        is_new: formData.is_new,
        prompt: formData.prompt,
        category: formData.category,
        subcategory: formData.subcategory
      };

      let error = null;
      
      if (formData.id) {
        const { error: updateError } = await supabase
          .from('components')
          .update(componentData)
          .eq('id', formData.id);
        error = updateError;
      } else {
        // Ao criar novo, não enviamos o id - deixamos o Supabase gerar
        const { error: insertError } = await supabase
          .from('components')
          .insert([componentData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(formData.id ? 'Componente atualizado com sucesso!' : 'Componente criado com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar componente:', error);
      toast.error('Erro ao salvar componente');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-hidden">
      <div className="h-full flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-[#1D1D1D] rounded-lg w-full max-w-2xl my-8">
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-zinc-800 bg-[#1D1D1D] z-10">
            <h2 className="text-lg font-semibold text-white">
              {formData.id ? 'Editar Componente' : 'Novo Componente'}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form 
            id="component-form"
            onSubmit={handleSave} 
            className="p-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {Object.entries(categories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.name}
                    </option>
                  ))}
                  <option value="new">+ Adicionar nova categoria</option>
                </select>
              </div>

              {formData.category === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Nova Categoria
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                    placeholder="Nome da nova categoria"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Subcategoria
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                  required
                  disabled={!formData.category && formData.category !== 'new'}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {formData.category && formData.category !== 'new' &&
                    Object.entries(categories[formData.category].subcategories).map(([key, subcategory]) => (
                      <option key={key} value={key}>
                        {subcategory.name}
                      </option>
                    ))}
                  <option value="new">+ Adicionar nova subcategoria</option>
                </select>
              </div>

              {formData.subcategory === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Nova Subcategoria
                  </label>
                  <input
                    type="text"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                    placeholder="Nome da nova subcategoria"
                    required
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                  placeholder="ex: Hero com Gradiente"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                  placeholder="Breve descrição do componente"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Imagem Preview
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-700 border-dashed rounded-md relative">
                  <div className="space-y-1 text-center">
                    {formData.preview_url ? (
                      <div className="relative group">
                        <img
                          src={getProxiedImageUrl(formData.preview_url)}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded"
                          crossOrigin="anonymous"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, preview_url: '' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="mx-auto h-12 w-12 text-zinc-400" />
                        <div className="text-sm text-zinc-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-[#548BE4] hover:text-[#4A7CCF] focus-within:outline-none"
                          >
                            <span>Upload uma imagem</span>
                            <input
                              id="file-upload"
                              ref={fileInputRef}
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                              }}
                              disabled={isUploading}
                            />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-zinc-400">
                          PNG, JPG, GIF até 10MB
                        </p>
                      </>
                    )}
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white h-32 resize-none"
                  placeholder="Prompt para geração do componente"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="rounded border-zinc-700 bg-[#2D2D2D] text-[#548BE4]"
                  />
                  Marcar como novo
                </label>
              </div>
            </div>
          </form>

          <div className="sticky bottom-0 flex justify-end gap-3 p-4 border-t border-zinc-800 bg-[#1D1D1D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              form="component-form"
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-[#548BE4] hover:bg-[#4A7CCF] text-white rounded-md transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 