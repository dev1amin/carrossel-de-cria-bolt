/**
 * MobileDownloadModal - Modal de opções de download
 * Permite escolher baixar apenas o slide atual ou todos
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Image as ImageIcon, 
  Layers, 
  X, 
  Loader2 
} from 'lucide-react';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  currentSlide: number;
  totalSlides: number;
  isDownloading?: boolean;
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({
  isOpen,
  onClose,
  onDownloadCurrent,
  onDownloadAll,
  currentSlide,
  totalSlides,
  isDownloading = false,
}) => {
  const handleDownloadCurrent = () => {
    onDownloadCurrent();
  };

  const handleDownloadAll = () => {
    onDownloadAll();
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
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0d0d1a] rounded-t-3xl z-50 overflow-hidden shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-DEFAULT/20 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-DEFAULT" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Download</h3>
                  <p className="text-white/50 text-sm">Escolha uma opção</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isDownloading}
                className="p-2 rounded-xl text-white/50 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="p-5 space-y-3">
              {/* Download current slide */}
              <button
                onClick={handleDownloadCurrent}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-2xl text-white hover:bg-[#252542] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Baixar este slide</p>
                  <p className="text-sm text-white/50">
                    Slide {currentSlide + 1} de {totalSlides}
                  </p>
                </div>
                {isDownloading && (
                  <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                )}
              </button>

              {/* Download all slides */}
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="w-full flex items-center gap-4 p-4 bg-[#1a1a2e] rounded-2xl text-white hover:bg-[#252542] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-DEFAULT/20 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-blue-DEFAULT" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Baixar todos os slides</p>
                  <p className="text-sm text-white/50">
                    {totalSlides} {totalSlides === 1 ? 'slide' : 'slides'} serão baixados
                  </p>
                </div>
                {isDownloading && (
                  <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                )}
              </button>
            </div>

            {/* Footer note */}
            <div className="px-5 pb-6">
              <p className="text-white/30 text-xs text-center">
                Os slides serão baixados como imagens PNG
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDownloadModal;
