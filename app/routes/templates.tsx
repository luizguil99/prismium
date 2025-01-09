import { ChevronRight, Search } from 'lucide-react';

// Tipos para os templates
interface Template {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
}

// Categorias de templates
const categories = [
  { id: 'web-app', title: 'Web app', icon: ChevronRight },
  { id: 'backend', title: 'Backend', icon: ChevronRight },
  { id: 'mobile', title: 'Mobile', icon: ChevronRight },
  { id: 'ai-ml', title: 'AI & ML', icon: ChevronRight },
  { id: 'databases', title: 'Databases', icon: ChevronRight },
  { id: 'misc', title: 'Misc', icon: ChevronRight },
  { id: 'solutions', title: 'Solutions', icon: ChevronRight },
];

// Templates em destaque
const featuredTemplates = [
  {
    id: 'angular',
    title: 'Angular',
    description: 'Crie um novo app Angular em TypeScript usando ng-cli',
    icon: '🅰️',
  },
  {
    id: 'nextjs',
    title: 'NextJS',
    description: 'Crie um app full-stack NextJS com TypeScript ou JavaScript e renderização server-side',
    icon: 'N',
  },
  {
    id: 'astro',
    title: 'Astro',
    description: 'Crie um app web full-stack com Astro, um framework que oferece superpoderes focados em conteúdo',
    icon: '🚀',
  },
  {
    id: 'react',
    title: 'React',
    description: 'Crie um novo app React em TypeScript ou JavaScript usando Vite',
    icon: '⚛️',
  },
  {
    id: 'html',
    title: 'HTML Simples',
    description: 'Crie um novo app web simples com HTML, CSS e JS ou TypeScript',
    icon: '🌐',
  },
  {
    id: 'svelte',
    title: 'Svelte',
    description: 'Crie um novo app Svelte em TypeScript ou JavaScript usando Vite',
    icon: '🔥',
  },
];

// Todos os templates web
const allWebTemplates = [
  {
    id: 'vuejs',
    title: 'Vue.js',
    description: 'Crie um template Vue.js com TS ou JS e Vite',
    icon: '💚',
  },
  {
    id: 'solidjs',
    title: 'SolidJS',
    description: 'Crie um app web com SolidJS e Vite',
    icon: '🔷',
  },
  {
    id: 'preact',
    title: 'Preact',
    description: 'Crie um app web com Preact e Vite',
    icon: '⚛️',
  },
  {
    id: 'nuxt',
    title: 'Nuxt',
    description: 'Construa uma aplicação web com Nuxt (framework baseado em Vue.js)',
    icon: '💚',
  },
  {
    id: 'react-maps',
    title: 'React + Google Maps Platform',
    description: 'Adicione um mapa do Google a um app React com TypeScript',
    icon: '📍',
  },
];

export default function Templates() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Templates</h1>
          <p className="text-gray-400">
            Comece um novo workspace a partir de um dos nossos templates cuidadosamente desenvolvidos
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar templates"
            className="bg-[#1A1E26] border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <div className="w-64">
          {categories.map((category) => (
            <button
              key={category.id}
              className="w-full flex items-center justify-between text-gray-400 hover:text-white hover:bg-[#1A1E26] px-4 py-2 rounded-md transition-colors"
            >
              <span>{category.title}</span>
              <category.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1">
          {/* Featured Templates */}
          <div className="mb-12">
            <h2 className="text-lg font-medium mb-4">Templates de apps web em destaque</h2>
            <div className="grid grid-cols-3 gap-4">
              {featuredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#1A1E26] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="text-2xl mb-3">{template.icon}</div>
                  <h3 className="font-medium mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Web Templates */}
          <div>
            <h2 className="text-lg font-medium mb-4">Todos os templates de apps web</h2>
            <div className="space-y-2">
              {allWebTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#1A1E26] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors flex items-center gap-4"
                >
                  <div className="text-2xl">{template.icon}</div>
                  <div>
                    <h3 className="font-medium">{template.title}</h3>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Status
          </span>
          <span>Fórum de Discussão</span>
          <span>Solicitações de Recursos</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Sobre o IDX</span>
          <span>RSS</span>
          <span>Termos</span>
          <span>Privacidade</span>
        </div>
      </div>
    </div>
  );
}
