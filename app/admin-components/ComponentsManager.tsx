import { useState, useEffect } from 'react';
import { categories } from '~/components/workbench/components-list';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getOrCreateClient } from '~/components/supabase/client';
import type { Database } from '~/types/supabase';
import { ComponentCard } from './ComponentCard';
import { ComponentModal } from './ComponentModal';
import { EditComponentModal } from './EditComponentModal';
import { classNames } from '~/utils/classNames';

type SupabaseComponent = Database['public']['Tables']['components']['Row'];

export function ComponentsManager() {
  const supabase = getOrCreateClient();
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [isEditingComponent, setIsEditingComponent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [components, setComponents] = useState<SupabaseComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<SupabaseComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar componentes do Supabase
  useEffect(() => {
    async function loadComponents() {
      try {
        const { data, error } = await supabase
          .from('components')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComponents(data as SupabaseComponent[]);
      } catch (error) {
        console.error('Erro ao carregar componentes:', error);
        toast.error('Erro ao carregar componentes');
      } finally {
        setIsLoading(false);
      }
    }

    loadComponents();
  }, [supabase]);

  async function handleDeleteComponent(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este componente?')) return;

    try {
      const { error } = await supabase
        .from('components')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Componente excluído com sucesso!');
      setComponents(components.filter(comp => comp.id !== id));
    } catch (error) {
      console.error('Erro ao excluir componente:', error);
      toast.error('Erro ao excluir componente');
    }
  }

  function handleEditComponent(component: SupabaseComponent) {
    setSelectedComponent(component);
    setIsEditingComponent(true);
  }

  function handleCloseEditModal() {
    setIsEditingComponent(false);
    setSelectedComponent(null);
  }

  async function handleSaveComponent() {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComponents(data as SupabaseComponent[]);
      toast.success(selectedComponent ? 'Componente atualizado com sucesso!' : 'Componente criado com sucesso!');
      handleCloseEditModal();
    } catch (error) {
      console.error('Erro ao recarregar componentes:', error);
      toast.error('Erro ao salvar componente');
    } finally {
      setIsSaving(false);
    }
  }

  // Filtra os componentes baseado na busca
  const filteredComponents = components.filter(component => {
    if (selectedCategory && component.category !== selectedCategory) return false;
    
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      component.name.toLowerCase().includes(searchLower) ||
      component.description?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#548BE4]" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Barra de ações - fixa */}
      <div className="flex items-center justify-between gap-4 bg-[#1D1D1D] p-4 rounded-lg mb-6">
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
          className={classNames(
            "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
            "bg-[#548BE4] hover:bg-[#4A7CCF] text-white"
          )}
        >
          <Plus className="w-4 h-4" />
          Adicionar Componente
        </button>
      </div>

      {/* Lista de componentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
        {filteredComponents.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-zinc-400 py-8">
            <div className="text-lg mb-2">Nenhum componente encontrado</div>
            <div className="text-sm">
              {searchTerm || selectedCategory ? 
                'Tente ajustar os filtros de busca' : 
                'Clique em "Adicionar Componente" para começar'
              }
            </div>
          </div>
        ) : (
          filteredComponents.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
            />
          ))
        )}
      </div>

      {/* Modal de adição */}
      <ComponentModal
        isOpen={isAddingComponent}
        onClose={() => setIsAddingComponent(false)}
        onSave={handleSaveComponent}
        initialData={undefined}
      />

      {/* Modal de edição */}
      {selectedComponent && (
        <EditComponentModal
          isOpen={isEditingComponent}
          onClose={handleCloseEditModal}
          onSave={handleSaveComponent}
          component={selectedComponent}
        />
      )}
    </div>
  );
}