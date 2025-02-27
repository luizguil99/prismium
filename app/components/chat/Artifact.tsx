import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';
import { Package, Loader, CheckCircle2, XCircle, Folder, Code, Terminal, ArrowRight, ExternalLink, Zap, Layers, FileCode2 } from 'lucide-react';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
}

export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      return Object.values(actions);
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find((action) => action.status !== 'complete');

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions]);

  const completedActionsCount = actions.filter(a => a.status === 'complete').length;
  const completionPercentage = actions.length ? Math.round((completedActionsCount / actions.length) * 100) : 100;

  return (
    <div className="artifact relative w-full">
      {/* Card container com efeitos visuais aprimorados */}
      <motion.div 
        className="relative w-full border border-bolt-elements-borderColor rounded-lg overflow-hidden transition-all duration-150"
        initial={{ opacity: 0.9, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Padrão de circuitos no canto superior esquerdo */}
        <div className="absolute left-0 top-0 w-32 h-32 opacity-10 overflow-hidden pointer-events-none">
          <div className="absolute w-[1px] h-16 bg-bolt-elements-borderColor top-2 left-6"></div>
          <div className="absolute w-[1px] h-12 bg-bolt-elements-borderColor top-8 left-12"></div>
          <div className="absolute w-[1px] h-8 bg-bolt-elements-borderColor top-4 left-18"></div>
          <div className="absolute w-12 h-[1px] bg-bolt-elements-borderColor top-6 left-2"></div>
          <div className="absolute w-8 h-[1px] bg-bolt-elements-borderColor top-12 left-8"></div>
          <div className="absolute w-2 h-2 rounded-full border border-bolt-elements-borderColor top-6 left-6"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full border border-bolt-elements-borderColor top-12 left-12"></div>
          <div className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor top-12 left-18"></div>
        </div>
        
        {/* Área de conteúdo principal com layout aprimorado */}
        <div className="flex relative">
          <button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden group"
            onClick={() => {
              const showWorkbench = workbenchStore.showWorkbench.get();
              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
          >
            {artifact.type == 'bundled' && (
              <>
                <div className="p-4 relative">
                  {/* Contêiner de ícone aprimorado com efeito de pulso */}
                  <div className="relative flex items-center justify-center w-12 h-12">
                    {/* Círculos concêntricos animados */}
                    <motion.div 
                      className="absolute w-12 h-12 border border-bolt-elements-borderColor rounded-full opacity-30"
                      animate={allActionFinished ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute w-9 h-9 border border-bolt-elements-borderColor rounded-full opacity-50"
                      animate={allActionFinished ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse", delay: 0.3 }}
                    ></motion.div>
                    
                    {/* Elementos decorativos para o ícone */}
                    <motion.div 
                      className="absolute w-14 h-14 opacity-20"
                      style={{ 
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)'
                      }}
                      animate={allActionFinished ? { scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] } : { scale: 1, opacity: 0.1 }}
                      transition={{ duration: 3, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse" }}
                    />
                    
                    {/* Pontos animados ao redor do ícone */}
                    {allActionFinished && (
                      <>
                        <motion.div 
                          className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                          style={{ top: '0px', left: '50%', transform: 'translateX(-50%)' }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                          style={{ top: '25%', right: '0px', transform: 'translateY(-50%)' }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                        <motion.div 
                          className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                          style={{ bottom: '0px', left: '50%', transform: 'translateX(-50%)' }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        />
                        <motion.div 
                          className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                          style={{ top: '25%', left: '0px', transform: 'translateY(-50%)' }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
                        />
                      </>
                    )}
                    
                    {allActionFinished ? (
                      <motion.div 
                        className="relative z-10 flex items-center justify-center"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Camada base do ícone */}
                          <div className="absolute -left-1 -top-1 text-bolt-elements-borderColor opacity-20">
                            <FileCode2 className="w-8 h-8" />
                          </div>
                          
                          {/* Camada principal do ícone */}
                          <div className="relative">
                            <Layers className="w-8 h-8" />
                            
                            {/* Efeito de brilho no ícone */}
                            <motion.div 
                              className="absolute -top-1 -right-1 w-3 h-3"
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            >
                              <Zap className="w-3 h-3 text-bolt-elements-borderColor" />
                            </motion.div>
                          </div>
                          
                          {/* Camada de destaque */}
                          <motion.div 
                            className="absolute -right-1 -bottom-1"
                            animate={{ rotate: [0, 5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </motion.div>
                          
                          {/* Efeito de brilho */}
                          <motion.div 
                            className="absolute inset-0 rounded-full"
                            style={{ 
                              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)'
                            }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="relative z-10 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Círculo de carregamento animado */}
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <motion.circle 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeDasharray="50"
                              strokeDashoffset="0"
                              className="text-bolt-elements-borderColor opacity-20"
                            />
                            <motion.circle 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeDasharray="50"
                              animate={{ strokeDashoffset: [0, 100] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="text-bolt-elements-borderColor opacity-70"
                            />
                          </svg>
                          
                          {/* Ícone central */}
                          <motion.div 
                            className="absolute"
                            animate={{ scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                          >
                            <Layers className="w-5 h-5" />
                            
                            {/* Pontos de progresso */}
                            <motion.div 
                              className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                              style={{ top: '0px', left: '50%', transform: 'translateX(-50%)' }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div 
                              className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                              style={{ top: '50%', right: '0px', transform: 'translateY(-50%)' }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}
                            />
                            <motion.div 
                              className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                              style={{ bottom: '0px', left: '50%', transform: 'translateX(-50%)' }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                            />
                            <motion.div 
                              className="absolute w-1 h-1 rounded-full bg-bolt-elements-borderColor"
                              style={{ top: '50%', left: '0px', transform: 'translateY(-50%)' }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.75 }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
              </>
            )}
            
            <div className="px-5 p-3.5 w-full text-left">
              {/* Conteúdo aprimorado com tipografia melhorada */}
              <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm pb-2 relative flex items-center">
                <span className="relative flex items-center gap-1.5">
                  {artifact?.title}
                  {isHovered && (
                    <motion.span
                      className="text-bolt-elements-textSecondary"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </motion.span>
                  )}
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-bolt-elements-borderColor opacity-30" 
                  style={{ 
                    backgroundImage: 'linear-gradient(to right, transparent, currentColor, transparent)',
                    backgroundSize: '8px 1px',
                    backgroundRepeat: 'repeat-x'
                  }}>
                </div>
              </div>
              
              {/* Área de "Click to open Workbench" com alinhamento melhorado */}
              <div className="w-full text-bolt-elements-textSecondary text-xs mt-1.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <motion.div 
                    animate={isHovered ? { x: [0, 2, 0] } : { x: 0 }}
                    transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </motion.div>
                  <span>Click to open Workbench</span>
                </div>
                
                {actions.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="relative w-16 h-1.5 bg-bolt-elements-borderColor bg-opacity-20 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute h-full bg-bolt-elements-borderColor opacity-50 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] opacity-70">{completionPercentage}%</span>
                  </div>
                )}
              </div>
            </div>
          </button>
          
          {/* Divisor aprimorado com padrão de pontos animados */}
          <div className="w-[1px] relative">
            <div className="absolute inset-y-0 left-0 w-[1px] bg-bolt-elements-artifacts-borderColor"></div>
            <motion.div 
              className="absolute top-[20%] left-0 w-[3px] h-[3px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }}
            ></motion.div>
            <motion.div 
              className="absolute top-[50%] left-0 w-[3px] h-[3px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse", delay: 0.2 }}
            ></motion.div>
            <motion.div 
              className="absolute top-[80%] left-0 w-[3px] h-[3px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse", delay: 0.4 }}
            ></motion.div>
          </div>
          
          <AnimatePresence>
            {actions.length && artifact.type !== 'bundled' && (
              <motion.button
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                exit={{ width: 0 }}
                transition={{ duration: 0.15, ease: cubicEasingFn }}
                className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover relative overflow-hidden"
                onClick={toggleActions}
              >
                <div className="p-4">
                  {/* Botão de alternância aprimorado com animação melhorada */}
                  <motion.div
                    animate={{ rotate: showActions ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "circOut" }}
                    className="relative"
                  >
                    <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
                    <motion.div 
                      className="absolute inset-0 border border-bolt-elements-borderColor rounded-full opacity-0"
                      animate={isHovered ? { opacity: 0.3, scale: [1, 1.3, 1] } : { opacity: 0 }}
                      transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
                    ></motion.div>
                  </motion.div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Indicador de progresso aprimorado */}
        <div className="absolute left-0 bottom-0 h-[2px] w-full">
          <div className="relative h-full w-full overflow-hidden">
            <motion.div 
              className="absolute h-full bg-bolt-elements-borderColor opacity-50"
              initial={{ width: "0%" }}
              animate={{ width: actions.length ? (actions.filter(a => a.status === 'complete').length / actions.length) * 100 + "%" : "100%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {isHovered && actions.length > 0 && (
              <motion.div 
                className="absolute h-full bg-bolt-elements-borderColor"
                initial={{ opacity: 0, width: "0%", x: -10 }}
                animate={{ 
                  opacity: [0, 0.8, 0], 
                  width: "30%", 
                  x: ["0%", "100%"] 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
          <motion.div
            className="actions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "circOut" }}
          >
            <div className="h-[8px]"></div>
            <div className="p-5 text-left bg-bolt-elements-actions-background border border-bolt-elements-borderColor rounded-lg relative">
              {/* Elemento decorativo para o painel de ações */}
              <div className="absolute right-0 top-0 w-24 h-24 opacity-5 overflow-hidden pointer-events-none">
                {actions.some(a => a.status === 'complete') && (
                  <motion.div
                    className="absolute w-24 h-24 border border-bolt-elements-borderColor rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  ></motion.div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-bolt-elements-textSecondary border-b border-bolt-elements-borderColor border-opacity-20 pb-1">
                  EXECUTION TRACE
                </div>
                <div className="text-xs text-bolt-elements-textSecondary">
                  {completedActionsCount}/{actions.length} completed
                </div>
              </div>
              
              <ActionList actions={actions} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={classNames('text-xs leading-none flex-1', classsName)}
        dangerouslySetInnerHTML={{
          __html: shellHighlighter.codeToHtml(code, {
            lang: 'shell',
            theme: 'dark-plus',
            transformers: [
              {
                pre(node) {
                  node.properties.style = 'background:transparent;color:#D4D4D4;padding:0;margin:0;white-space:pre-wrap';
                },
              },
            ],
          }),
        }}
      ></div>
    </div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <div className="bg-black p-4 rounded-lg backdrop-filter backdrop-blur-sm bg-opacity-90">
        <ul className="list-none space-y-4">
          {actions.map((action, index) => {
            const { status, type, content } = action;
            const isLast = index === actions.length - 1;
            const isCompleted = status === 'complete';
            const isFailed = status === 'failed' || status === 'aborted';
            const isRunning = status === 'running';

            // Determine appropriate icon based on action type
            let ActionIcon = Package;
            if (type === 'file') ActionIcon = Code;
            if (type === 'shell') ActionIcon = Terminal;
            
            return (
              <motion.li
                key={index}
                variants={actionVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ x: 2 }}
                transition={{
                  duration: 0.2,
                  ease: cubicEasingFn,
                  delay: index * 0.03,
                }}
                className="relative"
              >
                {/* Timeline connector between items */}
                {!isLast && (
                  <div className="absolute left-2 top-6 w-[1px] h-[calc(100%+16px)] bg-bolt-elements-borderColor opacity-20"></div>
                )}
                
                <div className="flex items-center justify-between gap-1.5 text-sm relative">
                  {type === 'file' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Folder className="w-4 h-4 text-[#3B82F6]" />
                        {isRunning && (
                          <motion.div
                            className="absolute inset-0 rounded-full border border-[#3B82F6]"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <code
                        onClick={() => openArtifactInWorkbench(action.filePath)}
                        className="text-sm cursor-pointer hover:underline flex items-center gap-1 group"
                      >
                        {action.filePath.includes('/') ? (
                          <>
                            <span className="text-gray-400">src/</span>
                            <span>{action.filePath.split('/').pop()}</span>
                            <motion.span 
                              className="text-bolt-elements-textSecondary opacity-0 group-hover:opacity-100"
                              initial={{ x: -5 }}
                              animate={{ x: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowRight className="w-3 h-3" />
                            </motion.span>
                          </>
                        ) : (
                          <span className="flex items-center gap-1">
                            {action.filePath}
                            <motion.span 
                              className="text-bolt-elements-textSecondary opacity-0 group-hover:opacity-100"
                              initial={{ x: -5 }}
                              animate={{ x: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowRight className="w-3 h-3" />
                            </motion.span>
                          </span>
                        )}
                      </code>
                    </div>
                  ) : type === 'shell' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {status === 'running' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Package className="w-4 h-4 text-green-500" />
                          </motion.div>
                        ) : (
                          <Package className="w-4 h-4 text-green-500" />
                        )}
                        {isRunning && (
                          <motion.div
                            className="absolute inset-0 rounded-full border border-green-500"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <ShellCodeBlock code={content} />
                    </div>
                  ) : type === 'start' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Package className="w-4 h-4 text-green-500" />
                        </motion.div>
                        {isRunning && (
                          <motion.div
                            className="absolute inset-0 rounded-full border border-green-500"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <span className="text-white">Start Application</span>
                    </div>
                  ) : null}
                  <div className={classNames('text-lg', getIconColor(action.status))}>
                    {status === 'running' ? (
                      <>
                        {type !== 'start' ? (
                          <div className="relative">
                            <Loader className="w-4 h-4 animate-spin text-gray-500" />
                            <motion.div 
                              className="absolute inset-0 rounded-full border border-gray-500"
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <Terminal className="w-4 h-4 text-green-500" />
                            <motion.div 
                              className="absolute inset-0 rounded-full border border-green-500"
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </div>
                        )}
                      </>
                    ) : status === 'pending' ? (
                      <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                    ) : status === 'complete' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </motion.div>
                    ) : status === 'failed' || status === 'aborted' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </motion.div>
                    ) : null}
                  </div>
                </div>
                {type === 'start' && (
                  <motion.div 
                    className="mt-4 pl-6 border-l border-bolt-elements-borderColor border-opacity-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <ShellCodeBlock code={content} />
                  </motion.div>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div >
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return 'text-bolt-elements-icon-success';
    }
  }
}
