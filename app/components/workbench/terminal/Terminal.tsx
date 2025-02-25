import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { Terminal as XTerm } from '@xterm/xterm';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import type { Theme } from '~/lib/stores/theme';
import { createScopedLogger } from '~/utils/logger';
import { getTerminalTheme } from './theme';
import styles from './Terminal.module.scss';
import classNames from 'classnames';
import { workbenchStore } from '~/lib/stores/workbench';

const logger = createScopedLogger('Terminal');

// Tamanho da janela desktop para preview
const DESKTOP_SIZE = { width: 1920, height: 1080 };

export interface TerminalRef {
  reloadStyles: () => void;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, theme, readonly, id, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();

      // Função para abrir o preview do WebContainer em uma nova janela
      const openWebContainerPreview = (url: string) => {
        const previews = workbenchStore.previews.get();
        if (!previews.length) {
          console.warn('[Terminal] Nenhum preview disponível para abrir');
          return;
        }

        // Usar o primeiro preview disponível (geralmente o de menor porta)
        const activePreview = previews[0];
        
        if (activePreview?.baseUrl) {
          try {
            // Extrair a porta do URL clicado
            const portMatch = url.match(/:(\d+)/);
            const port = portMatch ? portMatch[1] : '5173'; // Porta padrão se não encontrada
            
            // Construir o caminho relativo (tudo após a porta)
            const path = url.split(port)[1] || '/';
            
            // Construir a URL completa do WebContainer
            const webContainerUrl = `${activePreview.baseUrl}${path}`;
            
            console.log('[Terminal] Redirecionando para WebContainer:', webContainerUrl);
            
            // Preparar URL para o preview
            const previewUrl = `${window.location.origin}/webcontainer/preview/${encodeURIComponent(webContainerUrl)}`;
            
            // Configurar tamanho e posição da janela
            const windowHeight = DESKTOP_SIZE.height + 60;
            const screenLeft = (window.screen.width - DESKTOP_SIZE.width) / 2;
            const screenTop = (window.screen.height - windowHeight) / 2;
            
            const windowFeatures = [
              `width=${DESKTOP_SIZE.width}`,
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
            
            // Abrir a janela de preview
            const newWindow = window.open(previewUrl, '_blank', windowFeatures);
            
            if (newWindow) {
              newWindow.focus();
              console.log('[Terminal] Preview aberto em nova janela');
            } else {
              console.warn('[Terminal] Não foi possível abrir a janela. Verifique se o bloqueador de pop-ups está ativado.');
            }
          } catch (error) {
            console.error('[Terminal] Erro ao abrir preview:', error);
          }
        } else {
          console.warn('[Terminal] Nenhum preview ativo disponível');
        }
      };

      useEffect(() => {
        const element = terminalElementRef.current!;

        const fitAddon = new FitAddon();
        const searchAddon = new SearchAddon();

        // Personalizar o WebLinksAddon para interceptar cliques em links localhost
        const webLinksAddon = new WebLinksAddon((event, uri) => {
          // Verificar se é um link localhost
          if (uri.match(/https?:\/\/localhost:\d+/)) {
            event.preventDefault();
            console.log('[Terminal] Link localhost clicado:', uri);
            openWebContainerPreview(uri);
            return false;
          }
          // Para outros links, abrir normalmente
          return true;
        });

        const terminal = new XTerm({
          cursorBlink: true,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: 12,
          fontFamily: 'Menlo, courier-new, courier, monospace',
          allowTransparency: true,
          rightClickSelectsWord: true,
          // Habilitar detecção de links
          linkTooltip: true,
          // Destacar links no terminal
          allowProposedApi: true,
        });

        terminalRef.current = terminal;

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);
        terminal.open(element);

        // Adiciona suporte para colagem
        terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
          if (event.type === 'keydown' && event.ctrlKey && event.key === 'v') {
            navigator.clipboard.readText().then(text => {
              terminal.write(text);
            });
            return false;
          }
          return true;
        });

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          onTerminalResize?.(terminal.cols, terminal.rows);
        });

        resizeObserver.observe(element);

        element.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          
          // Se houver texto selecionado, copiar para a área de transferência
          if (terminal.hasSelection()) {
            const selection = terminal.getSelection();
            navigator.clipboard.writeText(selection);
            terminal.clearSelection();
          }
        });

        logger.debug(`Attach [${id}]`);

        onTerminalReady?.(terminal);

        return () => {
          resizeObserver.disconnect();
          terminal.dispose();
        };
      }, []);

      useEffect(() => {
        const terminal = terminalRef.current!;

        // we render a transparent cursor in case the terminal is readonly
        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});

        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => {
        return {
          reloadStyles: () => {
            const terminal = terminalRef.current!;
            terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
          },
        };
      }, []);

      return <div className={classNames(className, styles.terminalContainer)} ref={terminalElementRef} />;
    },
  ),
);
