export function getVisualEditorScript() {
  return `
    (function() {
      let isEditMode = false;
      let selectedElement = null;
      const editableElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'a'];
      
      const visualEditor = {
        createOverlay(element) {
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

        createToolbar(element) {
          const toolbar = document.createElement('div');
          toolbar.className = 'prismium-editor-toolbar';
          toolbar.style.cssText = \`
            position: fixed;
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 4px;
            padding: 4px;
            display: flex;
            gap: 4px;
            z-index: 10000;
          \`;
          
          const rect = element.getBoundingClientRect();
          toolbar.style.top = rect.top + window.scrollY - 40 + 'px';
          toolbar.style.left = rect.left + window.scrollX + 'px';
          
          const buttons = [
            { icon: '✏️', title: 'Edit Text', action: () => this.editText(element) },
            { icon: '🎨', title: 'Edit Style', action: () => this.editStyle(element) },
            { icon: '🗑️', title: 'Delete', action: () => element.remove() }
          ];
          
          buttons.forEach(btn => {
            const button = document.createElement('button');
            button.innerHTML = btn.icon;
            button.title = btn.title;
            button.style.cssText = \`
              background: #374151;
              border: none;
              border-radius: 4px;
              padding: 4px 8px;
              color: white;
              cursor: pointer;
              font-size: 12px;
            \`;
            button.addEventListener('click', (e) => {
              e.stopPropagation();
              btn.action();
            });
            toolbar.appendChild(button);
          });
          
          document.body.appendChild(toolbar);
          return toolbar;
        },

        editText(element) {
          element.contentEditable = true;
          element.focus();
          
          const save = () => {
            element.contentEditable = false;
            element.removeEventListener('blur', save);
          };
          
          element.addEventListener('blur', save);
        },

        createStylePanel(element) {
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
          if (element.stylePanel) {
            element.stylePanel.remove();
            element.stylePanel = null;
          } else {
            element.stylePanel = this.createStylePanel(element);
          }
        },

        enable() {
          if (isEditMode) return;
          console.log('[Visual Editor] Ativando modo de edição...');
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
          
          const handleClick = (e) => {
            if (!isEditMode) return;
            const target = e.target;
            
            if (editableElements.includes(target.tagName.toLowerCase())) {
              e.preventDefault();
              e.stopPropagation();
              
              if (selectedElement && selectedElement !== target) {
                selectedElement.toolbar?.remove();
                selectedElement.toolbar = null;
                selectedElement.stylePanel?.remove();
                selectedElement.stylePanel = null;
              }
              
              selectedElement = target;
              if (!selectedElement.toolbar) {
                selectedElement.toolbar = this.createToolbar(target);
              }
            } else if (!target.closest('.prismium-editor-toolbar') && !target.closest('.prismium-style-panel')) {
              if (selectedElement) {
                selectedElement.toolbar?.remove();
                selectedElement.toolbar = null;
                selectedElement.stylePanel?.remove();
                selectedElement.stylePanel = null;
                selectedElement = null;
              }
            }
          };

          document.addEventListener('mouseover', handleMouseOver);
          document.addEventListener('mouseout', handleMouseOut);
          document.addEventListener('click', handleClick);
          
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
            document.removeEventListener('click', handleClick);
            document.querySelectorAll('.prismium-editor-overlay, .prismium-editor-toolbar, .prismium-style-panel').forEach(el => el.remove());
            isEditMode = false;
            document.body.style.cursor = '';
          };
        }
      };

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