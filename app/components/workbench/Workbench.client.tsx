// Importações necessárias para o componente
import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Tipos para callbacks do editor
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';

// Componentes UI
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';

// Stores e utilitários
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { supabaseStore } from '~/lib/stores/supabase';
import { SupabaseConfigModal } from '../supabase/SupabaseConfigModal';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';

// Componentes do Workbench
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import { ComponentsModal } from './ComponentsModal';
import useViewport from '~/lib/hooks';
import Cookies from 'js-cookie';

// Interface de props do Workbench
interface WorkspaceProps {
  chatStarted?: boolean; // Indica se o chat foi iniciado
  isStreaming?: boolean; // Indica se está streamando conteúdo
  onSendMessage?: (event: React.UIEvent, message: string) => void; // Callback para enviar mensagem
}

// Configuração da transição de visualização
const viewTransition = { ease: cubicEasingFn };

// Opções do slider para alternar entre código e preview
const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

// Variantes de animação para abrir/fechar o workbench
const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

// Componente principal do Workbench
export const Workbench = memo(({ chatStarted, isStreaming, onSendMessage }: WorkspaceProps) => {
  renderLogger.trace('Workbench'); // Log de renderização

  // Estados locais
  const [isSyncing, setIsSyncing] = useState(false); // Estado de sincronização
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false); // Estado do modal Supabase
  const [componentsModalOpen, setComponentsModalOpen] = useState(false);

  // Estados do store
  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);

  // Hook para viewport responsivo
  const isSmallViewport = useViewport(1024);

  // Função para alterar a visualização (code/preview)
  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };

  // Efeito para mostrar preview quando disponível
  useEffect(() => {
    if (hasPreview) {
      setSelectedView('preview');
    }
  }, [hasPreview]);

  // Efeito para atualizar documentos quando os arquivos mudam
  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  // Callbacks para eventos do editor
  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      toast.error('Failed to update file content');
    });
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const handleSyncFiles = useCallback(async () => {
    setIsSyncing(true);

    try {
      const directoryHandle = await window.showDirectoryPicker();
      await workbenchStore.syncFiles(directoryHandle);
      toast.success('Files synced successfully');
    } catch (error) {
      console.error('Error syncing files:', error);
      toast.error('Failed to sync files');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Renderização do componente
  return (
    chatStarted && (
      <motion.div
        initial="closed"
        animate={showWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-workbench"
      >
        <div
          className={classNames(
            'fixed top-[calc(var(--header-height)+1.5rem)] bottom-6 w-[var(--workbench-inner-width)] mr-4 z-0 transition-[left,width] duration-200 bolt-ease-cubic-bezier',
            {
              'w-full': isSmallViewport,
              'left-0': showWorkbench && isSmallViewport,
              'left-[var(--workbench-left)]': showWorkbench,
              'left-[100%]': !showWorkbench,
            },
          )}
        >
          <div className="absolute inset-0 px-2 lg:px-6">
            <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm rounded-lg overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                <div className="ml-auto" />
                {selectedView === 'code' && (
                  <div className="flex overflow-y-auto">
                    <PanelHeaderButton className="mr-1 text-sm" onClick={() => setComponentsModalOpen(true)}>
                      <div className="i-ph:puzzle-piece-duotone" />
                      Components
                    </PanelHeaderButton>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.downloadZip();
                      }}
                    >
                      <div className="i-ph:code" />
                      Download Code
                    </PanelHeaderButton>
                    <PanelHeaderButton className="mr-1 text-sm" onClick={handleSyncFiles} disabled={isSyncing}>
                      {isSyncing ? <div className="i-ph:spinner" /> : <div className="i-ph:cloud-arrow-down" />}
                      {isSyncing ? 'Syncing...' : 'Sync Files'}
                    </PanelHeaderButton>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                      }}
                    >
                      <div className="i-ph:terminal" />
                      Toggle Terminal
                    </PanelHeaderButton>
                    <PanelHeaderButton
                      className={`mr-1 text-sm ${supabaseStore.isConnected.get() ? 'text-green-400' : ''}`}
                      onClick={() => setSupabaseModalOpen(true)}
                    >
                      <div className="i-ph:database" />
                      {supabaseStore.isConnected.get() ? 'Connected to Supabase' : 'Connect Supabase'}
                    </PanelHeaderButton>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        const repoName = prompt(
                          'Please enter a name for your new GitHub repository:',
                          'bolt-generated-project',
                        );

                        if (!repoName) {
                          alert('Repository name is required. Push to GitHub cancelled.');
                          return;
                        }

                        const githubUsername = Cookies.get('githubUsername');
                        const githubToken = Cookies.get('githubToken');

                        if (!githubUsername || !githubToken) {
                          const usernameInput = prompt('Please enter your GitHub username:');
                          const tokenInput = prompt('Please enter your GitHub personal access token:');

                          if (!usernameInput || !tokenInput) {
                            alert('GitHub username and token are required. Push to GitHub cancelled.');
                            return;
                          }

                          workbenchStore.pushToGitHub(repoName, usernameInput, tokenInput);
                        } else {
                          workbenchStore.pushToGitHub(repoName, githubUsername, githubToken);
                        }
                      }}
                    >
                      <div className="i-ph:github-logo" />
                      Push to GitHub
                    </PanelHeaderButton>
                  </div>
                )}
                <IconButton
                  icon="i-ph:x-circle"
                  className="-mr-1"
                  size="xl"
                  onClick={() => {
                    workbenchStore.showWorkbench.set(false);
                  }}
                />
              </div>
              <div className="relative flex-1 overflow-hidden">
                <View
                  initial={{ x: selectedView === 'code' ? 0 : '-100%' }}
                  animate={{ x: selectedView === 'code' ? 0 : '-100%' }}
                >
                  <EditorPanel
                    editorDocument={currentDocument}
                    isStreaming={isStreaming}
                    selectedFile={selectedFile}
                    files={files}
                    unsavedFiles={unsavedFiles}
                    onFileSelect={onFileSelect}
                    onEditorScroll={onEditorScroll}
                    onEditorChange={onEditorChange}
                    onFileSave={onFileSave}
                    onFileReset={onFileReset}
                  />
                </View>
                <View
                  initial={{ x: selectedView === 'preview' ? 0 : '100%' }}
                  animate={{ x: selectedView === 'preview' ? 0 : '100%' }}
                >
                  <Preview />
                </View>
              </div>
            </div>
          </div>
        </div>
        <SupabaseConfigModal isOpen={supabaseModalOpen} onClose={() => setSupabaseModalOpen(false)} />
        <ComponentsModal
          isOpen={componentsModalOpen}
          onClose={() => setComponentsModalOpen(false)}
          onSendMessage={onSendMessage}
        />
      </motion.div>
    )
  );
});

interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = memo(({ children, ...props }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" transition={viewTransition} {...props}>
      {children}
    </motion.div>
  );
});
