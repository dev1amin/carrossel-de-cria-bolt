/**
 * FloatingToolbar - Toolbar flutuante para formatação de texto
 * Usa o mesmo código do RichTextEditor para consistência
 */

import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const FloatingToolbar: React.FC = memo(() => {
  const { state, actions } = useEditor();
  const { floatingToolbar } = state;
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [currentColor, setCurrentColor] = useState('#FFFFFF');
  
  const { visible, top, left, editableEl, iframeDoc, savedRange } = floatingToolbar;
  
  // Aplica estilo de formatação
  const applyStyle = useCallback((command: string, rangeToUse?: Range) => {
    console.log('🎨 FloatingToolbar: Aplicando estilo', command, 'com range:', !!rangeToUse);
    if (!iframeDoc) return;
    
    const selection = iframeDoc.getSelection();
    if (!selection) return;
    
    // Se foi passado um range específico, usa ele. Senão usa o savedRange
    const rangeToApply = rangeToUse || savedRange;
    
    if (rangeToApply) {
      // Limpa seleção atual e aplica o range
      selection.removeAllRanges();
      selection.addRange(rangeToApply);
      console.log('✅ Range aplicado, texto selecionado:', selection.toString());
    }
    
    // Executa o comando na seleção atual
    iframeDoc.execCommand(command, false);
    console.log('✅ Comando executado');
    
    // Salva a nova seleção após aplicar o comando
    if (selection.rangeCount > 0) {
      const newRange = selection.getRangeAt(0).cloneRange();
      actions.updateFloatingToolbarRange(newRange);
    }
    
    // Mantém o foco no elemento editável
    if (editableEl) {
      editableEl.focus();
    }
  }, [iframeDoc, editableEl, savedRange, actions]);
  
  // Handler do color picker
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const color = e.target.value;
    console.log('🎨 FloatingToolbar: Mudando cor para', color);
    setCurrentColor(color);
    
    if (!iframeDoc) return;
    const selection = iframeDoc.getSelection();
    if (!selection) return;
    
    // Usa o savedRange ou a seleção atual
    if (savedRange) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    
    iframeDoc.execCommand('foreColor', false, color);
    
    // Salva a nova seleção
    if (selection.rangeCount > 0) {
      actions.updateFloatingToolbarRange(selection.getRangeAt(0).cloneRange());
    }
  }, [iframeDoc, savedRange, actions]);
  
  // Detecta cor do texto selecionado
  useEffect(() => {
    if (!visible || !editableEl || !iframeDoc) return;
    
    const selection = iframeDoc.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
      
      if (element) {
        const computedStyle = iframeDoc.defaultView?.getComputedStyle(element);
        if (computedStyle) {
          const color = computedStyle.color;
          // Converte rgb para hex
          const rgb = color.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const hex = '#' + rgb.slice(0, 3).map(x => {
              const hexValue = parseInt(x).toString(16);
              return hexValue.length === 1 ? '0' + hexValue : hexValue;
            }).join('');
            setCurrentColor(hex);
          }
        }
      }
    }
  }, [visible, editableEl, iframeDoc]);
  
  // Fecha toolbar com Escape ou clique fora
  useEffect(() => {
    if (!visible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        actions.closeFloatingToolbar();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-floating-toolbar]')) return;
      actions.closeFloatingToolbar();
    };
    
    const handleIframeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (editableEl && (editableEl === target || editableEl.contains(target))) return;
      actions.closeFloatingToolbar();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    if (iframeDoc) {
      iframeDoc.addEventListener('mousedown', handleIframeClick);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (iframeDoc) {
        iframeDoc.removeEventListener('mousedown', handleIframeClick);
      }
    };
  }, [visible, editableEl, iframeDoc, actions]);
  
  if (!visible) return null;
  
  return (
    <div
      data-floating-toolbar="true"
      className="fixed z-50 flex items-center gap-1 bg-gray-900 rounded-lg shadow-lg px-2 py-1"
      style={{
        top,
        left,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onMouseDown={(e) => { 
          e.preventDefault(); 
          e.stopPropagation();
          // Captura a seleção ATUAL no momento do clique
          const selection = iframeDoc?.getSelection();
          let currentRange: Range | undefined = undefined;
          if (selection && selection.rangeCount > 0) {
            currentRange = selection.getRangeAt(0).cloneRange();
            console.log('📍 Seleção capturada no clique do bold:', selection.toString());
          }
          // Passa o range capturado para o applyStyle
          applyStyle('bold', currentRange);
        }}
        className="p-1.5 rounded hover:bg-gray-700 text-white"
        title="Negrito"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        onMouseDown={(e) => { 
          e.preventDefault(); 
          e.stopPropagation();
          // Captura a seleção ATUAL no momento do clique
          const selection = iframeDoc?.getSelection();
          let currentRange: Range | undefined = undefined;
          if (selection && selection.rangeCount > 0) {
            currentRange = selection.getRangeAt(0).cloneRange();
            console.log('📍 Seleção capturada no clique do italic:', selection.toString());
          }
          // Passa o range capturado para o applyStyle
          applyStyle('italic', currentRange);
        }}
        className="p-1.5 rounded hover:bg-gray-700 text-white"
        title="Itálico"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        onMouseDown={(e) => { 
          e.preventDefault(); 
          e.stopPropagation();
          // Captura a seleção ATUAL no momento do clique
          const selection = iframeDoc?.getSelection();
          let currentRange: Range | undefined = undefined;
          if (selection && selection.rangeCount > 0) {
            currentRange = selection.getRangeAt(0).cloneRange();
            console.log('📍 Seleção capturada no clique do underline:', selection.toString());
          }
          // Passa o range capturado para o applyStyle
          applyStyle('underline', currentRange);
        }}
        className="p-1.5 rounded hover:bg-gray-700 text-white"
        title="Sublinhado"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-gray-600 mx-1" />
      {/* Color picker que não fecha a toolbar */}
      <div 
        className="relative"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        <input
          ref={colorPickerRef}
          type="color"
          value={currentColor}
          className="w-6 h-6 rounded cursor-pointer border-0"
          onMouseDown={(e) => { 
            e.stopPropagation();
            e.preventDefault();
          }}
          onInput={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleColorChange(e as any);
          }}
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleColorChange(e);
          }}
          onBlur={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          title="Cor do texto"
        />
      </div>
    </div>
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';
