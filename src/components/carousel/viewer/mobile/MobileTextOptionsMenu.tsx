/**
 * MobileTextOptionsMenu - Menu de opções ao clicar em texto
 * Apresenta opções: Editar, Fonte, Tamanho, Cor, Formato
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3,
  Type,
  ALargeSmall,
  Palette,
  Bold,
  X
} from 'lucide-react';

export type TextOptionType = 'edit' | 'font' | 'size' | 'color' | 'format';

interface MobileTextOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: TextOptionType) => void;
  elementType: string | null;
}

export const MobileTextOptionsMenu: React.FC<MobileTextOptionsMenuProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  elementType,
}) => {
  const options = [
    { id: 'edit' as TextOptionType, icon: Edit3, label: 'Editar texto', color: 'text-green-400' },
    { id: 'font' as TextOptionType, icon: Type, label: 'Fonte', color: 'text-blue-400' },
    { id: 'size' as TextOptionType, icon: ALargeSmall, label: 'Tamanho', color: 'text-purple-400' },
    { id: 'color' as TextOptionType, icon: Palette, label: 'Cor do texto', color: 'text-pink-400' },
    { id: 'format' as TextOptionType, icon: Bold, label: 'Formato', color: 'text-orange-400' },
  ];

  const getElementLabel = () => {
    switch (elementType) {
      case 'title': return 'Título';
      case 'subtitle': return 'Subtítulo';
      case 'nome': return 'Nome';
      case 'arroba': return 'Arroba';
      default: return 'Texto';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Menu */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl z-50 pb-safe"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div>
                <h3 className="text-white font-semibold text-lg">Opções de {getElementLabel()}</h3>
                <p className="text-white/50 text-xs">Selecione uma opção para editar</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {options.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectOption(option.id)}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 border border-white/10"
                  >
                    <div className={`p-3 rounded-xl bg-white/10 ${option.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-white text-sm font-medium">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Safe area padding */}
            <div className="h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileTextOptionsMenu;
