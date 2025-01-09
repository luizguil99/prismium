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
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <div className="max-w-[1400px] mx-auto px-16">
        {/* Header com Dashboard e Search */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-gray-400">
            <ChevronRight size={16} />
            <span>Dashboard</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search templates"
              className="bg-[#1A1F2A] border border-[#2A2F3A] rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-[250px]"
            />
          </div>
        </div>

        {/* Título e Descrição */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Templates</h1>
          <p className="text-gray-400">Start a new workspace from one of our hand-crafted starting templates</p>
        </div>

        {/* Layout Principal */}
        <div className="flex gap-8">
          {/* Categorias */}
          <div className="w-[200px] space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#1A1F2A] text-gray-400 hover:bg-[#2A2F3A] hover:text-white transition-colors"
              >
                <span>{category.title}</span>
                <category.icon size={16} />
              </button>
            ))}
          </div>

          {/* Container dos Templates */}
          <div className="flex-1 max-w-[900px]">
            {/* Featured Templates */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-400 mb-3">Featured web app templates</h2>
              <div className="grid grid-cols-3 gap-4">
                {featuredTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="bg-[#1A1F2A] p-3 rounded-lg text-left hover:bg-[#2A2F3A] transition-colors border border-[#2A2F3A] group h-[140px]"
                  >
                    <div className="mb-2">{template.icon}</div>
                    <h3 className="font-medium mb-1 group-hover:text-blue-400 text-sm">{template.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* All Templates */}
            <div>
              <h2 className="text-sm font-medium text-gray-400 mb-3">All web app templates</h2>
              <div className="space-y-1">
                {allWebTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1A1F2A] hover:bg-[#2A2F3A] text-left group"
                  >
                    <div className="flex-shrink-0">{template.icon}</div>
                    <div>
                      <h3 className="font-medium group-hover:text-blue-400 text-sm">{template.title}</h3>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
