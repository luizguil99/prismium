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
import { Package, Loader, CheckCircle2, XCircle, Folder, Code, Terminal, ArrowRight, ExternalLink, Zap, Cpu, Layers } from 'lucide-react';

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
    <div className="artifact relative w-full my-2">
      {/* Card container with enhanced 3D effect and neuomorphic design */}
      <motion.div 
        className="relative w-full border border-bolt-elements-borderColor rounded-xl overflow-hidden transition-all duration-200"
        initial={{ opacity: 0.9, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          boxShadow: isHovered 
            ? '0 10px 25px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.08)'
            : '0 4px 15px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Abstract decorative circuit-like pattern */}
        <div className="absolute left-0 top-0 w-32 h-32 opacity-10 overflow-hidden pointer-events-none">
          <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-bolt-elements-borderColor">
            <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"/>
            <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
            <path d="M80 20L80 140" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"/>
            <path d="M20 80L140 80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"/>
            <path d="M40 40L120 120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"/>
            <path d="M120 40L40 120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4"/>
            <circle cx="80" cy="80" r="10" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        </div>
        
        {/* Main content area with improved layout */}
        <div className="flex relative bg-gradient-to-r from-transparent via-bolt-elements-artifacts-background to-transparent bg-opacity-80">
          <button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden group transition-all duration-300"
            onClick={() => {
              const showWorkbench = workbenchStore.showWorkbench.get();
              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
          >
            {artifact.type == 'bundled' && (
              <>
                <div className="p-4 relative">
                  {/* Improved icon container with dynamic pulse effect */}
                  <div className="relative flex items-center justify-center">
                    <motion.div 
                      className="absolute w-12 h-12 border border-bolt-elements-borderColor rounded-full opacity-30"
                      animate={allActionFinished ? { scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] } : { scale: 1 }}
                      transition={{ duration: 2.5, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse" }}
                    ></motion.div>
                    <motion.div 
                      className="absolute w-9 h-9 border border-bolt-elements-borderColor rounded-full opacity-50"
                      animate={allActionFinished ? { scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse", delay: 0.3 }}
                    ></motion.div>
                    <motion.div 
                      className="absolute w-6 h-6 border border-bolt-elements-borderColor rounded-full opacity-70"
                      animate={allActionFinished ? { scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] } : { scale: 1 }}
                      transition={{ duration: 1.5, repeat: allActionFinished ? Infinity : 0, repeatType: "reverse", delay: 0.5 }}
                    ></motion.div>
                    {allActionFinished ? (
                      <motion.div 
                        className="relative"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className={'i-ph:files-light'} style={{ fontSize: '2rem' }}></div>
                        <motion.div
                          className="absolute -top-1 -right-1 text-bolt-elements-icon-success"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="z-10"
                        >
                          <div className={'i-svg-spinners:90-ring-with-bg'} style={{ fontSize: '2rem' }}></div>
                        </motion.div>
                        <motion.div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Cpu className="w-4 h-4" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
              </>
            )}
            
            <div className="px-5 py-4 w-full text-left">
              {/* Enhanced content with improved typography and visual elements */}
              <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm pb-2 relative flex items-center">
                <div className="flex items-center gap-2">
                  {artifact.type !== 'bundled' && (
                    <motion.div
                      animate={isHovered ? { rotate: [0, 5, 0] } : {}}
                      transition={{ duration: 0.5, repeat: 0 }}
                    >
                      <Layers className="w-4 h-4 text-bolt-elements-textSecondary opacity-70" />
                    </motion.div>
                  )}
                  <span className="relative tracking-wide">
                    {artifact?.title}
                    {isHovered && (
                      <motion.span
                        className="absolute -right-5 top-1/2 transform -translate-y-1/2 text-bolt-elements-textSecondary"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </motion.span>
                    )}
                    <motion.div 
                      className="absolute -bottom-1 left-0 h-[1px] bg-bolt-elements-borderColor" 
                      initial={{ width: "0%" }}
                      animate={{ width: isHovered ? "100%" : "50%" }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        backgroundImage: 'linear-gradient(to right, currentColor, transparent)',
                      }}
                    />
                  </span>
                </div>
              </div>

              <div className="w-full text-bolt-elements-textSecondary text-xs mt-3 flex items-center gap-2">
                <motion.div 
                  className="relative z-10 flex items-center gap-1"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Click to open Workbench</span>
                </motion.div>
                
                {actions.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="relative w-20 h-2 bg-bolt-elements-borderColor bg-opacity-10 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute h-full bg-bolt-elements-borderColor opacity-50 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      {isHovered && (
                        <motion.div 
                          className="absolute top-0 bottom-0 left-0 w-full opacity-20"
                          style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                          }}
                          animate={{ 
                            x: ["-100%", "100%"] 
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      )}
                    </div>
                    <motion.div 
                      className="relative text-[10px] bg-bolt-elements-borderColor bg-opacity-10 px-2 py-0.5 rounded-full"
                      whileHover={{ scale: 1.05 }}
                    >
                      {completionPercentage}%
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </button>
          
          {/* Enhanced divider with animated elements */}
          <div className="w-[1px] relative">
            <div className="absolute inset-y-0 left-0 w-[1px] bg-bolt-elements-artifacts-borderColor opacity-70"></div>
            <motion.div 
              className="absolute top-[20%] left-0 w-[3px] h-[3px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }}
            ></motion.div>
            <motion.div 
              className="absolute top-[40%] left-0 w-[2px] h-[2px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse", delay: 0.1 }}
            ></motion.div>
            <motion.div 
              className="absolute top-[60%] left-0 w-[4px] h-[4px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse", delay: 0.2 }}
            ></motion.div>
            <motion.div 
              className="absolute top-[80%] left-0 w-[2px] h-[2px] bg-bolt-elements-artifacts-borderColor rounded-full" 
              style={{ transform: 'translateX(-50%)' }}
              animate={isHovered ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, repeatType: "reverse", delay: 0.3 }}
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
                  {/* Enhanced toggle button with pulse effect */}
                  <motion.div
                    animate={{ rotate: showActions ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "circOut" }}
                    className="relative"
                  >
                    <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
                    <motion.div 
                      className="absolute inset-0 border border-bolt-elements-borderColor rounded-full opacity-0"
                      animate={isHovered ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] } : { opacity: 0 }}
                      transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
                    ></motion.div>
                  </motion.div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Enhanced progress indicator with fancy animation */}
        <div className="absolute left-0 bottom-0 h-[2px] w-full overflow-hidden">
          <div className="relative h-full w-full overflow-hidden">
            <motion.div 
              className="absolute h-full bg-bolt-elements-borderColor opacity-50"
              initial={{ width: "0%" }}
              animate={{ width: actions.length ? (actions.filter(a => a.status === 'complete').length / actions.length) * 100 + "%" : "100%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {isHovered && actions.length > 0 && (
              <>
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
                <motion.div 
                  className="absolute h-full bg-bolt-elements-borderColor"
                  initial={{ opacity: 0, width: "0%", x: -10 }}
                  animate={{ 
                    opacity: [0, 0.5, 0], 
                    width: "20%", 
                    x: ["10%", "100%"] 
                  }}
                  transition={{ 
                    duration: 1.8, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4
                  }}
                />
              </>
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
            transition={{ duration: 0.3, ease: "circOut" }}
          >
            <div className="h-[8px]"></div>
            <div className="p-5 text-left bg-bolt-elements-actions-background border border-bolt-elements-borderColor rounded-lg relative backdrop-blur-sm backdrop-filter">
              {/* Decorative element for the actions panel */}
              <div className="absolute right-0 top-0 w-full h-full opacity-5 overflow-hidden pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-bolt-elements-borderColor">
                  <path d="M0 50H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 100H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 150H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 200H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 250H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 300H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M0 350H400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M50 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M100 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M150 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M200 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M250 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M300 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                  <path d="M350 0V400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8"/>
                </svg>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="relative px-3 py-1 text-xs text-bolt-elements-textSecondary border-b border-bolt-elements-borderColor border-opacity-20 pb-1 font-medium tracking-wider">
                  <motion.div 
                    className="absolute inset-0 border border-bolt-elements-borderColor opacity-10 rounded-md" 
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  EXECUTION TRACE
                </div>
                <div className="text-xs text-bolt-elements-textSecondary flex items-center gap-2">
                  <motion.div 
                    className="w-3 h-3 rounded-full opacity-50"
                    style={{ 
                      background: allActionFinished 
                        ? 'linear-gradient(to right, #4ADE80, #22C55E)' 
                        : 'linear-gradient(to right, #FACC15, #EAB308)' 
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span>{completedActionsCount}/{actions.length} completed</span>
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
      <div className="bg-black bg-opacity-90 p-4 rounded-lg backdrop-filter backdrop-blur-sm border border-bolt-elements-borderColor border-opacity-10">
        <ul className="list-none space-y-4 relative">
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
                transition={{
                  duration: 0.2,
                  ease: cubicEasingFn,
                  delay: index * 0.05,
                }}
                className="relative flex items-start pl-7"
              >
                {/* Linha conectora vertical entre os itens */}
                {!isLast && (
                  <div className="absolute left-3 top-[18px] w-[1px] h-[calc(100%+8px)]">
                    <div className="w-full h-full bg-bolt-elements-borderColor opacity-30"></div>
                  </div>
                )}
                
                {/* Círculo para cada item da timeline */}
                <div className="absolute left-3 top-[9px] w-[5px] h-[5px] rounded-full bg-bolt-elements-borderColor bg-opacity-70 z-10 transform -translate-x-1/2"></div>
                
                {/* Área de conteúdo */}
                <div className="flex-1">
                  <div className="relative flex items-center justify-between gap-1.5 text-sm group">
                    <motion.div 
                      whileHover={{ x: 3 }}
                      className="flex-1 flex items-center justify-between"
                    >
                      {type === 'file' ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Folder className="w-4 h-4 text-[#3B82F6]" />
                            {isRunning && (
                              <motion.div
                                className="absolute inset-0 rounded-full border border-[#3B82F6]"
                                animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                          </div>
                          <code
                            onClick={() => openArtifactInWorkbench(action.filePath)}
                            className="relative text-sm cursor-pointer hover:underline flex items-center gap-1 group"
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
                            <motion.div 
                              className="absolute -bottom-1 left-0 h-[1px] bg-[#3B82F6] opacity-20" 
                              initial={{ width: "0%" }}
                              animate={{ width: isRunning ? "100%" : "0%" }}
                              transition={{ duration: 1.5, repeat: isRunning ? Infinity : 0, repeatType: "reverse" }}
                            />
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
                                animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
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
                                animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                          </div>
                          <span className="text-white">Start Application</span>
                        </div>
                      ) : null}
                      <div className={classNames('text-lg', getIconColor(action.status))}>
                        {status === 'running' ? (
                          <div className="relative">
                            <Loader className="w-4 h-4 animate-spin text-gray-500" />
                            <motion.div 
                              className="absolute inset-0 rounded-full border border-gray-500"
                              animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </div>
                        ) : status === 'complete' || (type === 'start' && status !== 'failed') ? (
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
                    </motion.div>
                  </div>
                  {type === 'start' && (
                    <motion.div 
                      className="mt-4 ml-1 pl-6 border-l border-bolt-elements-borderColor border-opacity-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="relative">
                        <ShellCodeBlock code={content} />
                        {isRunning && (
                          <motion.div 
                            className="absolute -left-3 top-0 bottom-0 w-[1px] bg-bolt-elements-borderColor opacity-30"
                            style={{ 
                              backgroundImage: 'linear-gradient(to bottom, transparent, currentColor, transparent)',
                              backgroundSize: '1px 8px'
                            }}
                            animate={{ 
                              backgroundPosition: ['0px 0px', '0px 16px']
                            }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
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

