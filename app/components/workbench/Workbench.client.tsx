// Importações necessárias para o componente
import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { workbenchStore } from '~/lib/stores/workbench';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getVisualEditorScript } from '~/lib/modules/editor/visual-editor';
import { reloadPreview } from '@webcontainer/api';

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
import { WorkbenchSidebar } from './WorkbenchSidebar';
import { webcontainer } from '~/lib/webcontainer';

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
    width: '100%',
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
  const visualEditorEnabled = useStore(workbenchStore.visualEditorEnabled);

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

  const handleVisualEditorToggle = async () => {
    try {
      console.log('[Visual Editor] Iniciando toggle...');
      const container = await webcontainer;
      console.log('[Visual Editor] WebContainer pronto');
      
      const script = getVisualEditorScript();
      console.log('[Visual Editor] Script gerado:', script.length, 'caracteres');
      
      // Injetar o script diretamente no WebContainer
      if (visualEditorEnabled) {
        console.log('[Visual Editor] Desativando...');
        await container.setPreviewScript('');
        workbenchStore.setVisualEditorEnabled(false);
        toast.info('Editor Visual desativado');
      } else {
        console.log('[Visual Editor] Ativando...');
        await container.setPreviewScript(script);
        workbenchStore.setVisualEditorEnabled(true);
        toast.info('Editor Visual ativado');
      }

      // Recarregar o preview usando a função oficial do WebContainers
      const previewIframe = document.querySelector('iframe[src*="webcontainer-api.io"]') as HTMLIFrameElement;
      if (previewIframe) {
        console.log('[Visual Editor] Recarregando preview...');
        await reloadPreview(previewIframe);
        console.log('[Visual Editor] Preview recarregado');
      }

    } catch (error) {
      console.error('[Visual Editor] Error:', error);
      toast.error('Falha ao alternar Editor Visual');
    }
  };

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
            'fixed top-0 bottom-0 z-0 transition-[left,width] duration-200 bolt-ease-cubic-bezier',
            {
              'w-full': isSmallViewport,
              'left-0': showWorkbench && isSmallViewport,
              'left-[var(--workbench-left)]': showWorkbench,
              'left-[100%]': !showWorkbench,
              'right-0': showWorkbench && !isSmallViewport,
              'w-[calc(100%-var(--workbench-left))]': showWorkbench && !isSmallViewport,
            },
          )}
        >
          <div className="absolute inset-0">
            <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border-l border-bolt-elements-borderColor overflow-hidden rounded-tl-xl rounded-bl-xl">
              <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                <div className="ml-2">
                  <IconButton
                    icon="i-ph-pencil-simple"
                    tooltip={visualEditorEnabled ? 'Disable Visual Editor' : 'Enable Visual Editor'}
                    onClick={handleVisualEditorToggle}
                  />
                </div>
                <div className="ml-auto" />
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
                  <div className="absolute inset-0 flex">
                    {selectedView === 'code' && (
                      <WorkbenchSidebar 
                        isSyncing={isSyncing}
                        onSyncFiles={handleSyncFiles}
                        onOpenComponents={() => setComponentsModalOpen(true)}
                        onOpenSupabase={() => setSupabaseModalOpen(true)}
                      />
                    )}
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
                  </div>
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
