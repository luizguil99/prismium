import { X, Code2, ChevronRight } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
}

export function CreateProjectModal({ isOpen, onClose, templateType }: CreateProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#11161E] to-[#0B0E14] border border-[#2A2F3A]/50 rounded-xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
        <div className="absolute right-4 top-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors group">
            <X size={20} className="text-[#8B98A9] group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-[#D9DFE7] text-2xl font-semibold">Create New {templateType} Project</h2>
            </div>
            <p className="text-[#8B98A9] text-base">
              Configure your project settings to get started with {templateType}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[#8B98A9] text-sm font-medium uppercase tracking-wider mb-4">Select Language</h3>

              <button className="w-full group flex items-center justify-between p-4 rounded-lg border border-[#2A2F3A]/50 bg-[#151922]/50 hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-mono text-sm font-bold">JS</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-[#D9DFE7] font-medium">JavaScript</h4>
                    <p className="text-[#8B98A9] text-sm">Build with JavaScript + Node.js</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8B98A9] group-hover:text-blue-400 transition-colors" />
              </button>

              <button className="w-full group flex items-center justify-between p-4 rounded-lg border border-[#2A2F3A]/50 bg-[#151922]/50 hover:bg-[#1F2937]/80 hover:border-blue-500/30 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-mono text-sm font-bold">TS</span>
                  </div>
                  <div className="text-left">
                    <h4 className="text-[#D9DFE7] font-medium">TypeScript</h4>
                    <p className="text-[#8B98A9] text-sm">Build with TypeScript + Node.js</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8B98A9] group-hover:text-blue-400 transition-colors" />
              </button>
            </div>

            <div className="pt-6">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Create Project
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
