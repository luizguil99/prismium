import { ChevronLeft, ChevronRight } from 'lucide-react';
import logoReact from '../../lib/png/logo_react.svg.png';
import logoNextjs from '../../lib/png/logo_nextjs.svg.png';
import logoVue from '../../lib/png/logo_vue.svg fill@2x.png';

export default function FeaturedTemplates({ handlePromptAndClone }) {
  return (
    <div className="mt-12 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#8B98A9] font-['Segoe UI'] text-sm font-medium uppercase tracking-wider">
          Featured Templates
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-black/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 rounded-lg bg-black/60 border border-[#2A2F3A]/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'react',
              title: 'React',
              description: 'App React com TypeScript + Vite',
              icon: logoReact,
            },
            {
              id: 'nextjs',
              title: 'Next.js',
              description: 'App Next.js com TypeScript',
              icon: logoNextjs,
            },
            {
              id: 'vue',
              title: 'Vue',
              description: 'App Vue com TypeScript + Vite',
              icon: logoVue,
            },
          ].map((template) => (
            <button
              key={template.id}
              onClick={() => handlePromptAndClone(template.title)}
              className="group relative flex flex-col h-[180px] bg-black/60 backdrop-blur-sm border border-[#2A2F3A]/50 rounded-xl text-left hover:bg-black/80 hover:border-blue-500/30 transition-all duration-200 p-5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col h-full">
                <div className="mb-3 transform group-hover:translate-x-1 transition-transform duration-200">
                  <img src={template.icon} alt={template.title} className="w-8 h-8" />
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
                    <ChevronRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
