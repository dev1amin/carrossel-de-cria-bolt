/**
 * MobileBottomBar - Barra de ações inferior fixa
 * Mostra opções normais (Imagem, Texto, Slides, Ajustes) por padrão
 * Quando um texto está selecionado, mostra opções de formatação de texto
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Type, 
  Layers, 
  Settings,
  Edit3,
  Palette,
  Bold
} from 'lucide-react';

// Tipos de aba que o painel pode abrir
export type PanelTabType = 'image' | 'text' | 'settings';
export type TextEditMode = 'font' | 'size' | 'color' | 'format';

interface MobileBottomBarProps {
  onOpenPanel: (tab: PanelTabType) => void;
  onOpenSlides: () => void;
  hasSelectedElement: boolean;
  selectedElementType: string | null;
  activeTab?: PanelTabType | null;
  // Props para modo texto
  isTextSelected?: boolean;
  onTextEditModeSelect?: (mode: TextEditMode) => void;
  onEnterTextEditMode?: () => void; // Entra em modo edição
  onClearTextSelection?: () => void; // Volta ao menu normal
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenPanel,
  onOpenSlides,
  hasSelectedElement,
  selectedElementType,
  activeTab,
  isTextSelected = false,
  onTextEditModeSelect,
  onEnterTextEditMode,
  onClearTextSelection,
}) => {
  // Verifica se é um elemento de texto
  const isTextElement = selectedElementType === 'title' || 
                        selectedElementType === 'subtitle' || 
                        selectedElementType === 'nome' || 
                        selectedElementType === 'arroba';

  const getActiveButton = (): PanelTabType | null => {
    if (activeTab) return activeTab;
    if (!hasSelectedElement) return null;
    if (selectedElementType === 'background' || selectedElementType === 'image' || selectedElementType === 'avatar') return 'image';
    return null;
  };

  const activeButton = getActiveButton();

  // Se um texto está selecionado, mostra as opções de formatação de texto
  if (isTextSelected && isTextElement) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-lg border-t border-white/10 pb-safe"
      >
        {/* Indicador do elemento selecionado */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <span className="text-white/50 text-xs">
            Editando: <span className="text-blue-400 font-medium">{selectedElementType}</span>
          </span>
          <button
            onClick={onClearTextSelection}
            className="text-white/50 text-xs hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
        
        <div className="flex items-center justify-around px-2 py-3">
          {/* Editar texto */}
          <button
            onClick={onEnterTextEditMode}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 active:bg-white/10"
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Editar</span>
          </button>

          {/* Fonte */}
          <button
            onClick={() => onTextEditModeSelect?.('font')}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 active:bg-white/10"
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-medium">Fonte</span>
          </button>

          {/* Tamanho */}
          <button
            onClick={() => onTextEditModeSelect?.('size')}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 active:bg-white/10"
          >
            <span className="text-sm font-bold w-5 h-5 flex items-center justify-center">Aa</span>
            <span className="text-[10px] font-medium">Tamanho</span>
          </button>

          {/* Cor */}
          <button
            onClick={() => onTextEditModeSelect?.('color')}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 active:bg-white/10"
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cor</span>
          </button>

          {/* Formato (bold, italic, etc) */}
          <button
            onClick={() => onTextEditModeSelect?.('format')}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 active:bg-white/10"
          >
            <Bold className="w-5 h-5" />
            <span className="text-[10px] font-medium">Formato</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // Menu normal
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d1a]/95 backdrop-blur-lg border-t border-white/10 pb-safe"
    >
      <div className="flex items-center justify-around px-4 py-3">
        {/* Image/Background button */}
        <button
          onClick={() => onOpenPanel('image')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95 ${
            activeButton === 'image' 
              ? 'bg-blue-DEFAULT/20 text-blue-400' 
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Imagem</span>
        </button>

        {/* Slides button */}
        <button
          onClick={onOpenSlides}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium">Slides</span>
        </button>

        {/* Settings button */}
        <button
          onClick={() => onOpenPanel('settings')}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/60 hover:text-white transition-all active:scale-95"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Ajustes</span>
        </button>
      </div>
    </motion.div>
  );
};

export default MobileBottomBar;
