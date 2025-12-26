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
  
  // Mescla dados originais com conteúdo editado (para templates React)
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
      nome: editedContent[`${focusedSlide}-nome`] ?? dadosGerais.nome,
      arroba: editedContent[`${focusedSlide}-arroba`] ?? dadosGerais.arroba,
    };
  }, [activeData, editedContent, focusedSlide]);
  
  // Transforma estilos para o slide atual
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
        if (!styles[elementType]) {
          styles[elementType] = value;
        }
      }
    });
    
    return styles;
  }, [elementStyles, originalStyles, focusedSlide]);
  
  // Remove a classe 'selected' e as pinças quando nenhum elemento está selecionado
  useEffect(() => {
    if (!selectedElement || selectedElement.element === null) {
      // Remove a classe 'selected' de todos os elementos
      document.querySelectorAll('[data-editable].selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Remove todas as pinças de resize
      document.querySelectorAll('.resize-handle').forEach(el => el.remove());
    }
  }, [selectedElement]);
  
  // === BLOCKS-BASED SLIDE ===
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
          // Se clicar diretamente no container do slide (não em um elemento filho)
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
            // TODO: dispatch hasUnsavedChanges
          }}
          width={templateDimensions.width}
          height={templateDimensions.height}
          backgroundColor={currentConteudo.backgroundColor || '#ffffff'}
        />
      </div>
    );
  }
  
  // === REACT TEMPLATE ===
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
          // Se clicar diretamente no container do slide (não em um elemento filho com data-editable)
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
          onElementClick={(elementType, _slideIndex, event) => {
            actions.clearAllSelections();
            if (elementType) {
              actions.setSelectedElement({ slideIndex: focusedSlide, element: elementType as any });
              
              // Captura estilos originais do elemento clicado
              if (event && elementType !== 'avatar') {
                const target = event.target as HTMLElement;
                const editableEl = target.closest('[data-editable]') as HTMLElement | null;
                
                if (editableEl) {
                  const computedStyles = window.getComputedStyle(editableEl);
                  const originalStyles: any = {};
                  
                  // Captura estilos de texto
                  if (elementType === 'title' || elementType === 'subtitle' || elementType === 'nome' || elementType === 'arroba') {
                    originalStyles.fontSize = computedStyles.fontSize;
                    originalStyles.fontWeight = computedStyles.fontWeight;
                    originalStyles.fontStyle = computedStyles.fontStyle;
                    originalStyles.textAlign = computedStyles.textAlign;
                    originalStyles.color = computedStyles.color;
                    originalStyles.textDecoration = computedStyles.textDecoration;
                  }
                  
                  // Captura estilos de imagem
                  if (elementType === 'image' || elementType === 'background') {
                    originalStyles.objectPosition = computedStyles.objectPosition || 'center center';
                    originalStyles.objectFit = computedStyles.objectFit || 'cover';
                    originalStyles.backgroundPosition = computedStyles.backgroundPosition || 'center center';
                    originalStyles.backgroundSize = computedStyles.backgroundSize || 'cover';
                    originalStyles.backgroundImage = computedStyles.backgroundImage;
                    originalStyles.backgroundColor = computedStyles.backgroundColor;
                  }
                  
                  console.log('🎨 Estilos originais capturados:', originalStyles);
                  
                  // Salva no estado se não existir ainda
                  const key = `${focusedSlide}-${elementType}`;
                  if (!state.elementStyles[key] && !state.originalStyles[key]) {
                    actions.updateElementStyle(focusedSlide, elementType as any, 'fontSize', originalStyles.fontSize || '16px');
                  }
                }
              }
            } else {
              actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
            }
          }}
          onImageDrag={(elementType, event, currentPosition) => {
            console.log('👀 Drag iniciado:', elementType);
            event.preventDefault();
            event.stopPropagation();
            
            const target = event.target as HTMLElement;
            const isBackgroundDiv = target.tagName === 'DIV' && target.hasAttribute('data-editable');
            const propertyName = isBackgroundDiv ? 'backgroundPosition' : 'objectPosition';
            
            console.log('🎯 Tipo de elemento:', {
              elementType,
              tagName: target.tagName,
              isBackgroundDiv,
              propertyName,
              currentPosition
            });
            
            // Parse posição atual
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
            
            console.log('📍 Posição inicial:', { initialX, initialY, startX, startY });
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              
              // Converte delta para porcentagem (sensibilidade ajustável)
              const sensitivity = 0.15;
              const newX = Math.max(0, Math.min(100, initialX + deltaX * sensitivity));
              const newY = Math.max(0, Math.min(100, initialY + deltaY * sensitivity));
              
              const newPosition = `${newX.toFixed(1)}% ${newY.toFixed(1)}%`;
              
              // Log ocasional para debug
              if (Math.random() < 0.05) {
                console.log('🎯 Movendo:', {
                  deltaX: deltaX.toFixed(1),
                  deltaY: deltaY.toFixed(1),
                  newX: newX.toFixed(1),
                  newY: newY.toFixed(1),
                  propertyName
                });
              }
              
              // Usa a propriedade correta dependendo do tipo de elemento
              actions.updateElementStyle(focusedSlide, elementType as any, propertyName as any, newPosition);
            };
            
            const handleMouseUp = () => {
              console.log('✅ Drag finalizado');
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onElementDoubleClick={(elementType, _slideIndex, element) => {
            console.log('✏️ Duplo clique detectado:', elementType);
            if (elementType === 'title' || elementType === 'subtitle' || elementType === 'nome' || elementType === 'arroba') {
              // Ativa modo de edição contentEditable
              element.setAttribute('contenteditable', 'true');
              element.focus();
              
              // Seleciona todo o texto
              const range = document.createRange();
              range.selectNodeContents(element);
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              
              // Mostra toolbar de formatação
              const containerRect = reactSlideRefs.current[focusedSlide]?.getBoundingClientRect();
              if (containerRect) {
                actions.showFloatingToolbar(
                  document,
                  element,
                  reactSlideRefs.current[focusedSlide]!
                );
              }
              
              // Handler para capturar mudanças na seleção
              const handleSelectionChange = () => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && sel.toString().length > 0) {
                  const currentRange = sel.getRangeAt(0);
                  // Verifica se a seleção está dentro do elemento editável
                  if (element.contains(currentRange.commonAncestorContainer)) {
                    console.log('📍 Seleção mudou para:', sel.toString());
                    actions.updateFloatingToolbarRange(currentRange.cloneRange());
                  }
                }
              };
              
              // Adiciona listener para mudanças de seleção
              document.addEventListener('selectionchange', handleSelectionChange);
              
              // Handler para salvar ao desfocar
              const handleBlur = () => {
                const newValue = element.innerText;
                actions.updateEditedValue(focusedSlide, elementType, newValue);
                element.removeAttribute('contenteditable');
                element.removeEventListener('blur', handleBlur);
                document.removeEventListener('selectionchange', handleSelectionChange);
                actions.closeFloatingToolbar();
              };
              
              // Handler para Enter salvar
              const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  element.blur();
                }
              };
              
              element.addEventListener('blur', handleBlur);
              element.addEventListener('keydown', handleKeyDown);
            }
          }}
        />
      </div>
    );
  }
  
  // === HTML TEMPLATE (IFRAME) ===
  // Implementar iframe para templates HTML
  return (
    <div
      className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
      style={{ 
        width: `${templateDimensions.width}px`, 
        height: `${templateDimensions.height}px`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
      onClick={(e) => {
        // Se clicar diretamente no container do slide (não em um elemento filho)
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
