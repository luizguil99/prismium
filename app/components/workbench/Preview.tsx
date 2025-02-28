import { useStore } from '@nanostores/react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';
import { ScreenshotSelector } from './ScreenshotSelector';
import styles from './Preview.module.css';

type ResizeSide = 'left' | 'right' | null;
interface WindowSize {
  name: string;
  width: number;
  height: number;
}
const WINDOW_SIZES: WindowSize[] = [
  { name: 'Mobile (375x667)', width: 375, height: 667 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Laptop (1366x768)', width: 1366, height: 768 },
  { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
];

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const [url, setUrl] = useState('');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Toggle between responsive mode and device mode
  const [isDeviceModeOn, setIsDeviceModeOn] = useState(false);

  // Use percentage for width
  const [widthPercent, setWidthPercent] = useState<number>(37.5); // 375px assuming 1000px window width initially

  const resizingState = useRef({
    isResizing: false,
    side: null as ResizeSide,
    startX: 0,
    startWidthPercent: 37.5,
    windowWidth: window.innerWidth,
  });

  // Define the scaling factor
  // Adjust this value to increase/decrease sensitivity
  const SCALING_FACTOR = 2;
  const [isWindowSizeDropdownOpen, setIsWindowSizeDropdownOpen] = useState(false);
  const [selectedWindowSize, setSelectedWindowSize] = useState<WindowSize>(WINDOW_SIZES[0]);

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setIframeUrl(undefined);

      return;
    }

    const { baseUrl } = activePreview;
    
    // Construir a URL completa no formato que é gerado ao clicar no link do terminal
    const fullWebContainerUrl = `${window.location.origin}/webcontainer/preview/${encodeURIComponent(baseUrl)}`;
    
    // Definir a URL de exibição e a URL do iframe
    setUrl(fullWebContainerUrl);
    setIframeUrl(baseUrl);
  }, [activePreview]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!activePreview) {
        return false;
      }

      const { baseUrl } = activePreview;

      if (value === baseUrl) {
        return true;
      } else if (value.startsWith(baseUrl)) {
        return ['/', '?', '#'].includes(value.charAt(baseUrl.length));
      }

      return false;
    },
    [activePreview],
  );

  const findMinPortIndex = useCallback(
    (minIndex: number, preview: { port: number }, index: number, array: { port: number }[]) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    [],
  );

  // When previews change, display the lowest port if user hasn't selected a preview
  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce(findMinPortIndex, 0);
      setActivePreviewIndex(minPortIndex);
    }
  }, [previews, findMinPortIndex]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleDeviceMode = () => {
    setIsDeviceModeOn((prev) => !prev);
  };

  const startResizing = (e: React.MouseEvent, side: ResizeSide) => {
    if (!isDeviceModeOn) {
      return;
    }

    // Prevent text selection
    document.body.style.userSelect = 'none';

    resizingState.current.isResizing = true;
    resizingState.current.side = side;
    resizingState.current.startX = e.clientX;
    resizingState.current.startWidthPercent = widthPercent;
    resizingState.current.windowWidth = window.innerWidth;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault(); // Prevent any text selection on mousedown
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingState.current.isResizing) {
      return;
    }

    const dx = e.clientX - resizingState.current.startX;
    const windowWidth = resizingState.current.windowWidth;

    // Apply scaling factor to increase sensitivity
    const dxPercent = (dx / windowWidth) * 100 * SCALING_FACTOR;

    let newWidthPercent = resizingState.current.startWidthPercent;

    if (resizingState.current.side === 'right') {
      newWidthPercent = resizingState.current.startWidthPercent + dxPercent;
    } else if (resizingState.current.side === 'left') {
      newWidthPercent = resizingState.current.startWidthPercent - dxPercent;
    }

    // Clamp the width between 10% and 90%
    newWidthPercent = Math.max(10, Math.min(newWidthPercent, 90));

    setWidthPercent(newWidthPercent);
  };

  const onMouseUp = () => {
    resizingState.current.isResizing = false;
    resizingState.current.side = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Restore text selection
    document.body.style.userSelect = '';
  };

  // Handle window resize to ensure widthPercent remains valid
  useEffect(() => {
    const handleWindowResize = () => {
      /*
       * Optional: Adjust widthPercent if necessary
       * For now, since widthPercent is relative, no action is needed
       */
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // A small helper component for the handle's "grip" icon
  const GripIcon = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: 'rgba(0,0,0,0.5)',
          fontSize: '10px',
          lineHeight: '5px',
          userSelect: 'none',
          marginLeft: '1px',
        }}
      >
        ••• •••
      </div>
    </div>
  );
  const openInNewWindow = (size: WindowSize) => {
    if (activePreview?.baseUrl) {
      try {
        // Regex atualizado para capturar corretamente o ID ou a URL completa
        const match = activePreview.baseUrl.match(/^https?:\/\/([^.]+(?:-+\d+)?(?:-+[a-z0-9]+)*?)(?:\.(?:local-corp\.)?webcontainer-api\.io)?/);
        
        if (match) {
          const previewId = match[1];
          console.log('[Preview] ID extraído:', previewId);
          
          // Usar a URL completa para o preview
          const previewUrl = `${window.location.origin}/webcontainer/preview/${encodeURIComponent(activePreview.baseUrl)}`;
          
          // Adicionar margem para a barra de título da janela
          const windowHeight = size.height + 60;
          
          // Centralizar a janela na tela
          const screenLeft = (window.screen.width - size.width) / 2;
          const screenTop = (window.screen.height - windowHeight) / 2;
          
          const windowFeatures = [
            `width=${size.width}`,
            `height=${windowHeight}`,
            `left=${screenLeft}`,
            `top=${screenTop}`,
            'menubar=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'resizable=yes',
            'scrollbars=yes'
          ].join(',');

          console.log('[Preview] Abrindo preview com URL completa:', activePreview.baseUrl);
          console.log('[Preview] URL de redirecionamento:', previewUrl);
          
          const newWindow = window.open(previewUrl, '_blank', windowFeatures);
          
          if (newWindow) {
            newWindow.focus();
            console.log('[Preview] Nova janela aberta');
          } else {
            console.warn('[Preview] Não foi possível abrir a janela. Verifique se o bloqueador de pop-ups está ativado.');
          }
        } else {
          console.warn('[Preview] URL do WebContainer inválida:', activePreview.baseUrl);
        }
      } catch (error) {
        console.error('[Preview] Erro ao abrir preview:', error);
      }
    } else {
      console.warn('[Preview] Nenhum preview ativo disponível');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col relative ${isPreviewOnly ? 'fixed inset-0 z-50 bg-white' : ''}`}
    >
      {isPortDropdownOpen && (
        <div className="z-iframe-overlay w-full h-full absolute" onClick={() => setIsPortDropdownOpen(false)} />
      )}
      <div className="bg-bolt-elements-background-depth-2 p-2 flex items-center gap-1.5">
        <IconButton icon="i-ph:arrow-clockwise" onClick={reloadPreview} />
        <IconButton
          icon="i-ph:selection"
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={isSelectionMode ? 'bg-bolt-elements-background-depth-3' : ''}
        />
        <div className="flex items-center gap-1 flex-grow bg-bolt-elements-preview-addressBar-background border border-bolt-elements-borderColor text-bolt-elements-preview-addressBar-text rounded-full px-3 py-1 text-sm hover:bg-bolt-elements-preview-addressBar-background hover:focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within-border-bolt-elements-borderColorActive focus-within:text-bolt-elements-preview-addressBar-textActive">
          <input
            title="URL do Preview" 
            ref={inputRef}
            className="w-full bg-transparent outline-none"
            type="text"
            value={url} /* Mostra a URL completa do webcontainer com o path /webcontainer/preview/ */
            onChange={(event) => {
              setUrl(event.target.value);
            }}
            onFocus={(event) => {
              // Nenhuma mudança necessária ao focar, já estamos mostrando a URL completa
              event.target.select();
            }}
            onBlur={() => {
              // Nenhuma mudança necessária ao desfocalizar, mantemos a URL completa
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && validateUrl(url)) {
                setIframeUrl(url);

                if (inputRef.current) {
                  inputRef.current.blur();
                }
              }
            }}
          />
        </div>

        {previews.length > 1 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}

        {/* Grupo de botões de preview */}
        <div className="flex items-center gap-1">
          {/* Device mode toggle button */}
          <IconButton
            icon="i-ph:devices"
            onClick={toggleDeviceMode}
            className={`text-white ${isDeviceModeOn ? 'bg-bolt-elements-background-depth-3' : ''}`}
            title={isDeviceModeOn ? 'Switch to Responsive Mode' : 'Switch to Device Mode'}
          />

          {/* Preview only toggle button */}
          <IconButton
            icon="i-ph:layout-light"
            onClick={() => setIsPreviewOnly(!isPreviewOnly)}
            className={`text-white ${isPreviewOnly ? 'bg-bolt-elements-background-depth-3' : ''}`}
            title={isPreviewOnly ? 'Show Full Interface' : 'Show Preview Only'}
          />

          {/* Fullscreen toggle button */}
          <IconButton
            icon={isFullscreen ? 'i-ph:arrows-in' : 'i-ph:arrows-out'}
            onClick={toggleFullscreen}
            className="text-white"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          />

          {/* Botão de preview em nova janela com dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                className={`flex items-center gap-1.5 px-2 py-1 text-white hover:bg-bolt-elements-background-depth-3 transition-colors rounded-l border border-r-0 border-bolt-elements-borderColor ${
                  isWindowSizeDropdownOpen ? 'bg-bolt-elements-background-depth-3' : 'bg-bolt-elements-background-depth-2'
                }`}
                onClick={() => openInNewWindow(selectedWindowSize)}
                title={`Open Preview in ${selectedWindowSize.name} Window`}
              >
                <div className="i-ph:arrow-square-out text-lg" />
                <span className="text-sm font-medium">{selectedWindowSize.name.split(' ')[0]}</span>
              </button>
              <button
                className={`px-1.5 py-1 text-white hover:bg-bolt-elements-background-depth-3 transition-colors rounded-r border border-l-0 border-bolt-elements-borderColor ${
                  isWindowSizeDropdownOpen ? 'bg-bolt-elements-background-depth-3' : 'bg-bolt-elements-background-depth-2'
                }`}
                onClick={() => setIsWindowSizeDropdownOpen(!isWindowSizeDropdownOpen)}
                title="Select Window Size"
              >
                <div className="i-ph:caret-down text-sm" />
              </button>
            </div>

            {isWindowSizeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setIsWindowSizeDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e1e1e] rounded-lg shadow-lg border border-[#333] overflow-hidden min-w-[180px]">
                  {WINDOW_SIZES.map((size) => (
                    <button
                      key={size.name}
                      className={`w-full px-3 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-between gap-2 ${
                        selectedWindowSize.name === size.name 
                          ? 'bg-[#2a2a2a]' 
                          : 'bg-[#000000]'
                      }`}
                      onClick={() => {
                        setSelectedWindowSize(size);
                        setIsWindowSizeDropdownOpen(false);
                        openInNewWindow(size);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`i-ph:${
                          size.name.toLowerCase().includes('mobile') ? 'device-mobile' :
                          size.name.toLowerCase().includes('tablet') ? 'device-tablet' :
                          size.name.toLowerCase().includes('laptop') ? 'laptop' :
                          'monitor'
                        } text-lg text-white`} />
                        <span className="text-sm font-medium text-white">{size.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">
                        {size.width}×{size.height}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 border-t border-bolt-elements-borderColor flex justify-center items-center overflow-auto">
        <div
          style={{
            width: isDeviceModeOn ? `${widthPercent}%` : '100%',
            height: '100%', // Always full height
            overflow: 'visible',
            background: '#fff',
            position: 'relative',
            display: 'flex',
          }}
        >
          {activePreview ? (
            <>
              <iframe
                ref={iframeRef}
                title="preview"
                className="border-none w-full h-full bg-white"
                src={iframeUrl}
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
                allow="cross-origin-isolated"
              />
              <ScreenshotSelector
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                containerRef={iframeRef}
              />
            </>
          ) : (
            <div className="flex flex-col w-full h-full justify-center items-center bg-[#09090B] gap-6">
              {/* Ícone de mágica pulsante */}
              <div className="animate-pulse flex justify-center w-full">
                <div className="i-ph:sparkle-fill text-5xl text-accent-500" />
              </div>
              
              {/* Texto principal */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="text-gray-200 text-lg font-medium">
                  Start prompting to see the magic
                </div>
                <div className="text-gray-400 text-sm">
                  Spinning up preview...
                </div>
              </div>

              {/* Lista de features */}
              <div className="flex flex-col gap-3 mt-2 text-gray-500 text-sm max-w-[300px] mx-auto">
                <div className={`flex items-center justify-center gap-2 ${styles.featureItem}`}>
                  <div className="i-ph:image text-lg" />
                  <span>Upload images as a reference</span>
                </div>
                <div className={`flex items-center justify-center gap-2 ${styles.featureItem}`}>
                  <div className="i-ph:monitor-play text-lg" />
                  <span>Instantly preview your changes</span>
                </div>
                <div className={`flex items-center justify-center gap-2 ${styles.featureItem}`}>
                  <div className="i-ph:graduation-cap text-lg" />
                  <span>Set custom knowledge for every edit</span>
                </div>
                <div className={`flex items-center justify-center gap-2 ${styles.featureItem}`}>
                  <div className="i-ph:database text-lg" />
                  <span>Connect Supabase for backend</span>
                </div>
              </div>
            </div>
          )}

          {isDeviceModeOn && (
            <>
              {/* Left handle */}
              <div
                onMouseDown={(e) => startResizing(e, 'left')}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '15px',
                  marginLeft: '-15px',
                  height: '100%',
                  cursor: 'ew-resize',
                  background: 'rgba(255,255,255,.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  userSelect: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.5)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
                title="Drag to resize width"
              >
                <GripIcon />
              </div>

              {/* Right handle */}
              <div
                onMouseDown={(e) => startResizing(e, 'right')}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '15px',
                  marginRight: '-15px',
                  height: '100%',
                  cursor: 'ew-resize',
                  background: 'rgba(255,255,255,.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  userSelect: 'none',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.5)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.2)')}
                title="Drag to resize width"
              >
                <GripIcon />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
