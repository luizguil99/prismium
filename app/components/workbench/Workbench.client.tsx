// Importações necessárias para o componente
import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { workbenchStore } from '~/lib/stores/workbench';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Popover, Transition } from '@headlessui/react';
import { diffLines, type Change } from 'diff';
import { formatDistanceToNow as formatDistance } from 'date-fns';
import { ActionRunner } from '~/lib/runtime/action-runner';
import { getLanguageFromExtension } from '~/utils/getLanguageFromExtension';
import type { FileHistory } from '~/types/actions';
import { DiffView } from './DiffView';
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
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';

// Componentes do Workbench
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import Cookies from 'js-cookie';
import { ComponentsModal } from './ComponentsModal';
import useViewport from '~/lib/hooks';
import { WorkbenchSidebar } from './WorkbenchSidebar';
import { webcontainer } from '~/lib/webcontainer';

// Definição do tipo para as opções de visualização
type WorkbenchViewType = 'code' | 'preview' | 'diff';

// Interface de props do Workbench
interface WorkspaceProps {
  chatStarted?: boolean; // Indica se o chat foi iniciado
  isStreaming?: boolean; // Indica se está streamando conteúdo
  actionRunner: ActionRunner;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
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
const FileModifiedDropdown = memo(({
  fileHistory,
  onSelectFile,
}: {
  fileHistory: Record<string, FileHistory>,
  onSelectFile: (filePath: string) => void,
}) => {
  const modifiedFiles = Object.entries(fileHistory);
  const hasChanges = modifiedFiles.length > 0;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    return modifiedFiles.filter(([filePath]) =>
      filePath.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modifiedFiles, searchQuery]);

  return (
    <div className="flex items-center gap-2">
      <Popover className="relative">
        {({ open }: { open: boolean }) => (
          <>
            <Popover.Button className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textPrimary border border-bolt-elements-borderColor">
              <span className="font-medium">File Changes</span>
              {hasChanges && (
                <span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-500 text-xs flex items-center justify-center border border-accent-500/30">
                  {modifiedFiles.length}
                </span>
              )}
            </Popover.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Popover.Panel className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-xl bg-bolt-elements-background-depth-2 shadow-xl border border-bolt-elements-borderColor">
                <div className="p-2">
                  <div className="relative mx-2 mb-2">
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary">
                      <div className="i-ph:magnifying-glass" />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredFiles.length > 0 ? (
                      filteredFiles.map(([filePath, history]) => {
                        const extension = filePath.split('.').pop() || '';
                        const language = getLanguageFromExtension(extension);

                        return (
                          <button
                            key={filePath}
                            onClick={() => onSelectFile(filePath)}
                            className="w-full px-3 py-2 text-left rounded-md hover:bg-bolt-elements-background-depth-1 transition-colors group bg-transparent"
                          >
                            <div className="flex items-center gap-2">
                              <div className="shrink-0 w-5 h-5 text-bolt-elements-textTertiary">
                                {['typescript', 'javascript', 'jsx', 'tsx'].includes(language) && <div className="i-ph:file-js" />}
                                {['css', 'scss', 'less'].includes(language) && <div className="i-ph:paint-brush" />}
                                {language === 'html' && <div className="i-ph:code" />}
                                {language === 'json' && <div className="i-ph:brackets-curly" />}
                                {language === 'python' && <div className="i-ph:file-text" />}
                                {language === 'markdown' && <div className="i-ph:article" />}
                                {['yaml', 'yml'].includes(language) && <div className="i-ph:file-text" />}
                                {language === 'sql' && <div className="i-ph:database" />}
                                {language === 'dockerfile' && <div className="i-ph:cube" />}
                                {language === 'shell' && <div className="i-ph:terminal" />}
                                {!['typescript', 'javascript', 'css', 'html', 'json', 'python', 'markdown', 'yaml', 'yml', 'sql', 'dockerfile', 'shell', 'jsx', 'tsx', 'scss', 'less'].includes(language) && <div className="i-ph:file-text" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate text-sm font-medium text-bolt-elements-textPrimary">
                                      {filePath.split('/').pop()}
                                    </span>
                                    <span className="truncate text-xs text-bolt-elements-textTertiary">
                                      {filePath}
                                    </span>
                                  </div>
                                  {(() => {
                                    // Calculate diff stats
                                    const { additions, deletions } = (() => {
                                      if (!history.originalContent) return { additions: 0, deletions: 0 };

                                      const normalizedOriginal = history.originalContent.replace(/\r\n/g, '\n');
                                      const normalizedCurrent = history.versions[history.versions.length - 1]?.content.replace(/\r\n/g, '\n') || '';

                                      if (normalizedOriginal === normalizedCurrent) {
                                        return { additions: 0, deletions: 0 };
                                      }

                                      const changes = diffLines(normalizedOriginal, normalizedCurrent, {
                                        newlineIsToken: false,
                                        ignoreWhitespace: true,
                                        ignoreCase: false
                                      });

                                      return changes.reduce((acc: { additions: number; deletions: number }, change: Change) => {
                                        if (change.added) {
                                          acc.additions += change.value.split('\n').length;
                                        }
                                        if (change.removed) {
                                          acc.deletions += change.value.split('\n').length;
                                        }
                                        return acc;
                                      }, { additions: 0, deletions: 0 });
                                    })();

                                    const showStats = additions > 0 || deletions > 0;

                                    return showStats && (
                                      <div className="flex items-center gap-1 text-xs shrink-0">
                                        {additions > 0 && (
                                          <span className="text-green-500">+{additions}</span>
                                        )}
                                        {deletions > 0 && (
                                          <span className="text-red-500">-{deletions}</span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 mb-2 text-bolt-elements-textTertiary">
                          <div className="i-ph:file-dashed" />
                        </div>
                        <p className="text-sm font-medium text-bolt-elements-textPrimary">
                          {searchQuery ? 'No matching files' : 'No modified files'}
                        </p>
                        <p className="text-xs text-bolt-elements-textTertiary mt-1">
                          {searchQuery ? 'Try another search' : 'Changes will appear here as you edit'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {hasChanges && (
                  <div className="border-t border-bolt-elements-borderColor p-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          filteredFiles.map(([filePath]) => filePath).join('\n')
                        );
                        toast('File list copied to clipboard', { 
                          icon: <div className="i-ph:check-circle text-accent-500" /> 
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                    >
                      Copy File List
                    </button>
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
});

export const Workbench = memo(({ 
  chatStarted, 
  isStreaming,
  actionRunner,
  metadata,
  onSendMessage,
  updateChatMestaData
}: WorkspaceProps) => {
  renderLogger.trace('Workbench'); // Log de renderização

  // Estados locais
  const [componentsModalOpen, setComponentsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});
  const modifiedFiles = Array.from(useStore(workbenchStore.unsavedFiles).keys());

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

  // Efeito para sincronizar alterações do editor com o preview
  useEffect(() => {
    if (!currentDocument || !visualEditorEnabled) return;

    console.log('[Workbench] Atualizando preview com alterações do editor');
    
    // Envia a atualização para o preview
    const previewFrame = document.querySelector('iframe');
    if (previewFrame && previewFrame.contentWindow) {
      previewFrame.contentWindow.postMessage({
        type: 'UPDATE_PREVIEW',
        payload: {
          content: currentDocument.content
        }
      }, '*');
    }
  }, [currentDocument?.content, visualEditorEnabled]);

  // Handler para alterações do editor visual
  useEffect(() => {
    if (!visualEditorEnabled) {
      console.log('[Workbench] Editor visual desativado');
      return;
    }

    console.log('[Workbench] Editor visual ativado, configurando handler de mensagens');

    const handleVisualEditorUpdate = async (event: MessageEvent) => {
      // Verifica o tipo da mensagem
      if (!event.data.type?.startsWith('VISUAL_EDITOR_') && event.data.type !== 'SEND_AI_MESSAGE') {
        return;
      }

      // Se for uma mensagem para a IA, envia para o chat
      if (event.data.type === 'SEND_AI_MESSAGE' && onSendMessage) {
        console.log('[Workbench] Enviando mensagem para IA:', event.data.payload.message);
        onSendMessage(new Event('click') as unknown as React.UIEvent, event.data.payload.message);
        return;
      }

      try {
        const { type, sourceFile, elementHtml, newContent, originalContent } = event.data.payload;

        if (!webcontainer) {
          console.error('[Workbench] WebContainer não inicializado');
          return;
        }

        // Tenta listar arquivos do webcontainer para debug
        try {
          const container = await webcontainer;
          const rootDir = await container.fs.readdir('/');
          console.log('[Workbench] Arquivos na raiz:', rootDir);
          
          if (rootDir.includes('src')) {
            const srcDir = await container.fs.readdir('/src');
            console.log('[Workbench] Arquivos em /src:', srcDir);
            
            if (srcDir.includes('components')) {
              const componentsDir = await container.fs.readdir('/src/components');
              console.log('[Workbench] Arquivos em /src/components:', componentsDir);
            }
          }
        } catch (error) {
          console.error('[Workbench] Erro ao listar diretórios:', error);
        }

        // Encontra o arquivo correto baseado no caminho
        const fileEntries = Object.entries(files);
        
        console.log('[Workbench] Arquivos disponíveis:', fileEntries.map(([path, file]) => {
          if (!file) return { path, content: null, isReactComponent: false };
          return {
            path,
            content: 'content' in file ? file.content : null,
            isReactComponent: 'content' in file && file.content ? 
              file.content.includes('import React') && file.content.includes('export default') : 
              false
          };
        }));

        // Tenta encontrar o arquivo que contém o texto original
        const targetFileEntry = fileEntries.find(([filePath, file]) => {
          if (!file || !('content' in file) || !file.content) return false;
          
          // Procura pelo elemento HTML completo
          const hasElementHtml = file.content.includes(elementHtml);
          
          // Se não encontrar o elemento completo, procura pelo texto original
          // mas verifica se está dentro de um elemento JSX/HTML
          const hasOriginalContent = !hasElementHtml && new RegExp(`>[^<]*${originalContent}[^>]*<`).test(file.content);
          
          // Também verifica se o arquivo é um componente React
          const isReactComponent = file.content.includes('import React') && file.content.includes('export default');
          
          console.log('[Workbench] Verificando arquivo:', {
            path: filePath,
            hasOriginalContent,
            hasElementHtml,
            isReactComponent
          });
          
          return (hasOriginalContent || hasElementHtml) && isReactComponent;
        });

        if (!targetFileEntry) {
          console.error('[Workbench] Arquivo não encontrado com o conteúdo:', {
            originalContent,
            elementHtml,
            sourceFile
          });
          return;
        }

        const [targetPath, targetFile] = targetFileEntry;

        // Ajusta o caminho para o formato do webcontainer
        const webcontainerPath = targetPath.replace('/home/project/', '/');

        console.log('[Workbench] Arquivo encontrado:', {
          targetPath,
          webcontainerPath,
          previewPath: targetFile && 'preview' in targetFile ? targetFile.preview?.path : null,
          content: targetFile && 'content' in targetFile ? targetFile.content : null
        });

        // Envia o target path para o Visual Editor
        const previewFrame = document.querySelector('iframe');
        if (previewFrame && previewFrame.contentWindow) {
          previewFrame.contentWindow.postMessage({
            type: 'WORKBENCH_FILE_INFO',
            payload: {
              targetPath,
              webcontainerPath
            }
          }, '*');
        }

        let fileContent = targetFile && 'content' in targetFile ? targetFile.content : null;

        // Se não tiver conteúdo no objeto files, tenta ler do webcontainer
        if (!fileContent) {
          try {
            const container = await webcontainer;
            fileContent = await container.fs.readFile(webcontainerPath, 'utf-8');
            console.log('[Workbench] Conteúdo lido do webcontainer:', fileContent);
          } catch (error) {
            console.error('[Workbench] Erro ao ler arquivo do webcontainer:', error);
            return;
          }
        }

        if (!fileContent) {
          console.error('[Workbench] Não foi possível ler o conteúdo do arquivo:', webcontainerPath);
          return;
        }

        let updatedContent;
        if (type === 'text') {
          // Escapa caracteres especiais para regex
          const escapedOriginal = originalContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const escapedHtml = elementHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Primeiro tenta substituir pelo HTML completo
          const htmlRegex = new RegExp(escapedHtml, 'g');
          updatedContent = fileContent.replace(htmlRegex, (match: string) => {
            return match.replace(new RegExp(`>${escapedOriginal}<`), `>${newContent}<`);
          });
          
          // Se não encontrou o HTML completo, tenta substituir o texto dentro de tags
          if (updatedContent === fileContent) {
            const textRegex = new RegExp(`(>)([^<]*${escapedOriginal}[^>]*)(<)`, 'g');
            updatedContent = fileContent.replace(textRegex, (_: string, start: string, text: string, end: string) => {
              return start + text.replace(escapedOriginal, newContent) + end;
            });
          }
        } else if (type === 'delete') {
          // Escapa caracteres especiais para regex
          const escapedHtml = elementHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          updatedContent = fileContent.replace(escapedHtml, '');
        }

        if (updatedContent && updatedContent !== fileContent) {
          console.log('[Workbench] Salvando arquivo atualizado:', {
            webcontainerPath,
            originalContent: fileContent,
            updatedContent: updatedContent
          });

          try {
            const container = await webcontainer;
            await container.fs.writeFile(webcontainerPath, updatedContent);
            console.log('[Workbench] Arquivo salvo com sucesso!');
            
            // Atualiza o objeto files
            if (targetFile && 'content' in targetFile) {
              const updatedFile = { ...targetFile, content: updatedContent };
              const updatedFiles = { ...files, [targetPath]: updatedFile };
              // Verifica se existe o método setFiles
              if ('setFiles' in workbenchStore) {
                workbenchStore.setFiles(updatedFiles);
              } else {
                console.warn('[Workbench] Método setFiles não encontrado no workbenchStore');
              }
            }
            
            // Chama reloadPreview com o iframe correto
            const previewIframe = document.querySelector('iframe[src*="webcontainer-api.io"]') as HTMLIFrameElement;
            if (previewIframe) {
              reloadPreview(previewIframe);
            } else {
              reloadPreview(); // tenta sem passar parâmetros como fallback
            }
          } catch (error) {
            console.error('[Workbench] Erro ao salvar arquivo:', error);
          }
        } else {
          console.log('[Workbench] Nenhuma alteração necessária no arquivo');
        }
      } catch (error) {
        console.error('[Workbench] Erro ao atualizar arquivo:', error);
      }
    };

    window.addEventListener('message', handleVisualEditorUpdate);
    return () => {
      console.log('[Workbench] Removendo handler de mensagens do editor visual');
      window.removeEventListener('message', handleVisualEditorUpdate);
    };
  }, [visualEditorEnabled, files]);

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
  const handleSelectFile = useCallback((filePath: string) => {
    workbenchStore.setSelectedFile(filePath);
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
                      />
                    )}
                    <EditorPanel
                      editorDocument={currentDocument}
                      isStreaming={isStreaming}
                      selectedFile={selectedFile}
                      files={files}
                      unsavedFiles={unsavedFiles}
                      fileHistory={fileHistory}
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
                
                <View
                  initial={{ x: selectedView === 'diff' ? 0 : '100%' }}
                  animate={{ x: selectedView === 'diff' ? 0 : '100%' }}
                >
                  <DiffView
                    fileHistory={fileHistory}
                    setFileHistory={setFileHistory}
                    actionRunner={actionRunner}
                  />
                </View>
              </div>
            </div>
          </div>
        </div>
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
