import { memo, useState, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Search, ChevronDown } from 'lucide-react';

interface ComponentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Lista de componentes disponíveis com previews
const components = [
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Seção principal com título, subtítulo e CTA',
    category: 'layout',
    preview: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 1423,
    author: 'Prismium Team',
  },
  {
    id: 'features',
    name: 'Features Grid',
    description: 'Grid de recursos com ícones e descrições',
    category: 'layout',
    preview: 'https://images.unsplash.com/photo-1618005198918-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 952,
    author: 'Prismium Team',
  },
  {
    id: 'pricing',
    name: 'Pricing Table',
    description: 'Tabela de preços com planos e recursos',
    category: 'marketing',
    preview: 'https://images.unsplash.com/photo-1618005198917-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 630,
    author: 'Prismium Team',
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Carrossel de depoimentos com avatares',
    category: 'social',
    preview: 'https://images.unsplash.com/photo-1618005198916-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 289,
    author: 'Prismium Team',
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Rodapé completo com links e newsletter',
    category: 'layout',
    preview: 'https://images.unsplash.com/photo-1618005198915-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 793,
    author: 'Prismium Team',
  },
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Formulário de contato com validação',
    category: 'forms',
    preview: 'https://images.unsplash.com/photo-1618005198914-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop',
    likes: 602,
    author: 'Prismium Team',
  },
];

// Categorias de componentes
const categories = {
  landingPages: {
    name: 'Landing Pages',
    icon: 'i-lucide-layout-template',
    items: [
      {
        name: 'Testimonials',
        preview: '/previews/testimonials.png',
        description: 'Carrossel de depoimentos com avatares',
      },
      { name: 'Footer', preview: '/previews/footer.png', description: 'Rodapé completo com links e newsletter' },
      {
        name: 'Hero Section',
        preview: '/previews/hero.png',
        description: 'Seção principal com imagem e CTA',
        isNew: true,
      },
      { name: 'Features Grid', preview: '/previews/features.png', description: 'Grid de recursos com ícones' },
    ],
  },
  ecommerce: {
    name: 'E-commerce',
    icon: 'i-lucide-shopping-cart',
    items: [
      {
        name: 'Product Card',
        preview: '/previews/product-card.png',
        description: 'Card de produto com imagem e preço',
      },
      {
        name: 'Shopping Cart',
        preview: '/previews/cart.png',
        description: 'Carrinho de compras flutuante',
        isNew: true,
      },
      { name: 'Checkout Form', preview: '/previews/checkout.png', description: 'Formulário de checkout com validação' },
      { name: 'Product Grid', preview: '/previews/product-grid.png', description: 'Grid de produtos com filtros' },
    ],
  },
  forms: {
    name: 'Forms',
    icon: 'i-lucide-form-input',
    items: [
      { name: 'Contact Form', preview: '/previews/contact.png', description: 'Formulário de contato com validação' },
      {
        name: 'Newsletter',
        preview: '/previews/newsletter.png',
        description: 'Formulário de newsletter com confirmação',
      },
      {
        name: 'Login Form',
        preview: '/previews/login.png',
        description: 'Formulário de login com redes sociais',
        isNew: true,
      },
      { name: 'Signup Form', preview: '/previews/signup.png', description: 'Formulário de cadastro com validação' },
    ],
  },
  navigation: {
    name: 'Navigation',
    icon: 'i-lucide-navigation',
    items: [
      { name: 'Navbar', preview: '/previews/navbar.png', description: 'Barra de navegação responsiva' },
      { name: 'Sidebar', preview: '/previews/sidebar.png', description: 'Sidebar com submenu', isNew: true },
      { name: 'Breadcrumbs', preview: '/previews/breadcrumbs.png', description: 'Navegação breadcrumb' },
      { name: 'Menu Mobile', preview: '/previews/menu-mobile.png', description: 'Menu mobile com animação' },
    ],
  },
};

export const ComponentsModal = memo(({ isOpen, onClose }: ComponentsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<(typeof components)[0] | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    landingPages: true,
    ecommerce: true,
    forms: true,
    navigation: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedComponent(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredComponents = Object.entries(categories).flatMap(([_, category]) =>
    category.items.filter((component) => {
      const matchesSearch =
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }),
  );

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
                <p className="text-sm text-bolt-elements-item-contentDefault/60">Selecione um componente para gerar</p>
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
                className="flex-1 p-2 space-y-1 overflow-y-auto h-full [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-[#333] 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-2
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-[#444]"
              >
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key} className="space-y-1">
                    <button
                      onClick={() => toggleCategory(key)}
                      className={classNames(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm',
                        'text-bolt-elements-item-contentDefault group',
                        'bg-transparent hover:bg-[#1D1D1D]',
                        'transition-colors duration-200',
                        expandedCategories[key] && 'bg-[#1D1D1D]/50',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={classNames(category.icon, 'text-[#548BE4]')} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <ChevronDown
                        className={classNames(
                          'w-4 h-4 transition-transform text-bolt-elements-item-contentDefault/50',
                          expandedCategories[key] ? 'transform rotate-180' : '',
                        )}
                      />
                    </button>

                    {expandedCategories[key] && (
                      <div className="ml-2 space-y-0.5 animate-slideDown">
                        {category.items.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => setSelectedComponent(item)}
                            className={classNames(
                              'w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm',
                              'text-bolt-elements-item-contentDefault/60 hover:text-bolt-elements-item-contentDefault',
                              'bg-transparent hover:bg-[#1D1D1D]',
                              'transition-colors duration-200',
                              selectedComponent?.name === item.name &&
                                'bg-[#1D1D1D] text-bolt-elements-item-contentDefault',
                            )}
                          >
                            <span>{item.name}</span>
                            {item.isNew && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#86efac] text-[#052e16] font-medium">
                                New
                              </span>
                            )}
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
                className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[460px]
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar-track]:bg-transparent 
                [&::-webkit-scrollbar-thumb]:bg-[#333] 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-2
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-[#444]"
              >
                {filteredComponents.map((component) => (
                  <button
                    key={component.name}
                    className={classNames(
                      'group text-left rounded-lg overflow-hidden',
                      'bg-bolt-elements-background-depth-1',
                      'border transition-all duration-200',
                      selectedComponent?.name === component.name
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
                          alt={component.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-bolt-elements-item-contentDefault">{component.name}</h3>
                        {component.isNew && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#86efac] text-[#052e16] font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-bolt-elements-item-contentDefault/60">{component.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex justify-between items-center p-4 border-t border-bolt-elements-borderColor">
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
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm',
                  'bg-[#1D1D1D] hover:bg-[#202020]',
                  'text-bolt-elements-item-contentDefault/60',
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
                disabled={!selectedComponent}
                className={classNames(
                  'px-4 py-2 rounded-md text-sm',
                  'transition-colors duration-200',
                  selectedComponent
                    ? 'bg-[#1D1D1D] hover:bg-[#202020] text-bolt-elements-item-contentDefault border border-[#303030]'
                    : 'bg-[#181818] text-bolt-elements-item-contentDefault/30 cursor-not-allowed',
                )}
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

<style jsx global>{`
  .animate-slideDown {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #444;
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
  }
`}</style>;
