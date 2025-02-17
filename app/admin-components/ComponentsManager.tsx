import { useState } from 'react';
import { categories, type Component, type Category, type Subcategory } from '~/components/workbench/components-list';
import { Plus, Save, Trash2, Edit2, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

interface ComponentFormData {
  id: string;
  name: string;
  description: string;
  preview: string;
  prompt: string;
  isNew?: boolean;
  category: string;
  subcategory: string;
}

export function ComponentsManager() {
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComponentFormData>({
    id: '',
    name: '',
    description: '',
    preview: '',
    prompt: '',
    isNew: false,
    category: '',
    subcategory: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Aqui você implementaria a lógica para salvar no Supabase
      console.log('Salvando componente:', formData);
      toast.success('Componente salvo com sucesso!');
      setIsAddingComponent(false);
      setFormData({
        id: '',
        name: '',
        description: '',
        preview: '',
        prompt: '',
        isNew: false,
        category: '',
        subcategory: ''
      });
    } catch (error) {
      console.error('Erro ao salvar componente:', error);
      toast.error('Erro ao salvar componente');
    }
  };

  // Filtra os componentes baseado na busca
  const filteredCategories = Object.entries(categories).filter(([key, category]) => {
    if (selectedCategory && key !== selectedCategory) return false;
    
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return Object.values(category.subcategories).some(subcategory =>
      subcategory.components.some(component =>
        component.name.toLowerCase().includes(searchLower) ||
        component.description?.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-4 bg-[#1D1D1D] p-4 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar componentes..."
              className="w-full pl-10 pr-4 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#548BE4]/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#548BE4]/50"
          >
            <option value="">Todas as categorias</option>
            {Object.entries(categories).map(([key, category]) => (
              <option key={key} value={key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAddingComponent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#548BE4] hover:bg-[#4A7CCF] text-white rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Componente
        </button>
      </div>

      {/* Lista de componentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(([categoryKey, category]) => (
          Object.entries(category.subcategories).map(([subcategoryKey, subcategory]) => (
            subcategory.components
              .filter(component => 
                !searchTerm || 
                component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                component.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((component) => (
                <div
                  key={component.id}
                  className="group bg-[#1D1D1D] rounded-lg overflow-hidden border border-zinc-800 hover:border-[#548BE4]/30 transition-all"
                >
                  {/* Preview */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                    {component.preview ? (
                      <img
                        src={component.preview}
                        alt={component.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        Sem preview
                      </div>
                    )}
                    {component.isNew && (
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
                          <span className="text-xs text-zinc-500">{category.name}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500">{subcategory.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          setFormData({
                            ...component,
                            category: categoryKey,
                            subcategory: subcategoryKey,
                          });
                          setIsAddingComponent(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          toast.error('Funcionalidade em desenvolvimento');
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          ))
        ))}
      </div>

      {/* Modal de adição/edição */}
      {isAddingComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1D1D1D] rounded-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {formData.id ? 'Editar Componente' : 'Novo Componente'}
              </h2>
              <button
                onClick={() => setIsAddingComponent(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Subcategoria
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                    required
                    disabled={!formData.category}
                  >
                    <option value="">Selecione uma subcategoria</option>
                    {formData.category &&
                      Object.entries(categories[formData.category].subcategories).map(([key, subcategory]) => (
                        <option key={key} value={key}>
                          {subcategory.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                    placeholder="ex: hero-gradient"
                    required
                  />
                </div>

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
                    URL da Preview
                  </label>
                  <input
                    type="url"
                    value={formData.preview}
                    onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-zinc-700 rounded-md text-white"
                    placeholder="URL da imagem de preview"
                  />
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
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="rounded border-zinc-700 bg-[#2D2D2D] text-[#548BE4]"
                    />
                    Marcar como novo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingComponent(false)}
                  className="px-4 py-2 text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-[#548BE4] hover:bg-[#4A7CCF] text-white rounded-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 