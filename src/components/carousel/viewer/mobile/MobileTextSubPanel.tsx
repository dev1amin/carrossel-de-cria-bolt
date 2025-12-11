/**
 * MobileTextSubPanel - Painel compacto para sub-opções de texto
 * Aparece acima da barra inferior quando usuário seleciona Fonte, Tamanho, Cor ou Formato
 */

import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import type { TextFormattingState } from './types';
import type { TextEditMode } from './MobileBottomBar';

// Fontes disponíveis
const AVAILABLE_FONTS = [
  { name: 'Padrão', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
];

// Função para gerar tamanhos de fonte dinamicamente baseado no tamanho atual
const generateFontSizes = (currentSize: string): { label: string; value: string }[] => {
  // Extrai o número do tamanho atual (ex: "16px" -> 16)
  const current = parseInt(currentSize) || 16;
  const sizes: { label: string; value: string }[] = [];
  
  // Gera 5 tamanhos menores (-4, -4, -4, -4, -4)
  for (let i = 5; i >= 1; i--) {
    const size = Math.max(8, current - (i * 4)); // Mínimo de 8px
    sizes.push({ label: String(size), value: `${size}px` });
  }
  
  // Adiciona o tamanho atual no meio
  sizes.push({ label: String(current), value: `${current}px` });
  
  // Gera 5 tamanhos maiores (+4, +4, +4, +4, +4)
  for (let i = 1; i <= 5; i++) {
    const size = current + (i * 4);
    sizes.push({ label: String(size), value: `${size}px` });
  }
  
  // Remove duplicatas e ordena
  const uniqueSizes = sizes.filter((s, index, self) => 
    index === self.findIndex(t => t.value === s.value)
  ).sort((a, b) => parseInt(a.value) - parseInt(b.value));
  
  return uniqueSizes;
};

// Cores do texto
const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700',
];

interface MobileTextSubPanelProps {
  isOpen: boolean;
  editMode: TextEditMode | null;
  onClose: () => void;
  textFormatting: TextFormattingState;
  currentFontSize: string;
  currentFontFamily: string;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onApplyTextStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onApplyAlign: (align: 'left' | 'center' | 'right') => void;
}

export const MobileTextSubPanel: React.FC<MobileTextSubPanelProps> = ({
  isOpen,
  editMode,
  onClose,
  textFormatting,
  currentFontSize,
  currentFontFamily,
  onFontFamilyChange,
  onFontSizeChange,
  onColorChange,
  onApplyTextStyle,
  onApplyAlign,
}) => {
  const [customColor, setCustomColor] = useState('#FFFFFF');

  const renderContent = () => {
    switch (editMode) {
      case 'font':
        return (
          <div className="p-3">
            <h3 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
              Fonte
            </h3>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {AVAILABLE_FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    onFontFamilyChange(font.value);
                    onClose();
                  }}
                  className={`p-2 rounded-lg text-sm transition-all ${
                    currentFontFamily === font.value
                      ? 'bg-blue-DEFAULT text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        );

      case 'size':
        const fontSizes = generateFontSizes(currentFontSize);
        return (
          <div className="p-3">
            <h3 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
              Tamanho <span className="text-blue-400">(atual: {parseInt(currentFontSize) || 16}px)</span>
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    onFontSizeChange(size.value);
                    onClose();
                  }}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    currentFontSize === size.value || `${parseInt(currentFontSize)}px` === size.value
                      ? 'bg-blue-DEFAULT text-white ring-2 ring-blue-400'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="p-3">
            <h3 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
              Cor do texto
            </h3>
            <div className="grid grid-cols-8 gap-2 mb-3">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color);
                    onClose();
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    textFormatting.color === color
                      ? 'border-blue-400 scale-110'
                      : 'border-white/20 hover:border-white/50'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {/* Cor customizada */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="#FFFFFF"
              />
              <button
                onClick={() => {
                  onColorChange(customColor);
                  onClose();
                }}
                className="px-3 py-2 bg-blue-DEFAULT rounded-lg text-white text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        );

      case 'format':
        return (
          <div className="p-3">
            <h3 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
              Formatação
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => onApplyTextStyle('bold')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.isBold
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                onClick={() => onApplyTextStyle('italic')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.isItalic
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Italic className="w-5 h-5" />
              </button>
              <button
                onClick={() => onApplyTextStyle('underline')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.isUnderline
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Underline className="w-5 h-5" />
              </button>
              <button
                onClick={() => onApplyTextStyle('strikethrough')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.isStrikethrough
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Strikethrough className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
              Alinhamento
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onApplyAlign('left')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.textAlign === 'left'
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <AlignLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onApplyAlign('center')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.textAlign === 'center'
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <AlignCenter className="w-5 h-5" />
              </button>
              <button
                onClick={() => onApplyAlign('right')}
                className={`p-3 rounded-lg transition-all ${
                  textFormatting.textAlign === 'right'
                    ? 'bg-blue-DEFAULT text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <AlignRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (editMode) {
      case 'font': return 'Fonte';
      case 'size': return 'Tamanho';
      case 'color': return 'Cor';
      case 'format': return 'Formato';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && editMode && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[80px] left-0 right-0 z-50 mx-2 bg-[#1a1a2e] rounded-t-2xl border border-white/10 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-white font-semibold">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          {renderContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileTextSubPanel;
