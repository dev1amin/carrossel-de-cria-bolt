/**
 * MobileTextEditPanel - Painel para edição de texto
 * Abre baseado na opção selecionada: font, size, color, format
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  ChevronLeft
} from 'lucide-react';
import type { TextFormattingState } from './types';
import type { TextOptionType } from './MobileTextOptionsMenu';

// Fontes disponíveis
const AVAILABLE_FONTS = [
  { name: 'Padrão', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
];

// Tamanhos de fonte
const FONT_SIZES = [
  { label: 'XS', value: '12px' },
  { label: 'S', value: '14px' },
  { label: 'M', value: '16px' },
  { label: 'L', value: '18px' },
  { label: 'XL', value: '24px' },
  { label: '2XL', value: '32px' },
  { label: '3XL', value: '40px' },
  { label: '4XL', value: '48px' },
];

// Cores predefinidas
const TEXT_COLORS = [
  '#ffffff', '#000000', '#4167B2', '#ef4444', '#22c55e', 
  '#eab308', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4',
  '#14b8a6', '#84cc16', '#f43f5e', '#6366f1', '#a855f7'
];

interface MobileTextEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  editType: TextOptionType | null;
  textFormatting: TextFormattingState;
  currentFontSize: string;
  currentFontFamily: string;
  // Handlers
  onApplyTextStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onApplyAlign: (align: 'left' | 'center' | 'right') => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (size: string) => void;
  onFontFamilyChange: (font: string) => void;
}

export const MobileTextEditPanel: React.FC<MobileTextEditPanelProps> = ({
  isOpen,
  onClose,
  onBack,
  editType,
  textFormatting,
  currentFontSize,
  currentFontFamily,
  onApplyTextStyle,
  onApplyAlign,
  onColorChange,
  onFontSizeChange,
  onFontFamilyChange,
}) => {
  const [selectedColor, setSelectedColor] = useState(textFormatting.color || '#ffffff');

  // Atualiza cor selecionada quando muda
  useEffect(() => {
    if (textFormatting.color) {
      setSelectedColor(textFormatting.color);
    }
  }, [textFormatting.color]);

  const getTitle = () => {
    switch (editType) {
      case 'font': return 'Escolher Fonte';
      case 'size': return 'Tamanho da Fonte';
      case 'color': return 'Cor do Texto';
      case 'format': return 'Formatação';
      default: return 'Editar Texto';
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorChange(color);
  };

  return (
    <AnimatePresence>
      {isOpen && editType && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Voltar</span>
              </button>
              <h3 className="text-white font-semibold">{getTitle()}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)] pb-safe">
              {/* FONT SELECTION */}
              {editType === 'font' && (
                <div className="space-y-2">
                  {AVAILABLE_FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => onFontFamilyChange(font.value)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        currentFontFamily === font.value
                          ? 'bg-blue-DEFAULT text-white'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      <span className="text-lg">{font.name}</span>
                      {currentFontFamily === font.value && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              )}

              {/* SIZE SELECTION */}
              {editType === 'size' && (
                <div className="grid grid-cols-4 gap-3">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => onFontSizeChange(size.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                        currentFontSize === size.value
                          ? 'bg-blue-DEFAULT text-white'
                          : 'bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl font-bold">{size.label}</span>
                      <span className="text-xs text-white/50">{size.value}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* COLOR SELECTION */}
              {editType === 'color' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`w-full aspect-square rounded-xl border-2 transition-all ${
                          selectedColor === color
                            ? 'border-blue-DEFAULT scale-110 ring-2 ring-blue-DEFAULT ring-offset-2 ring-offset-[#1a1a2e]'
                            : 'border-transparent hover:border-white/30'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  {/* Custom color input */}
                  <div className="flex items-center gap-3 mt-4">
                    <label className="text-white/70 text-sm">Cor personalizada:</label>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-DEFAULT"
                    />
                  </div>
                </div>
              )}

              {/* FORMAT SELECTION */}
              {editType === 'format' && (
                <div className="space-y-6">
                  {/* Text styles */}
                  <div>
                    <h4 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
                      Estilo do texto
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApplyTextStyle('bold')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.isBold
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <Bold className="w-5 h-5" />
                        <span className="text-sm">Negrito</span>
                      </button>
                      <button
                        onClick={() => onApplyTextStyle('italic')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.isItalic
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <Italic className="w-5 h-5" />
                        <span className="text-sm">Itálico</span>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onApplyTextStyle('underline')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.isUnderline
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <Underline className="w-5 h-5" />
                        <span className="text-sm">Sublinhado</span>
                      </button>
                      <button
                        onClick={() => onApplyTextStyle('strikethrough')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.isStrikethrough
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <Strikethrough className="w-5 h-5" />
                        <span className="text-sm">Riscado</span>
                      </button>
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <h4 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
                      Alinhamento
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApplyAlign('left')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.textAlign === 'left'
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <AlignLeft className="w-5 h-5" />
                        <span className="text-sm">Esquerda</span>
                      </button>
                      <button
                        onClick={() => onApplyAlign('center')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.textAlign === 'center'
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <AlignCenter className="w-5 h-5" />
                        <span className="text-sm">Centro</span>
                      </button>
                      <button
                        onClick={() => onApplyAlign('right')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${
                          textFormatting.textAlign === 'right'
                            ? 'bg-blue-DEFAULT text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <AlignRight className="w-5 h-5" />
                        <span className="text-sm">Direita</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileTextEditPanel;
