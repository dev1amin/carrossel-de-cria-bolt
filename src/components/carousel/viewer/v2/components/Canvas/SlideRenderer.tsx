/**
 * SlideRenderer - Renderiza o slide atual (React, HTML ou Blocos)
 */

import React, { memo, useMemo, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { isBlockSlide } from '../../../../../../types/blocks';
import { ReactSlideRenderer } from '../../../../../../templates/react';
import { BlocksCanvas } from '../../../../blocks/index';

export const SlideRenderer: React.FC = memo(() => {
  const { state, actions, refs, data } = useEditor();

  const { focusedSlide, editedContent, elementStyles, originalStyles, globalSettings, selectedElement } = state;
  const { activeData, templateId, templateDimensions, isReactTemplate } = data;
  const { reactSlideRefs } = refs;

  const currentConteudo = (activeData as any)?.conteudos?.[focusedSlide];
  const isBlockBased = isBlockSlide(currentConteudo);

  const mergedSlideData = useMemo(() => {
    if (!currentConteudo) return null;

    return {
      ...currentConteudo,
      title: editedContent[`${focusedSlide}-title`] ?? currentConteudo.title,
      subtitle: editedContent[`${focusedSlide}-subtitle`] ?? currentConteudo.subtitle,
      imagem_fundo: editedContent[`${focusedSlide}-background`] ?? currentConteudo.imagem_fundo,
    };
  }, [currentConteudo, editedContent, focusedSlide]);

  const mergedDadosGerais = useMemo(() => {
    const dadosGerais = (activeData as any)?.dados_gerais;
    if (!dadosGerais) return null;

    return {
      ...dadosGerais,
      // se você usa global no hook, tem que ler global aqui também
      nome: editedContent[`global-nome`] ?? editedContent[`${focusedSlide}-nome`] ?? dadosGerais.nome,
      arroba: editedContent[`global-arroba`] ?? editedContent[`${focusedSlide}-arroba`] ?? dadosGerais.arroba,
    };
  }, [activeData, editedContent, focusedSlide]);

  const slideElementStyles = useMemo(() => {
    const styles: Record<string, any> = {};

    Object.entries(elementStyles).forEach(([key, value]) => {
      if (key.startsWith(`${focusedSlide}-`)) {
        const elementType = key.replace(`${focusedSlide}-`, '');
        styles[elementType] = value;
      }
    });

    Object.entries(originalStyles).forEach(([key, value]) => {
      if (key.startsWith(`${focusedSlide}-`)) {
        const elementType = key.replace(`${focusedSlide}-`, '');
        if (!styles[elementType]) styles[elementType] = value;
      }
    });

    return styles;
  }, [elementStyles, originalStyles, focusedSlide]);

  useEffect(() => {
    if (!selectedElement || selectedElement.element === null) {
      document.querySelectorAll('[data-editable].selected').forEach(el => el.classList.remove('selected'));
      document.querySelectorAll('.resize-handle').forEach(el => el.remove());
    }
  }, [selectedElement]);

  if (isBlockBased) {
    return (
      <div
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
        style={{
          width: `${templateDimensions.width}px`,
          height: `${templateDimensions.height}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backgroundColor: globalSettings.accentColor || currentConteudo.backgroundColor || '#ffffff',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
          }
        }}
      >
        <BlocksCanvas
          slideIndex={focusedSlide}
          conteudo={currentConteudo}
          onChangeBlocks={(blocks) => {
            (activeData as any).conteudos[focusedSlide] = {
              ...currentConteudo,
              blocks,
            };
          }}
          width={templateDimensions.width}
          height={templateDimensions.height}
          backgroundColor={currentConteudo.backgroundColor || '#ffffff'}
        />
      </div>
    );
  }

  if (isReactTemplate && mergedSlideData && mergedDadosGerais) {
    return (
      <div
        ref={(el) => {
          reactSlideRefs.current[focusedSlide] = el;
        }}
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
        style={{
          width: `${templateDimensions.width}px`,
          height: `${templateDimensions.height}px`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
          }
        }}
      >
        <ReactSlideRenderer
          templateId={templateId}
          slideIndex={focusedSlide}
          slideData={mergedSlideData}
          dadosGerais={mergedDadosGerais}
          styles={slideElementStyles}
          globalSettings={globalSettings}
          onElementClick={(elementType, _slideIndex, event) => {
            actions.clearAllSelections();
            if (elementType) {
              actions.setSelectedElement({ slideIndex: focusedSlide, element: elementType as any });

              if (event && elementType !== 'avatar') {
                const target = event.target as HTMLElement;
                const editableEl = target.closest('[data-editable]') as HTMLElement | null;

                if (editableEl) {
                  const computedStyles = window.getComputedStyle(editableEl);
                  const original: any = {};

                  if (elementType === 'title' || elementType === 'subtitle' || elementType === 'nome' || elementType === 'arroba') {
                    original.fontSize = computedStyles.fontSize;
                    original.fontWeight = computedStyles.fontWeight;
                    original.fontStyle = computedStyles.fontStyle;
                    original.textAlign = computedStyles.textAlign;
                    original.color = computedStyles.color;
                    original.textDecoration = computedStyles.textDecoration;
                  }

                  if (elementType === 'image' || elementType === 'background') {
                    original.objectPosition = computedStyles.objectPosition || 'center center';
                    original.objectFit = computedStyles.objectFit || 'cover';
                    original.backgroundPosition = computedStyles.backgroundPosition || 'center center';
                    original.backgroundSize = computedStyles.backgroundSize || 'cover';
                    original.backgroundImage = computedStyles.backgroundImage;
                    original.backgroundColor = computedStyles.backgroundColor;
                  }

                  const key = `${focusedSlide}-${elementType}`;
                  if (!state.elementStyles[key] && !state.originalStyles[key]) {
                    actions.updateElementStyle(focusedSlide, elementType as any, 'fontSize', original.fontSize || '16px');
                  }
                }
              }
            } else {
              actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
            }
          }}
          onImageDrag={(elementType, event, currentPosition) => {
            event.preventDefault();
            event.stopPropagation();

            const target = event.target as HTMLElement;
            const isBackgroundDiv = target.tagName === 'DIV' && target.hasAttribute('data-editable');
            const propertyName = isBackgroundDiv ? 'backgroundPosition' : 'objectPosition';

            const parts = (currentPosition || 'center center').split(' ');
            let initialX = 50;
            let initialY = 50;

            if (parts[0]) {
              if (parts[0] === 'left') initialX = 0;
              else if (parts[0] === 'right') initialX = 100;
              else if (parts[0] === 'center') initialX = 50;
              else initialX = parseFloat(parts[0]);
            }

            if (parts[1]) {
              if (parts[1] === 'top') initialY = 0;
              else if (parts[1] === 'bottom') initialY = 100;
              else if (parts[1] === 'center') initialY = 50;
              else initialY = parseFloat(parts[1]);
            }

            const startX = event.clientX;
            const startY = event.clientY;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;

              const sensitivity = 0.15;
              const newX = Math.max(0, Math.min(100, initialX + deltaX * sensitivity));
              const newY = Math.max(0, Math.min(100, initialY + deltaY * sensitivity));

              const newPosition = `${newX.toFixed(1)}% ${newY.toFixed(1)}%`;
              actions.updateElementStyle(focusedSlide, elementType as any, propertyName as any, newPosition);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onElementDoubleClick={(elementType, _slideIndex, element) => {
            if (!(elementType === 'title' || elementType === 'subtitle' || elementType === 'nome' || elementType === 'arroba')) return;

            console.log('✏️ Duplo clique detectado:', elementType);
            
            // Ativa modo de edição contentEditable
            element.setAttribute('contenteditable', 'true');
            element.focus();

            // Seleciona todo o texto inicialmente (usuário pode deselecionar depois)
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }

            // Mostra toolbar IMEDIATAMENTE
            const container = reactSlideRefs.current[focusedSlide];
            if (container) {
              actions.showFloatingToolbar(document, element, container);
              // Salva o range inicial
              if (selection && selection.rangeCount > 0) {
                actions.updateFloatingToolbarRange(selection.getRangeAt(0).cloneRange());
              }
            }

            const handleSelectionUpdate = () => {
              const sel = window.getSelection();
              if (!sel || sel.rangeCount === 0) return;

              const r = sel.getRangeAt(0);
              if (!element.contains(r.commonAncestorContainer)) return;

              console.log('📍 Seleção atualizada:', sel.toString());
              // Salva o novo range SEMPRE (independente se há texto selecionado)
              actions.updateFloatingToolbarRange(r.cloneRange());

              // Se há texto selecionado, reposiciona a toolbar
              if (sel.toString().length > 0) {
                const cont = reactSlideRefs.current[focusedSlide];
                if (cont) {
                  actions.showFloatingToolbar(document, element, cont);
                }
              }
            };

            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
              }
            };

            const handleBlur = () => {
              // Se quer manter formatação parcial, TEM que salvar HTML
              const newValue = element.innerHTML;
              actions.updateEditedValue(focusedSlide, elementType, newValue);

              element.removeAttribute('contenteditable');

              document.removeEventListener('selectionchange', handleSelectionUpdate);
              element.removeEventListener('mouseup', handleSelectionUpdate);
              element.removeEventListener('keyup', handleSelectionUpdate);

              element.removeEventListener('keydown', handleKeyDown);
              element.removeEventListener('blur', handleBlur);

              actions.closeFloatingToolbar();
            };

            // IMPORTANTE: não selecione tudo (isso destrói seleção parcial)
            // Removido: range.selectNodeContents(element)

            document.addEventListener('selectionchange', handleSelectionUpdate);
            element.addEventListener('mouseup', handleSelectionUpdate);
            element.addEventListener('keyup', handleSelectionUpdate);

            element.addEventListener('keydown', handleKeyDown);
            element.addEventListener('blur', handleBlur);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
      style={{
        width: `${templateDimensions.width}px`,
        height: `${templateDimensions.height}px`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
        }
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Carregando slide...
      </div>
    </div>
  );
});

SlideRenderer.displayName = 'SlideRenderer';