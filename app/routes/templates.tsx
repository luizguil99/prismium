import { ChevronRight, Search, ArrowRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { CreateProjectModal } from '~/components/CreateProjectModal';

// Importando as logos
import logoAngular from '~/lib/png/logo_angular.svg.png';
import logoAstro from '~/lib/png/logo_astro.svg.png';
import logoNextjs from '~/lib/png/logo_nextjs.svg.png';
import logoReact from '~/lib/png/logo_react.svg.png';
import logoVue from '~/lib/png/logo_vue.svg fill@2x.png';

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
    id: 'vue',
    title: 'Vue',
    description: 'Crie um novo app Vue em TypeScript ou JavaScript usando Vite',
    icon: <img src={logoVue} alt="Vue" className="w-8 h-8" />,
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
    id: 'vue',
    title: 'Vue',
    description: 'Crie um novo app Vue em TypeScript ou JavaScript usando Vite',
    icon: <img src={logoVue} alt="Vue" className="w-8 h-8" />,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateClick = (templateName: string) => {
    setSelectedTemplate(templateName);
    setIsModalOpen(true);
  };

  const nextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % featuredTemplates.length);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const prevCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + featuredTemplates.length) % featuredTemplates.length);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const visibleTemplates = () => {
    const templates = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % featuredTemplates.length;
      templates.push(featuredTemplates[index]);
    }
    return templates;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E14] to-[#151922] text-white">
      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateType={selectedTemplate}
      />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Header com Dashboard e Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4 border-b border-[#2A2F3A]/20">
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            <ChevronRight size={16} className="text-blue-500" />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors"
              size={16}
            />
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
                  <category.icon
                    size={16}
                    className="text-blue-500/70 group-hover:translate-x-1 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Container dos Templates */}
          <div className="flex-1 space-y-16">
            {/* Featured Templates */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#8B98A9] font-['Segoe UI'] text-sm font-medium uppercase tracking-wider">
                  Featured Templates
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevCard}
                    disabled={isAnimating}
                    className="p-2 rounded-lg bg-[#1A1F2A]/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextCard}
                    disabled={isAnimating}
                    className="p-2 rounded-lg bg-[#1A1F2A]/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="relative overflow-hidden">
                <div
                  className={`grid grid-cols-3 gap-4 transition-all duration-200 ease-in-out transform ${
                    isAnimating ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100'
                  }`}
                >
                  {visibleTemplates().map((template) => (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => handleTemplateClick(template.title)}
                      className="group relative flex flex-col h-[180px] bg-[#11161E]/60 backdrop-blur-sm border border-[#2A2F3A]/50 rounded-xl text-left hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200 p-5 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col h-full">
                        <div className="mb-3 transform group-hover:translate-x-1 transition-transform duration-200">
                          {template.icon}
                        </div>
                        <div className="mt-auto">
                          <h3 className="text-[#D9DFE7] font-['Segoe UI'] text-lg font-semibold leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                            {template.title}
                          </h3>
                          <p className="text-[#8B98A9] text-sm leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors mb-3">
                            {template.description}
                          </p>
                          <div className="flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Get started</span>
                            <ArrowRight
                              size={16}
                              className="ml-2 transform group-hover:translate-x-1 transition-transform"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
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
                    onClick={() => handleTemplateClick(template.title)}
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
                      <ChevronRight
                        size={16}
                        className="ml-auto text-gray-500 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all"
                      />
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
