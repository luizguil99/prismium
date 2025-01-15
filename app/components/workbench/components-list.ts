// Lista de componentes organizados por categoria e subcategoria
export type Component = {
  name: string;
  description: string;
  preview: string;
  isNew?: boolean;
};

export type Subcategory = {
  name: string;
  icon?: string;
  components: Component[];
};

export type Category = {
  name: string;
  icon: string;
  subcategories: Record<string, Subcategory>;
};

export const categories: Record<string, Category> = {
  landingPages: {
    name: 'Landing Pages',
    icon: 'i-ph:browser-duotone',
    subcategories: {
      hero: {
        name: 'Hero',
        icon: 'i-ph:layout-duotone',
        components: [
          {
            name: 'Hero com Imagem à Direita',
            description: 'Seção hero com imagem destacada à direita e CTA',
            preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
            isNew: true,
          },
          {
            name: 'Hero com Background Gradiente',
            description: 'Seção hero moderna com fundo gradiente e elementos flutuantes',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
          },
          {
            name: 'Hero com Background Gradiente',
            description: 'Seção hero moderna com fundo gradiente e elementos flutuantes',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
          },
          {
            name: 'Hero com Background Gradiente',
            description: 'Seção hero moderna com fundo gradiente e elementos flutuantes',
            preview: 'https://images.unsplash.com/photo-1579547944212-c4f4961a8dd8',
          },
        ],
      },
      nav: {
        name: 'Navegação',
        icon: 'i-ph:list-duotone',
        components: [
          {
            name: 'Navbar com Logo Central',
            description: 'Barra de navegação com logo centralizado e menu nas laterais',
            preview: 'https://images.unsplash.com/photo-1481487196290-c152efe083f5',
          },
          {
            name: 'Navbar com Dropdown',
            description: 'Barra de navegação com menus dropdown e busca integrada',
            preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
            isNew: true,
          },
        ],
      },
      footer: {
        name: 'Footer',
        icon: 'i-ph:dots-three-outline-duotone',
        components: [
          {
            name: 'Footer com Newsletter',
            description: 'Rodapé com formulário de newsletter e links',
            preview: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
          },
          {
            name: 'Footer Multi-coluna',
            description: 'Rodapé organizado em múltiplas colunas de links',
            preview: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0',
          },
        ],
      },
      testimonials: {
        name: 'Depoimentos',
        icon: 'i-ph:chat-circle-text-duotone',
        components: [
          {
            name: 'Carrossel de Depoimentos',
            description: 'Slider com cards de depoimentos de clientes',
            preview: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7',
          },
          {
            name: 'Grid de Depoimentos',
            description: 'Grid responsivo com depoimentos e fotos',
            preview: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
            isNew: true,
          },
        ],
      },
    },
  },
  uiElements: {
    name: 'UI Elements',
    icon: 'i-ph:stack-duotone',
    subcategories: {
      buttons: {
        name: 'Botões',
        icon: 'i-ph:cursor-click-duotone',
        components: [
          {
            name: 'Botões Gradiente',
            description: 'Coleção de botões com efeitos gradiente modernos',
            preview: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc',
          },
          {
            name: 'Botões com Ícones',
            description: 'Botões interativos com ícones e animações',
            preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
            isNew: true,
          },
        ],
      },
      cards: {
        name: 'Cards',
        icon: 'i-ph:cards-duotone',
        components: [
          {
            name: 'Cards com Hover',
            description: 'Cards com efeitos de hover elegantes',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
          },
          {
            name: 'Cards Informativos',
            description: 'Cards para exibição de informações e estatísticas',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
          },
        ],
      },
      forms: {
        name: 'Formulários',
        icon: 'i-ph:text-columns-duotone',
        components: [
          {
            name: 'Form com Validação',
            description: 'Formulário com validação em tempo real',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
          },
          {
            name: 'Form Multi-step',
            description: 'Formulário dividido em múltiplas etapas',
            preview: 'https://images.unsplash.com/photo-1557821552-17105176677c',
            isNew: true,
          },
        ],
      },
    },
  },
};
