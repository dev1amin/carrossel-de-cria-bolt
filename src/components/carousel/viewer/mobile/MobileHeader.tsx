/**
 * MobileHeader - Cabeçalho do editor mobile
 * Com botões de ação e indicador de status
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Save, 
  MoreVertical, 
  Loader2,
  Cloud
} from 'lucide-react';

interface MobileHeaderProps {
  onClose: () => void;
  onSave: () => void;
  onDownload: () => void;
  onOpenMenu: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  currentSlide: number;
  totalSlides: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onClose,
  onSave,
  onDownload,
  onOpenMenu,
  isSaving,
  hasUnsavedChanges,
  currentSlide,
  totalSlides,
}) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d1a]/95 backdrop-blur-lg border-b border-white/10"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Close */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-white/70 hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Center - Slide counter + Save status */}
        <div className="flex items-center gap-3">
          {/* Slide counter */}
          <div className="bg-white/10 px-3 py-1.5 rounded-full">
            <span className="text-white font-medium text-sm">
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>

          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-blue-400"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Salvando...</span>
              </motion.div>
            ) : hasUnsavedChanges ? (
              <motion.div
                key="unsaved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-yellow-400"
              >
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-xs">Não salvo</span>
              </motion.div>
            ) : (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 text-green-400"
              >
                <Cloud className="w-4 h-4" />
                <span className="text-xs">Salvo</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* Save button */}
          <button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`p-2 rounded-xl transition-all active:scale-95 ${
              hasUnsavedChanges 
                ? 'text-blue-400 hover:bg-blue-400/20' 
                : 'text-white/30'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>

          {/* Download button */}
          <button
            onClick={onDownload}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Menu button */}
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 transition-all active:scale-95"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default MobileHeader;
