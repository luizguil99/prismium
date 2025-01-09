import { ChevronRight, Search } from 'lucide-react';

// Importando as logos
import logoAngular from '../lib/png/logo_angular.svg.png';
import logoAstro from '../lib/png/logo_astro.svg.png';
import logoNextjs from '../lib/png/logo_nextjs.svg.png';
import logoReact from '../lib/png/logo_react.svg.png';

// Tipos para os templates
interface Template {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: React.ReactNode;
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
    icon: <img src={logoAngular} alt="Angular" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'nextjs',
    title: 'Next.js',
    description: 'Crie um app full-stack NextJS com TypeScript ou JavaScript e renderização server-side',
    icon: <img src={logoNextjs} alt="NextJS" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'astro',
    title: 'Astro',
    description: 'Crie um app web full-stack com Astro, um framework que oferece superpoderes focados em conteúdo',
    icon: <img src={logoAstro} alt="Astro" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'react',
    title: 'React',
    description: 'Crie um novo app React em TypeScript ou JavaScript usando Vite',
    icon: <img src={logoReact} alt="React" className="w-8 h-8" />,
    type: 'web-app',
  },
];

// Todos os templates web
const allWebTemplates = [
  {
    id: 'react',
    title: 'React',
    description: 'Crie um novo app React em TypeScript ou JavaScript usando Vite',
    icon: <img src={logoReact} alt="React" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'nextjs',
    title: 'Next.js',
    description: 'Crie um app full-stack NextJS com TypeScript ou JavaScript e renderização server-side',
    icon: <img src={logoNextjs} alt="NextJS" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'angular',
    title: 'Angular',
    description: 'Crie um novo app Angular em TypeScript usando ng-cli',
    icon: <img src={logoAngular} alt="Angular" className="w-8 h-8" />,
    type: 'web-app',
  },
  {
    id: 'astro',
    title: 'Astro',
    description: 'Crie um app web full-stack com Astro, um framework que oferece superpoderes focados em conteúdo',
    icon: <img src={logoAstro} alt="Astro" className="w-8 h-8" />,
    type: 'web-app',
  },
];

export default function Templates() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#151922] text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Header com Dashboard e Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4 border-b border-[#2A2F3A]/20">
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <ChevronRight size={16} className="text-blue-500" />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search templates..."
              className="bg-[#1A1F2A]/60 backdrop-blur-sm border border-[#2A2F3A]/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 w-[280px] transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Layout Principal */}
        <div className="flex flex-col lg:flex-row gap-12 mt-8">
          {/* Título e Menu Lateral */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
            <div className="mb-10">
              <h1 className="text-[#D9DFE7] font-['Inter'] text-5xl font-extralight leading-[1.2] mb-4">
                Templates
                <span className="block text-blue-400/80 text-lg font-normal mt-2">Start your next project</span>
              </h1>
              <p className="text-[#8B98A9] font-['Segoe UI'] text-base leading-relaxed">
                Choose from our hand-crafted templates to kickstart your development
              </p>
            </div>

            {/* Categorias */}
            <div className="space-y-2 mb-8 lg:mb-0 sticky top-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#1A1F2A]/60 backdrop-blur-sm border border-[#2A2F3A]/50 text-gray-300 hover:bg-[#2A2F3A]/80 hover:text-white hover:border-blue-500/30 transition-all duration-200 group"
                >
                  <span className="font-medium">{category.title}</span>
                  <category.icon size={16} className="text-blue-500/70 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Container dos Templates */}
          <div className="flex-1 space-y-16">
            {/* Featured Templates */}
            <div>
              <h2 className="text-[#8B98A9] font-['Segoe UI'] text-sm font-medium uppercase tracking-wider mb-6">
                Featured Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="group relative flex flex-col h-[200px] bg-[#11161E]/60 backdrop-blur-sm border border-[#2A2F3A]/50 rounded-xl text-left hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200 p-6 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="mb-auto transform group-hover:scale-110 transition-transform duration-200">
                        {template.icon}
                      </div>
                      <div className="mt-auto">
                        <h3 className="text-[#D9DFE7] font-['Segoe UI'] text-lg font-semibold leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-[#8B98A9] text-sm leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Templates */}
            <div>
              <h2 className="text-[#8B98A9] font-['Segoe UI'] text-sm font-medium uppercase tracking-wider mb-6">
                All Templates
              </h2>
              <div className="space-y-3">
                {allWebTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full group relative flex items-center gap-6 px-6 py-4 rounded-xl bg-[#11161E]/60 backdrop-blur-sm border border-[#2A2F3A]/50 hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    <div className="relative flex items-center gap-6 w-full">
                      <div className="flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200">
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="text-[#D9DFE7] font-['Segoe UI'] text-lg font-semibold leading-tight mb-1 group-hover:text-blue-400 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-[#8B98A9] text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                          {template.description}
                        </p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-gray-500 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
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
