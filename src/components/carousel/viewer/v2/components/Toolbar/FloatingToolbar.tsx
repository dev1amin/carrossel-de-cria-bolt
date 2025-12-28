/**
 * FloatingToolbar - Toolbar flutuante para formatação de texto
 * Fixes:
 * - Não fecha ao clicar/selecionar dentro do contenteditable (inclui target Text node)
 * - Não fecha ao clicar na própria toolbar
 * - Restaura range corretamente antes de execCommand
 */

import React, { memo, useEffect, useRef, useCallback, useState } from 'react';
import { Bold, Italic, Underline, Palette } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

// Cores predefinidas para o color picker
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#808080', '#A52A2A', '#FFD700', '#4167B2',
];

export const FloatingToolbar: React.FC = memo(() => {
  const { state, actions } = useEditor();
  const { floatingToolbar } = state;

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [currentColor, setCurrentColor] = useState('#FFFFFF');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { visible, top, left, editableEl, iframeDoc, savedRange } = floatingToolbar;

  // Normaliza EventTarget para Element (muito importante: seleção/click em texto pode retornar Text node)
  const getTargetElement = (t: EventTarget | null): Element | null => {
    if (!t) return null;
    if (t instanceof Element) return t;
    // Text, Comment, etc:
    // @ts-ignore
    const parent = (t as any).parentElement as Element | undefined;
    return parent || null;
  };

  const restoreRange = useCallback((rangeToUse?: Range) => {
    if (!iframeDoc) return false;

    const selection = iframeDoc.getSelection();
    if (!selection) return false;

    const range = rangeToUse || savedRange;
    if (!range) return false;

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }, [iframeDoc, savedRange]);

  const applyStyle = useCallback((command: string, rangeToUse?: Range) => {
    if (!iframeDoc) return;

    const selection = iframeDoc.getSelection();
    if (!selection) return;

    restoreRange(rangeToUse);
    iframeDoc.execCommand(command, false);

    if (selection.rangeCount > 0) {
      actions.updateFloatingToolbarRange(selection.getRangeAt(0).cloneRange());
    }

    editableEl?.focus();
  }, [iframeDoc, editableEl, restoreRange, actions]);

  const handleColorChange = useCallback((color: string) => {
    console.log('🎨 FloatingToolbar: Mudando cor para', color);
    setCurrentColor(color);
    setShowColorPicker(false);

    if (!iframeDoc) return;
    const selection = iframeDoc.getSelection();
    if (!selection) return;

    restoreRange();
    iframeDoc.execCommand('foreColor', false, color);

    if (selection.rangeCount > 0) {
      actions.updateFloatingToolbarRange(selection.getRangeAt(0).cloneRange());
    }

    editableEl?.focus();
  }, [iframeDoc, restoreRange, actions, editableEl]);

  // Detecta cor do texto selecionado
  useEffect(() => {
    if (!visible || !editableEl || !iframeDoc) return;

    const selection = iframeDoc.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element =
      container.nodeType === Node.TEXT_NODE
        ? (container.parentElement as HTMLElement | null)
        : (container as HTMLElement | null);

    if (!element) return;

    const computedStyle = iframeDoc.defaultView?.getComputedStyle(element);
    if (!computedStyle) return;

    const color = computedStyle.color; // rgb(...)
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return;

    const hex =
      '#' +
      rgb.slice(0, 3).map((x) => {
        const v = parseInt(x, 10);
        const h = v.toString(16);
        return h.length === 1 ? '0' + h : h;
      }).join('');

    setCurrentColor(hex.toUpperCase());
  }, [visible, editableEl, iframeDoc]);

  // Fecha toolbar com Escape ou clique fora
  useEffect(() => {
    if (!visible) return;

    const isSameDocument = iframeDoc === document;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showColorPicker) {
          setShowColorPicker(false);
        } else {
          actions.closeFloatingToolbar();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const targetEl = getTargetElement(e.target);

      // Se não tem target, fecha
      if (!targetEl) {
        setShowColorPicker(false);
        actions.closeFloatingToolbar();
        return;
      }

      // Fecha color picker se clicar fora dele
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(targetEl)) {
        setShowColorPicker(false);
        return;
      }

      // Não fecha se clicar na toolbar
      if (targetEl.closest('[data-floating-toolbar]')) return;

      // Não fecha se clicar/selecionar dentro do contenteditable
      // (aqui usamos Node, porque target real pode ser Text)
      if (editableEl && editableEl.contains(e.target as Node)) return;

      actions.closeFloatingToolbar();
    };

    const handleIframeClick = (e: MouseEvent) => {
      if (isSameDocument) return;

      const targetEl = getTargetElement(e.target);
      if (!targetEl) {
        actions.closeFloatingToolbar();
        return;
      }

      // Não fecha se clicar/selecionar dentro do editável
      if (editableEl && editableEl.contains(e.target as Node)) return;

      actions.closeFloatingToolbar();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    if (iframeDoc && !isSameDocument) {
      iframeDoc.addEventListener('mousedown', handleIframeClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);

      if (iframeDoc && !isSameDocument) {
        iframeDoc.removeEventListener('mousedown', handleIframeClick);
      }
    };
  }, [visible, editableEl, iframeDoc, actions, showColorPicker]);

  if (!visible) return null;

  return (
    <div
      data-floating-toolbar="true"
      className={`fixed z-50 flex items-center gap-1 bg-gray-900 rounded-lg shadow-lg ${
        'px-2 py-1'
      }`}
      style={{ 
        top: top, 
        left, 
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const selection = iframeDoc?.getSelection();
          const currentRange =
            selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : undefined;

          applyStyle('bold', currentRange);
        }}
        className={`rounded hover:bg-gray-700 text-white ${
          'p-1.5'
        }`}
        title="Negrito"
      >
        <Bold className={'w-3.5 h-3.5'} />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const selection = iframeDoc?.getSelection();
          const currentRange =
            selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : undefined;

          applyStyle('italic', currentRange);
        }}
        className={`rounded hover:bg-gray-700 text-white ${
          'p-1.5'
        }`}
        title="Itálico"
      >
        <Italic className={'w-3.5 h-3.5'} />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const selection = iframeDoc?.getSelection();
          const currentRange =
            selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : undefined;

          applyStyle('underline', currentRange);
        }}
        className={`rounded hover:bg-gray-700 text-white ${
          'p-1.5'
        }`}
        title="Sublinhado"
      >
        <Underline className={'w-3.5 h-3.5'} />
      </button>

      <div className={'bg-gray-600 mx-1 w-px h-4'} />

      {/* Color picker dropdown */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className={`rounded hover:bg-gray-700 text-white flex items-center gap-1 ${
            'p-1.5'
          }`}
          title="Cor do texto"
          style={{ color: currentColor }}
        >
          <Palette className={'w-3.5 h-3.5'} />
        </button>

        {/* Dropdown de cores */}
        {showColorPicker && (
          <div
            className={`absolute top-full left-0 mt-1 bg-gray-900 rounded-lg shadow-lg z-50 ${
              'p-2'
            }`}
            style={{ minWidth: '180px' }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className={'grid gap-1 mb-2 grid-cols-5'}>
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`rounded border-2 border-gray-700 hover:border-white transition-colors ${
                    'w-7 h-7'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Input customizado */}
            <div className={`flex items-center gap-2 pt-2 border-t border-gray-700 ${
              'pt-2'
            }`}>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className={`rounded cursor-pointer ${
                  'w-8 h-8'
                }`}
                title="Escolher cor personalizada"
              />
              <span className={`text-gray-400 flex-1 ${
                'text-xs'
              }`}>{currentColor}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FloatingToolbar.displayName = 'FloatingToolbar';