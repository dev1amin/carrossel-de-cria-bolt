/**
 * MobileFloatingToolbar - Barra de ferramentas flutuante para formatação de texto
 * Aparece quando um elemento de texto está selecionado
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  X 
} from 'lucide-react';
import type { TextFormattingState } from './types';

interface MobileFloatingToolbarProps {
  isVisible: boolean;
  formatting: TextFormattingState;
  onApplyStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  onApplyAlign: (align: 'left' | 'center' | 'right') => void;
  onColorChange: (color: string) => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#4167B2', '#10B981', '#F59E0B', 
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const MobileFloatingToolbar: React.FC<MobileFloatingToolbarProps> = ({
  isVisible,
  formatting,
  onApplyStyle,
  onApplyAlign,
  onColorChange,
  onClose,
  position = 'top',
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const toolbarPosition = position === 'top' 
    ? { top: 60, bottom: 'auto' } 
    : { top: 'auto', bottom: 80 };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed left-4 right-4 z-[60] bg-[#1a1a2e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          style={toolbarPosition}
        >
          {/* Linha de formatação principal */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-1">
              {/* Bold */}
              <button
                onClick={() => onApplyStyle('bold')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.isBold 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Bold className="w-5 h-5" />
              </button>

              {/* Italic */}
              <button
                onClick={() => onApplyStyle('italic')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.isItalic 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Italic className="w-5 h-5" />
              </button>

              {/* Underline */}
              <button
                onClick={() => onApplyStyle('underline')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.isUnderline 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Underline className="w-5 h-5" />
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => onApplyStyle('strikethrough')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.isStrikethrough 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Strikethrough className="w-5 h-5" />
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* Align Left */}
              <button
                onClick={() => onApplyAlign('left')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.textAlign === 'left' 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <AlignLeft className="w-5 h-5" />
              </button>

              {/* Align Center */}
              <button
                onClick={() => onApplyAlign('center')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.textAlign === 'center' 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <AlignCenter className="w-5 h-5" />
              </button>

              {/* Align Right */}
              <button
                onClick={() => onApplyAlign('right')}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  formatting.textAlign === 'right' 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <AlignRight className="w-5 h-5" />
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* Color Picker Toggle */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                  showColorPicker 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Palette className="w-5 h-5" />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/50 hover:bg-white/10 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Color picker dropdown */}
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-3 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorChange(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all active:scale-95 ${
                        formatting.color === color 
                          ? 'border-blue-DEFAULT scale-110' 
                          : 'border-white/20 hover:border-white/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileFloatingToolbar;
