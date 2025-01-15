import { memo, useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Search, ChevronDown, LayoutTemplate, Component as ComponentIcon } from 'lucide-react';
import { categories, type Component } from './components-list';

interface ComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentsModal = memo(({ isOpen, onClose }: ComponentsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Reseta o estado quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedComponent(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setExpandedCategories({});
    }
  }, [isOpen]);

  // Garante que a categoria selecionada esteja expandida
  useEffect(() => {
    if (selectedCategory) {
      setExpandedCategories(prev => ({
        ...prev,
        [selectedCategory]: true
      }));
    }
  }, [selectedCategory]);

  const toggleCategory = (category: string) => {
    // Se está clicando na mesma categoria
    if (category === selectedCategory) {
      setExpandedCategories((prev) => ({
        ...prev,
        [category]: !prev[category],
      }));
      if (prev[category]) {
        setSelectedSubcategory(null);
      }
    } else {
      // Se está mudando de categoria, limpa tudo e expande a nova
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setSelectedComponent(null);
      setExpandedCategories({
        [category]: true,
      });
    }
  };

  const selectSubcategory = (subcategory: string) => {
    if (subcategory === selectedSubcategory) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subcategory);
    }
    setSelectedComponent(null);
  };

  if (!isOpen) return null;

  // Filtra os componentes baseado na categoria e subcategoria selecionadas
  const filteredComponents = (() => {
    try {
      // Se não houver categoria selecionada, mostra todos os componentes
      if (!selectedCategory) {
        return Object.values(categories).flatMap((category) =>
          Object.values(category.subcategories || {}).flatMap((subcategory) =>
            (subcategory?.components || []).filter(
              (component) =>
                component &&
                typeof component === 'object' &&
                ((component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (component.description || '').toLowerCase().includes(searchTerm.toLowerCase())),
            ),
          ),
        );
      }

      const categoryData = categories[selectedCategory];
      if (!categoryData?.subcategories) return [];

      // Se houver categoria mas não subcategoria selecionada, mostra todos os componentes da categoria
      if (!selectedSubcategory) {
        return Object.values(categoryData.subcategories).flatMap((subcategory) =>
          (subcategory?.components || []).filter(
            (component) =>
              component &&
              typeof component === 'object' &&
              ((component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (component.description || '').toLowerCase().includes(searchTerm.toLowerCase())),
          ),
        );
      }

      // Se houver categoria e subcategoria, mostra apenas os componentes da subcategoria
      const subcategory = categoryData.subcategories[selectedSubcategory];
      if (!subcategory?.components) {
        setSelectedSubcategory(null); // Reseta a subcategoria se ela não existir
        return [];
      }

      return subcategory.components.filter((component) => {
        if (!component || typeof component !== 'object') return false;

        const matchesSearch =
          (component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (component.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    } catch (error) {
      console.error('Erro ao filtrar componentes:', error);
      setSelectedSubcategory(null); // Reseta a subcategoria em caso de erro
      return [];
    }
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className="relative bg-bolt-elements-background-depth-2 rounded-lg w-full max-w-5xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-3">
              <span className="i-ph:puzzle-piece-duotone text-2xl text-[#548BE4]" />
              <div>
                <h2 className="text-lg font-semibold text-bolt-elements-item-contentDefault">Componentes</h2>
                <p className="text-sm text-bolt-elements-item-contentDefault/60">
                  {selectedCategory
                    ? selectedSubcategory
                      ? `${categories[selectedCategory].subcategories[selectedSubcategory].name}`
                      : categories[selectedCategory].name
                    : 'Selecione uma categoria'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bolt-elements-item-contentDefault/60">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar componentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={classNames(
                    'w-64 pl-10 pr-4 py-2 rounded-md text-sm',
                    'bg-[#1D1D1D] hover:bg-[#202020]',
                    'border border-bolt-elements-borderColor',
                    'focus:outline-none focus:ring-2 focus:ring-[#548BE4]/30',
                    'placeholder-bolt-elements-item-contentDefault/50',
                  )}
                />
              </div>
              <button
                onClick={onClose}
                className="text-bolt-elements-item-contentDefault/60 hover:text-bolt-elements-item-contentDefault"
              >
                <span className="i-ph:x-bold text-xl" />
              </button>
            </div>
          </div>

          <div className="flex divide-x divide-bolt-elements-borderColor h-[500px]">
            {/* Sidebar */}
            <div className="w-64 flex flex-col bg-transparent border-r border-bolt-elements-borderColor/50">
              <div
                className="flex-1 p-2 space-y-1 overflow-y-auto h-full 
                overflow-x-hidden
                scroll-smooth
                [scrollbar-gutter:stable]
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-[#333]/50
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-2
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-[#444]
                [@media(hover:none)]:scrollbar-none"
              >
                {Object.entries(categories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className={classNames(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm',
                        'text-bolt-elements-item-contentDefault group',
                        'bg-transparent hover:bg-[#1D1D1D]',
                        'transition-all duration-150 ease-in-out will-change-transform',
                        selectedCategory === categoryKey && 'bg-[#1D1D1D]/50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {categoryKey === 'landingPages' ? (
                          <LayoutTemplate className="w-5 h-5 text-[#548BE4] transition-transform duration-150 ease-in-out group-hover:scale-110" />
                        ) : (
                          <ComponentIcon className="w-5 h-5 text-[#548BE4] transition-transform duration-150 ease-in-out group-hover:scale-110" />
                        )}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <ChevronDown
                        className={classNames(
                          'w-4 h-4 transition-transform duration-200 ease-in-out will-change-transform',
                          expandedCategories[categoryKey] ? 'rotate-180' : '',
                        )}
                      />
                    </button>

                    {expandedCategories[categoryKey] && (
                      <div className="ml-2 space-y-0.5">
                        {Object.entries(category.subcategories).map(([subcategoryKey, subcategory]) => (
                          <button
                            key={subcategoryKey}
                            onClick={() => selectSubcategory(subcategoryKey)}
                            className={classNames(
                              'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm',
                              'text-bolt-elements-item-contentDefault/60 hover:text-bolt-elements-item-contentDefault',
                              'bg-transparent hover:bg-[#1D1D1D]',
                              'transition-all duration-150 ease-in-out will-change-transform',
                              selectedSubcategory === subcategoryKey &&
                                'bg-[#1D1D1D] text-bolt-elements-item-contentDefault',
                            )}
                          >
                            <span>{subcategory.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid de componentes */}
            <div className="flex-1 p-4">
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[460px] pr-4
                overflow-x-hidden
                scroll-smooth
                [scrollbar-gutter:stable]
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-[#333]/50
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-2
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-[#444]
                [@media(hover:none)]:scrollbar-none"
              >
                {filteredComponents.map((component) =>
                  component && typeof component === 'object' ? (
                    <button
                      key={component.id || component.name}
                      className={classNames(
                        'group text-left rounded-lg overflow-hidden',
                        'bg-bolt-elements-background-depth-1',
                        'border transition-all duration-150 ease-in-out will-change-transform',
                        'hover:translate-y-[-2px] hover:shadow-lg',
                        selectedComponent?.id === component.id
                          ? 'border-[#548BE4] ring-2 ring-[#548BE4]/30'
                          : 'border-bolt-elements-borderColor hover:border-[#548BE4]/30',
                      )}
                      onClick={() => setSelectedComponent(component)}
                    >
                      {/* Preview */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                        {component.preview && (
                          <img
                            src={component.preview}
                            alt={component.name || ''}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out will-change-transform group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-bolt-elements-item-contentDefault">
                            {component.name || 'Sem nome'}
                          </h3>
                          {component.isNew && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#86efac] text-[#052e16] font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-bolt-elements-item-contentDefault/60">
                          {component.description || 'Sem descrição'}
                        </p>
                      </div>
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-bolt-elements-borderColor">
            <div className="text-sm text-bolt-elements-item-contentDefault/60">
              {selectedComponent ? (
                <span>
                  Componente selecionado:{' '}
                  <strong className="text-bolt-elements-item-contentDefault">{selectedComponent.name}</strong>
                </span>
              ) : (
                'Clique em um componente para selecionar'
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm',
                  'text-bolt-elements-item-contentDefault',
                  'bg-[#1D1D1D] hover:bg-[#202020]',
                  'transition-colors duration-200',
                )}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedComponent) {
                    console.log(`Gerando componente: ${selectedComponent.name}`);
                    onClose();
                  }
                }}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'bg-[#1D1D1D] hover:bg-[#202020]',
                  'text-bolt-elements-item-contentDefault',
                  'transition-colors duration-200',
                  !selectedComponent && 'opacity-50 cursor-not-allowed',
                )}
                disabled={!selectedComponent}
              >
                Gerar Componente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ComponentsModal.displayName = 'ComponentsModal';
