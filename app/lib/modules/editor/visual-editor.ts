export function getVisualEditorScript() {
  return `
    (function() {
      console.log('[Visual Editor] Inicializando...');
      let isEditMode = false;
      let selectedElement = null;
      const editableElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'a'];
      
      const visualEditor = {
        createOverlay(element) {
          console.log('[Visual Editor] Criando overlay para elemento:', element.tagName);
          const overlay = document.createElement('div');
          overlay.className = 'prismium-editor-overlay';
          overlay.style.cssText = \`
            position: fixed;
            border: 2px solid #6366f1;
            background: rgba(99, 102, 241, 0.1);
            pointer-events: none;
            z-index: 9999;
          \`;
          
          this.updateOverlayPosition(overlay, element);
          document.body.appendChild(overlay);
          return overlay;
        },

        updateOverlayPosition(overlay, element) {
          const rect = element.getBoundingClientRect();
          overlay.style.top = rect.top + window.scrollY + 'px';
          overlay.style.left = rect.left + window.scrollX + 'px';
          overlay.style.width = rect.width + 'px';
          overlay.style.height = rect.height + 'px';
        },

        updateText(element, newText) {
          console.log('[Visual Editor] Atualizando texto do elemento:', element.tagName);
          const originalText = element.textContent;
          element.textContent = newText;
          const message = {
            type: 'VISUAL_EDITOR_UPDATE',
            payload: {
              type: 'text',
              sourceFile: window.location.pathname,
              elementHtml: element.outerHTML,
              newContent: newText,
              originalContent: originalText
            }
          };
          console.log('[Visual Editor] Enviando mensagem:', JSON.stringify(message, null, 2));
          window.parent.postMessage(message, '*');
        },

        deleteElement(element) {
          console.log('[Visual Editor] Tentando deletar elemento:', {
            tagName: element.tagName,
            id: element.id,
            classes: element.className,
            html: element.outerHTML
          });
          
          if (confirm('Are you sure you want to delete this element?')) {
            const elementHtml = element.outerHTML;
            
            console.log('[Visual Editor] Elemento a ser removido:', {
              html: elementHtml,
              path: window.location.pathname
            });

            const message = {
              type: 'VISUAL_EDITOR_UPDATE',
              payload: {
                type: 'delete',
                sourceFile: window.location.pathname,
                elementHtml: elementHtml
              }
            };

            console.log('[Visual Editor] Enviando mensagem de delete:', JSON.stringify(message, null, 2));
            window.parent.postMessage(message, '*');
            element.remove();
          }
        },

        createStylePanel(element) {
          console.log('[Visual Editor] Criando painel de estilo para elemento:', element.tagName);
          const panel = document.createElement('div');
          panel.className = 'prismium-style-panel';
          panel.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 8px;
            padding: 16px;
            z-index: 10001;
            width: 300px;
            max-height: 80vh;
            overflow-y: auto;
          \`;

          const header = document.createElement('div');
          header.style.cssText = \`
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          \`;

          const title = document.createElement('h3');
          title.textContent = 'Edit Style';
          title.style.cssText = \`
            color: white;
            margin: 0;
            font-size: 16px;
          \`;

          const closeBtn = document.createElement('button');
          closeBtn.innerHTML = '✕';
          closeBtn.style.cssText = \`
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
          \`;
          closeBtn.onclick = () => panel.remove();

          header.appendChild(title);
          header.appendChild(closeBtn);
          panel.appendChild(header);

          const styleProperties = [
            { name: 'Color', property: 'color', type: 'color' },
            { name: 'Background', property: 'backgroundColor', type: 'color' },
            { name: 'Font Size', property: 'fontSize', type: 'range', min: '8', max: '72', unit: 'px' },
            { name: 'Font Weight', property: 'fontWeight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
            { name: 'Text Align', property: 'textAlign', type: 'select', options: ['left', 'center', 'right', 'justify'] },
            { name: 'Padding', property: 'padding', type: 'range', min: '0', max: '100', unit: 'px' },
            { name: 'Margin', property: 'margin', type: 'range', min: '0', max: '100', unit: 'px' },
            { name: 'Border Radius', property: 'borderRadius', type: 'range', min: '0', max: '50', unit: 'px' },
            { name: 'Border Width', property: 'borderWidth', type: 'range', min: '0', max: '20', unit: 'px' },
            { name: 'Border Color', property: 'borderColor', type: 'color' },
            { name: 'Border Style', property: 'borderStyle', type: 'select', options: ['none', 'solid', 'dashed', 'dotted', 'double'] }
          ];

          styleProperties.forEach(prop => {
            const container = document.createElement('div');
            container.style.cssText = \`
              margin-bottom: 12px;
            \`;

            const label = document.createElement('label');
            label.textContent = prop.name;
            label.style.cssText = \`
              display: block;
              color: white;
              margin-bottom: 4px;
              font-size: 14px;
            \`;

            let input;
            if (prop.type === 'select') {
              input = document.createElement('select');
              input.style.cssText = \`
                width: 100%;
                padding: 4px 8px;
                background: #374151;
                border: 1px solid #4b5563;
                border-radius: 4px;
                color: white;
              \`;
              prop.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                input.appendChild(opt);
              });
            } else {
              input = document.createElement('input');
              input.type = prop.type;
              if (prop.type === 'range') {
                input.min = prop.min;
                input.max = prop.max;
                input.style.cssText = \`
                  width: 100%;
                  margin: 8px 0;
                \`;
              } else {
                input.style.cssText = \`
                  width: 100%;
                  padding: 4px 8px;
                  background: #374151;
                  border: 1px solid #4b5563;
                  border-radius: 4px;
                  color: white;
                \`;
              }
            }

            // Set initial value from computed style
            const computedStyle = window.getComputedStyle(element);
            input.value = computedStyle[prop.property];

            // Update style on change
            input.addEventListener('input', () => {
              let value = input.value;
              if (prop.type === 'range' && prop.unit) {
                value += prop.unit;
              }
              element.style[prop.property] = value;
            });

            container.appendChild(label);
            container.appendChild(input);
            panel.appendChild(container);
          });

          document.body.appendChild(panel);
          return panel;
        },

        editStyle(element) {
          console.log('[Visual Editor] Editando estilo do elemento:', element.tagName);
          if (element.stylePanel) {
            element.stylePanel.remove();
            element.stylePanel = null;
          } else {
            element.stylePanel = this.createStylePanel(element);
          }
        },

        enable() {
          console.log('[Visual Editor] Ativando modo de edição...');
          if (isEditMode) return;
          isEditMode = true;
          document.body.style.cursor = 'pointer';
          
          const handleMouseOver = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            if (editableElements.includes(target.tagName.toLowerCase()) && !target.overlay) {
              target.overlay = this.createOverlay(target);
            }
          };
          
          const handleMouseOut = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            if (target.overlay) {
              target.overlay.remove();
              target.overlay = null;
            }
          };
          
          const handleElementClick = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            if (target === document.body) return;
            
            e.preventDefault();
            e.stopPropagation();

            console.log('[Visual Editor] Elemento clicado:', target.tagName);
            
            // Remove chat anterior se existir
            const existingChat = document.querySelector('.prismium-quick-chat');
            if (existingChat) {
              existingChat.remove();
            }

            // Função auxiliar para extrair apenas o texto visível
            const getVisibleText = (el) => {
              let text = '';
              for (let node of el.childNodes) {
                if (node.nodeType === 3) { // Nó de texto
                  text += node.textContent?.trim() || '';
                } else if (node.nodeType === 1) { // Elemento
                  // Ignora elementos SVG
                  if (!(node instanceof SVGElement)) {
                    text += getVisibleText(node);
                  }
                }
              }
              return text.trim();
            };

            const visibleText = getVisibleText(target);

            // Envia mensagem inicial para o Workbench buscar o arquivo
            const initialMessage = {
              type: 'VISUAL_EDITOR_UPDATE',
              payload: {
                type: 'text',
                sourceFile: window.location.pathname,
                elementHtml: target.outerHTML,
                newContent: visibleText,
                originalContent: visibleText
              }
            };

            console.log('[Visual Editor] Enviando mensagem inicial:', JSON.stringify(initialMessage, null, 2));
            window.parent.postMessage(initialMessage, '*');

            const rect = target.getBoundingClientRect();

            // Cria o chat
            const chat = document.createElement('div');
            chat.className = 'prismium-quick-chat';
            chat.style.cssText = \`
              position: fixed;
              top: \${rect.bottom + window.scrollY + 10}px;
              left: \${rect.left + window.scrollX}px;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 8px;
              width: 400px;
              z-index: 10000;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            \`;

            // Conteúdo do chat simplificado
            const content = document.createElement('div');
            content.innerHTML = \`
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <input
                    type="text"
                    placeholder="Apply quick changes here..."
                    class="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button class="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            \`;

            // Adiciona eventos
            chat.appendChild(content);

            // Fecha o chat ao clicar no X
            const closeBtn = content.querySelector('button');
            closeBtn.addEventListener('click', () => {
              console.log('[Visual Editor] Chat fechado');
              chat.remove();
            });

            // Envia mensagem ao pressionar Enter
            const input = content.querySelector('input');
            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && input.value) {
                console.log('[Visual Editor] Enviando atualização de texto:', input.value);

                const updateMessage = {
                  type: 'VISUAL_EDITOR_UPDATE',
                  payload: {
                    type: 'text',
                    sourceFile: window.location.pathname,
                    elementHtml: target.outerHTML,
                    newContent: input.value,
                    originalContent: visibleText
                  }
                };

                console.log('[Visual Editor] Enviando mensagem:', JSON.stringify(updateMessage, null, 2));
                window.parent.postMessage(updateMessage, '*');
                chat.remove();
              }
            });

            // Adiciona o chat ao DOM e foca no input
            document.body.appendChild(chat);
            input.focus();
            
            if (selectedElement && selectedElement !== target) {
              selectedElement.stylePanel?.remove();
              selectedElement.stylePanel = null;
            }
            
            selectedElement = target;
          };

          document.addEventListener('mouseover', handleMouseOver);
          document.addEventListener('mouseout', handleMouseOut);
          document.addEventListener('click', handleElementClick);
          
          document.addEventListener('scroll', () => {
            document.querySelectorAll('.prismium-editor-overlay').forEach(overlay => {
              const element = Array.from(document.querySelectorAll('*')).find(el => el.overlay === overlay);
              if (element) {
                this.updateOverlayPosition(overlay, element);
              }
            });
          });

          window._visualEditorCleanup = () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            document.removeEventListener('click', handleElementClick);
            document.querySelectorAll('.prismium-editor-overlay, .prismium-style-panel').forEach(el => el.remove());
            isEditMode = false;
            document.body.style.cursor = '';
          };
        }
      };

      window.addEventListener('message', (event) => {
        console.log('[Visual Editor] Mensagem recebida:', event.data);
        
        if (event.data.type === 'TOGGLE_VISUAL_EDITOR') {
          isEditMode = !isEditMode;
          console.log('[Visual Editor] Modo de edição:', isEditMode ? 'ATIVADO' : 'DESATIVADO');
          document.body.style.cursor = isEditMode ? 'pointer' : 'default';
          
          if (!isEditMode && selectedElement) {
            selectedElement.overlay?.remove();
            selectedElement = null;
          }
        } else if (event.data.type === 'UPDATE_PREVIEW') {
          console.log('[Visual Editor] Atualizando conteúdo do preview');
          const { content } = event.data.payload;
          
          // Salva os elementos que estavam sendo editados
          const editingElements = document.querySelectorAll('[contenteditable="true"]');
          const editingStates = Array.from(editingElements).map(el => ({
            element: el,
            selection: window.getSelection()?.getRangeAt(0)
          }));
          
          // Atualiza o conteúdo
          document.body.innerHTML = content;
          
          // Restaura o estado de edição
          editingStates.forEach(({ element, selection }) => {
            const newElement = document.querySelector(\`[data-id="\${element.getAttribute('data-id')}"]\`);
            if (newElement) {
              newElement.contentEditable = 'true';
              if (selection) {
                const range = document.createRange();
                range.setStart(selection.startContainer, selection.startOffset);
                range.setEnd(selection.endContainer, selection.endOffset);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }
          });
        }
      });

      // Espera o DOM carregar completamente antes de inicializar
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('[Visual Editor] DOM carregado, inicializando...');
          visualEditor.enable();
        });
      } else {
        console.log('[Visual Editor] DOM já carregado, inicializando...');
        visualEditor.enable();
      }
    })();
  `;
}