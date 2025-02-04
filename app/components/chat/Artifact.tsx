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
import { Package, Loader, CheckCircle2, XCircle, Folder } from 'lucide-react';

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

  return (
    <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
      <div className="flex">
        <button
          className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
          onClick={() => {
            const showWorkbench = workbenchStore.showWorkbench.get();
            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          {artifact.type == 'bundled' && (
            <>
              <div className="p-4">
                {allActionFinished ? (
                  <div className={'i-ph:files-light'} style={{ fontSize: '2rem' }}></div>
                ) : (
                  <div className={'i-svg-spinners:90-ring-with-bg'} style={{ fontSize: '2rem' }}></div>
                )}
              </div>
              <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
            </>
          )}
          <div className="px-5 p-3.5 w-full text-left">
            <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">{artifact?.title}</div>
            <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">Click to open Workbench</div>
          </div>
        </button>
        <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />
        <AnimatePresence>
          {actions.length && artifact.type !== 'bundled' && (
            <motion.button
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.15, ease: cubicEasingFn }}
              className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
              onClick={toggleActions}
            >
              <div className="p-4">
                <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
          <motion.div
            className="actions"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: '0px' }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

            <div className="p-5 text-left bg-bolt-elements-actions-background">
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
      <div className="bg-black p-4 rounded-lg">
        <ul className="list-none space-y-4">
          {actions.map((action, index) => {
            const { status, type, content } = action;
            const isLast = index === actions.length - 1;

            return (
              <motion.li
                key={index}
                variants={actionVariants}
                initial="hidden"
                animate="visible"
                transition={{
                  duration: 0.2,
                  ease: cubicEasingFn,
                }}
              >
                <div className="flex items-center justify-between gap-1.5 text-sm">
                  {type === 'file' ? (
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-[#3B82F6]" />
                      <code
                        onClick={() => openArtifactInWorkbench(action.filePath)}
                        className="text-sm cursor-pointer hover:underline"
                      >
                        {action.filePath.includes('/') ? (
                          <>
                            <span className="text-gray-400">src/</span>
                            <span>{action.filePath.split('/').pop()}</span>
                          </>
                        ) : (
                          action.filePath
                        )}
                      </code>
                    </div>
                  ) : type === 'shell' ? (
                    <div className="flex items-center gap-2">
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
                      <ShellCodeBlock code={content} />
                    </div>
                  ) : type === 'start' ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Package className="w-4 h-4 text-green-500" />
                      </motion.div>
                      <span className="text-white">Start Application</span>
                    </div>
                  ) : null}
                  <div className={classNames('text-lg', getIconColor(action.status))}>
                    {status === 'running' ? (
                      <Loader className="w-4 h-4 animate-spin text-gray-500" />
                    ) : status === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 " />
                    ) : status === 'failed' || status === 'aborted' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {type === 'start' && (
                  <div className="mt-4 pl-6 ">
                    <ShellCodeBlock  code={content} />
                  </div>
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
      return undefined;
    }
  }
}
