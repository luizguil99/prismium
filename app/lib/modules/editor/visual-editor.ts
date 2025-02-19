export function getVisualEditorScript() {
  return `
    (function() {
      console.log('[Visual Editor] Inicializando...');
      let isEditMode = false;
      let selectedElement = null;
      const editableElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'a', 'img', 'i', 'svg'];
      
      const visualEditor = {
        createOverlay(element) {
          console.log('[Visual Editor] Criando overlay para elemento:', element.tagName);
          const overlay = document.createElement('div');
          overlay.className = 'prismium-editor-overlay';
          
          // Define estilos específicos baseado no tipo de elemento
          let borderColor = '#6366f1'; // cor padrão
          let backgroundColor = 'rgba(99, 102, 241, 0.1)'; // background padrão
          
          if (element instanceof SVGElement || element.tagName.toLowerCase() === 'i') {
            borderColor = '#22c55e'; // verde para ícones
            backgroundColor = 'rgba(34, 197, 94, 0.1)';
          } else if (element.tagName.toLowerCase() === 'img') {
            borderColor = '#eab308'; // amarelo para imagens
            backgroundColor = 'rgba(234, 179, 8, 0.1)';
          } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase())) {
            borderColor = '#ec4899'; // rosa para títulos
            backgroundColor = 'rgba(236, 72, 153, 0.1)';
          }
          
          overlay.style.cssText = \`
            position: fixed;
            border: 2px solid \${borderColor};
            background: \${backgroundColor};
            pointer-events: none;
            z-index: 9999;
            transition: all 0.2s ease;
            box-shadow: 0 0 0 1px \${borderColor}40;
          \`;
          
          // Adiciona label com o tipo do elemento
          const label = document.createElement('div');
          label.style.cssText = \`
            position: absolute;
            top: -20px;
            left: 0;
            background: \${borderColor};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-family: monospace;
            pointer-events: none;
          \`;
          label.textContent = element.tagName.toLowerCase();
          overlay.appendChild(label);
          
          this.updateOverlayPosition(overlay, element);
          document.body.appendChild(overlay);
          return overlay;
        },

        updateOverlayPosition(overlay, element) {
          const rect = element.getBoundingClientRect();
          const scrollX = window.scrollX || window.pageXOffset;
          const scrollY = window.scrollY || window.pageYOffset;
          
          // Adiciona uma pequena margem ao redor do elemento
          const margin = 2;
          overlay.style.top = (rect.top + scrollY - margin) + 'px';
          overlay.style.left = (rect.left + scrollX - margin) + 'px';
          overlay.style.width = (rect.width + margin * 2) + 'px';
          overlay.style.height = (rect.height + margin * 2) + 'px';
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
            
            // Ignora elementos do nosso próprio editor
            if (target.closest('.prismium-quick-chat') || 
                target.closest('.prismium-editor-overlay') || 
                target.closest('.prismium-style-panel')) return;
            
            // Encontra o elemento mais específico para edição
            let editableTarget = target;
            
            // Se for um ícone dentro de um botão ou link, seleciona o container
            if ((target instanceof SVGElement || target.tagName.toLowerCase() === 'i') && 
                (target.parentElement?.tagName.toLowerCase() === 'button' || 
                 target.parentElement?.tagName.toLowerCase() === 'a')) {
              editableTarget = target.parentElement;
            }
            
            if (editableElements.includes(editableTarget.tagName.toLowerCase()) && !editableTarget.overlay) {
              editableTarget.overlay = this.createOverlay(editableTarget);
              
              // Atualiza posição do overlay ao rolar a página
              if (!window.overlayScrollHandler) {
                window.overlayScrollHandler = () => {
                  if (editableTarget.overlay) {
                    this.updateOverlayPosition(editableTarget.overlay, editableTarget);
                  }
                };
                window.addEventListener('scroll', window.overlayScrollHandler, { passive: true });
              }
            }
          };
          
          const handleMouseOut = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            // Ignora elementos do nosso próprio editor
            if (target.closest('.prismium-quick-chat') || 
                target.closest('.prismium-editor-overlay') || 
                target.closest('.prismium-style-panel')) return;
            
            if (target.overlay) {
              target.overlay.remove();
              target.overlay = null;
            }
          };
          
          const handleElementClick = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            // Ignora cliques em elementos do nosso próprio editor
            if (target.closest('.prismium-quick-chat') || 
                target.closest('.prismium-editor-overlay') || 
                target.closest('.prismium-style-panel')) return;
            
            if (target === document.body) return;
            
            e.preventDefault();
            e.stopPropagation();

            console.log('[Visual Editor] Elemento clicado:', target.tagName);
            console.log('[Visual Editor] HTML Element:', {
              html: target.outerHTML,
              text: target.textContent,
              classes: target.className,
              id: target.id
            });
            
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
              background: #1e1e2e;
              border: 1px solid #313244;
              border-radius: 12px;
              padding: 8px;
              width: 320px;
              z-index: 10000;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(8px);
              transition: all 0.2s ease;
              pointer-events: all;
            \`;

            // Previne que o clique no chat propague para o documento
            chat.addEventListener('click', (e) => {
              e.stopPropagation();
            });

            // Conteúdo do chat simplificado
            const content = document.createElement('div');
            content.innerHTML = \`
              <div class="flex items-center gap-2" style="display: flex; align-items: center; gap: 8px;">
                <div class="flex-1" style="flex: 1; position: relative;">
                  <input
                    type="text"
                    placeholder="Digite sua pergunta..."
                    style="
                      width: 100%;
                      padding: 8px 36px 8px 12px;
                      background: #313244;
                      border: 1px solid #45475a;
                      border-radius: 8px;
                      color: #cdd6f4;
                      font-size: 13px;
                      transition: all 0.2s ease;
                      outline: none;
                    "
                    onmouseover="this.style.borderColor='#6c7086'"
                    onmouseout="this.style.borderColor='#45475a'"
                    onfocus="this.style.borderColor='#8b5cf6'; this.style.boxShadow='0 0 0 2px rgba(139, 92, 246, 0.2)'"
                    onblur="this.style.borderColor='#45475a'; this.style.boxShadow='none'"
                  />
                  <button 
                    class="send-button"
                    style="
                      position: absolute;
                      right: 8px;
                      top: 50%;
                      transform: translateY(-50%);
                      background: none;
                      border: none;
                      color: #8b5cf6;
                      cursor: pointer;
                      padding: 4px;
                      border-radius: 4px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.color='#7c3aed'; this.style.background='rgba(139, 92, 246, 0.1)'"
                    onmouseout="this.style.color='#8b5cf6'; this.style.background='none'"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
                <button 
                  onclick="const chat = this.closest('.prismium-quick-chat'); if(chat) { chat.remove(); }"
                  style="
                    background: none;
                    border: none;
                    color: #6c7086;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                  "
                  onmouseover="this.style.background='#313244'; this.style.color='#cdd6f4'"
                  onmouseout="this.style.background='none'; this.style.color='#6c7086'"
                >✕</button>
              </div>
            \`;

            // Adiciona eventos
            chat.appendChild(content);

            // Função para remover completamente o chat e seus elementos
            const removeChat = () => {
              // Remove o chat atual
              chat.remove();
              
              // Remove qualquer overlay residual
              document.querySelectorAll('.prismium-editor-overlay').forEach(el => el.remove());
              
              // Remove qualquer outro chat que possa existir
              document.querySelectorAll('.prismium-quick-chat').forEach(el => el.remove());
              
              // Remove qualquer painel de estilo
              document.querySelectorAll('.prismium-style-panel').forEach(el => el.remove());
              
              // Limpa as referências de overlay nos elementos
              document.querySelectorAll('*').forEach(el => {
                if (el.overlay) {
                  el.overlay = null;
                }
              });
              
              // Reseta o elemento selecionado
              if (selectedElement) {
                selectedElement = null;
              }
            };

            // Função para enviar mensagem
            const sendMessage = () => {
              const input = content.querySelector('input');
              if (input.value) {
                // Envia mensagem para a IA com o contexto do elemento
                const message = \`Analisar elemento HTML:
Tag: \${target.tagName}
Classes: \${target.className}
ID: \${target.id}
Texto: \${target.textContent}
HTML: \${target.outerHTML}

Usuário pergunta: \${input.value}\`;

                const aiMessage = {
                  type: 'SEND_AI_MESSAGE',
                  payload: { message }
                };

                console.log('[Visual Editor] Enviando mensagem para IA:', aiMessage);
                window.parent.postMessage(aiMessage, '*');
                
                // Limpa o input e fecha o chat
                input.value = '';
                removeChat();
              }
            };

            // Envia mensagem ao pressionar Enter
            const input = content.querySelector('input');
            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            });

            // Envia mensagem ao clicar no botão
            const sendButton = content.querySelector('.send-button');
            sendButton.addEventListener('click', sendMessage);

            // Adiciona o evento de fechar no botão X
            const closeBtn = content.querySelector('button:last-child');
            closeBtn.addEventListener('click', removeChat);

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
            document.querySelectorAll('.prismium-editor-overlay, .prismium-style-panel, .prismium-quick-chat').forEach(el => el.remove());
            // Limpa as referências de overlay
            document.querySelectorAll('*').forEach(el => {
              if (el.overlay) {
                el.overlay = null;
              }
            });
            isEditMode = false;
            selectedElement = null;
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