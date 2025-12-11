/**
 * MobilePropertiesPanel - Painel de propriedades deslizante para mobile
 * Abre de baixo para cima com swipe e drag
 * Suporta 2 abas: Imagem e Ajustes
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { 
  Image as ImageIcon,
  Search,
  Upload,
  Sun,
  Moon,
  Hash,
  BadgeCheck,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react';
import type { CarouselData } from '../../../../types/carousel';
import type { GlobalSettings, SelectedElement } from './types';
import type { PanelTabType } from './MobileBottomBar';

interface MobilePropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PanelTabType;
  selectedElement: SelectedElement;
  carouselData: CarouselData;
  globalSettings: GlobalSettings;
  editedContent: Record<string, any>;
  uploadedImages: Record<number, string>;
  searchKeyword: string;
  searchResults: string[];
  isSearching: boolean;
  // Handlers de imagem
  onUpdateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  onBackgroundImageChange: (slideIndex: number, imageUrl: string) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onSearchImages: () => void;
  onImageUpload: (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateAIImage?: (slideIndex: number, prompt?: string) => void;
  getEditedValue: (slideIndex: number, field: string, defaultValue: any) => any;
  // Função para ler valor diretamente do iframe (slide real)
  getSlideValue?: (type: 'nome' | 'arroba') => string;
  // Handlers de ajustes globais
  onUpdateNome?: (nome: string) => void;
  onUpdateArroba?: (arroba: string) => void;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MIN_HEIGHT = 80;
const SNAP_POINTS = [80, 300, 500]; // Pontos de snap para o painel

export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  isOpen,
  onClose,
  initialTab,
  selectedElement,
  carouselData,
  globalSettings,
  editedContent,
  uploadedImages,
  searchKeyword,
  searchResults,
  isSearching,
  onUpdateGlobalSettings,
  onBackgroundImageChange,
  onSearchKeywordChange,
  onSearchImages,
  onImageUpload,
  onAvatarUpload,
  onGenerateAIImage,
  getEditedValue,
  getSlideValue,
  // Props de ajustes globais
  onUpdateNome,
  onUpdateArroba,
  onLogoUpload,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTabType>(initialTab || 'image');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  
  // Estados locais para debounce de nome/arroba - só salva quando sair do campo
  const [localNome, setLocalNome] = useState('');
  const [localArroba, setLocalArroba] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Inicializa valores locais quando abre o painel - LÊ DIRETAMENTE DO IFRAME
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      // Prioridade: getSlideValue (valor real do iframe) > dados_gerais (fallback)
      let nomeValue = '';
      let arrobaValue = '';
      
      // Tenta ler diretamente do iframe (valor real no slide)
      if (getSlideValue) {
        nomeValue = getSlideValue('nome');
        arrobaValue = getSlideValue('arroba');
        console.log('📱 [MobilePropertiesPanel] Valores lidos do iframe:', { nomeValue, arrobaValue });
      }
      
      // Fallback: dados_gerais (se não conseguiu ler do iframe)
      if (!nomeValue || !arrobaValue) {
        const dadosGerais = (carouselData as any).dados_gerais;
        if (!nomeValue) nomeValue = dadosGerais?.nome ?? '';
        if (!arrobaValue) arrobaValue = dadosGerais?.arroba ?? '';
        console.log('📱 [MobilePropertiesPanel] Fallback para dados_gerais:', { nomeValue, arrobaValue });
      }
      
      setLocalNome(nomeValue);
      setLocalArroba(arrobaValue);
      setHasInitialized(true);
    }
    
    // Reset quando fecha
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, carouselData, getSlideValue, hasInitialized]);

  // Ref para guardar os valores mais recentes para salvar quando fecha
  const localNomeRef = React.useRef(localNome);
  const localArrobaRef = React.useRef(localArroba);
  
  useEffect(() => {
    localNomeRef.current = localNome;
    localArrobaRef.current = localArroba;
  }, [localNome, localArroba]);

  // Salva quando o painel fecha
  const prevIsOpen = React.useRef(isOpen);
  useEffect(() => {
    // Detecta quando muda de aberto para fechado
    if (prevIsOpen.current && !isOpen) {
      if (localNomeRef.current) {
        onUpdateNome?.(localNomeRef.current);
      }
      if (localArrobaRef.current) {
        onUpdateArroba?.(localArrobaRef.current);
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, onUpdateNome, onUpdateArroba]);

  // Atualiza aba ativa quando initialTab muda
  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  
  const data = carouselData as any;
  const conteudo = data.conteudos?.[selectedElement.slideIndex];
  
  const y = useMotionValue(0);
  // Protege contra NaN usando transformação segura
  const opacity = useTransform(y, (yValue) => {
    const numY = typeof yValue === 'number' && !isNaN(yValue) ? yValue : 0;
    const normalizedOpacity = 1 - (numY / 400); // Mapeia 0->200 para 1->0.5
    return Math.max(0.5, Math.min(1, normalizedOpacity));
  });

  // Calcula imagens disponíveis para o slide
  const availableImages = React.useMemo(() => {
    const PLACEHOLDER = 'https://i.imgur.com/kFVf8q3.png';
    if (!conteudo) return [];
    
    return [
      conteudo.imagem_fundo,
      conteudo.imagem_fundo2,
      conteudo.imagem_fundo3,
      conteudo.imagem_fundo4,
      conteudo.imagem_fundo5,
      conteudo.imagem_fundo6,
    ].filter((img: string) => img && img !== PLACEHOLDER);
  }, [conteudo]);

  const selectedBackground = uploadedImages[selectedElement.slideIndex] || 
    getEditedValue(selectedElement.slideIndex, 'background', conteudo?.imagem_fundo);

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.point.y;
    
    // Se arrastou rápido para baixo, fecha
    if (velocity > 500) {
      onClose();
      return;
    }
    
    // Encontra o ponto de snap mais próximo
    const windowHeight = window.innerHeight;
    const dragDistance = currentY;
    const newHeight = windowHeight - dragDistance;
    
    // Snap para o ponto mais próximo
    const closestSnap = SNAP_POINTS.reduce((prev, curr) => 
      Math.abs(curr - newHeight) < Math.abs(prev - newHeight) ? curr : prev
    );
    
    if (closestSnap <= MIN_HEIGHT) {
      onClose();
    } else {
      setPanelHeight(closestSnap);
    }
  }, [onClose]);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() || !onGenerateAIImage) return;
    setIsGeneratingAI(true);
    try {
      await onGenerateAIImage(selectedElement.slideIndex, aiPrompt);
    } finally {
      setIsGeneratingAI(false);
      setAiPrompt('');
    }
  };

  // Upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity, height: panelHeight }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl z-50 overflow-hidden shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Tabs */}
            <div className="flex px-4 pb-3 gap-2">
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'image' 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Imagem
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'settings' 
                    ? 'bg-blue-DEFAULT text-white' 
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <Sun className="w-4 h-4 inline mr-2" />
                Ajustes
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-8 overflow-y-auto overflow-x-hidden" style={{ height: panelHeight - 100 }}>
              <AnimatePresence mode="wait">
                {activeTab === 'image' && (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Imagens disponíveis */}
                    {availableImages.length > 0 && (
                      <div>
                        <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                          Imagens do slide
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {availableImages.map((img: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, img)}
                              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                                selectedBackground === img 
                                  ? 'border-blue-DEFAULT scale-105' 
                                  : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Buscar imagens */}
                    <div>
                      <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                        Buscar imagens
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchKeyword}
                          onChange={(e) => onSearchKeywordChange(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && onSearchImages()}
                          placeholder="Ex: escritório, natureza..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-DEFAULT"
                        />
                        <button
                          onClick={onSearchImages}
                          disabled={isSearching || !searchKeyword.trim()}
                          className="bg-blue-DEFAULT text-white p-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
                        >
                          {isSearching ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Search className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Resultados da busca */}
                    {searchResults.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {searchResults.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => onBackgroundImageChange(selectedElement.slideIndex, img)}
                            className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-DEFAULT transition-all"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Upload */}
                    <div>
                      <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                        Upload
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 bg-white/10 border border-dashed border-white/30 rounded-xl py-4 text-white/70 hover:bg-white/20 transition-all active:scale-98"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Imagem</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => onImageUpload(selectedElement.slideIndex, e)}
                          className="hidden"
                        />
                        
                        {onAvatarUpload && (
                          <>
                            <button
                              onClick={() => avatarInputRef.current?.click()}
                              className="flex items-center justify-center gap-2 bg-white/10 border border-dashed border-white/30 rounded-xl py-4 text-white/70 hover:bg-white/20 transition-all active:scale-98"
                            >
                              <User className="w-5 h-5" />
                              <span className="text-sm">Avatar</span>
                            </button>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              onChange={onAvatarUpload}
                              className="hidden"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    {/* IA Generate */}
                    {onGenerateAIImage && (
                      <div>
                        <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Gerar com IA
                        </h3>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Descreva a imagem..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                          />
                          <button
                            onClick={handleGenerateAI}
                            disabled={isGeneratingAI || !aiPrompt.trim()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
                          >
                            {isGeneratingAI ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Sparkles className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Nome do perfil */}
                    <div>
                      <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                        Nome do perfil
                      </h3>
                      <input
                        type="text"
                        value={localNome}
                        onChange={(e) => setLocalNome(e.target.value)}
                        onBlur={() => {
                          // Só salva quando sai do campo
                          if (localNome) onUpdateNome?.(localNome);
                        }}
                        placeholder="Nome do perfil..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-DEFAULT"
                      />
                    </div>

                    {/* Arroba */}
                    <div>
                      <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                        @ Arroba
                      </h3>
                      <input
                        type="text"
                        value={localArroba}
                        onChange={(e) => setLocalArroba(e.target.value)}
                        onBlur={() => {
                          // Só salva quando sai do campo
                          if (localArroba) onUpdateArroba?.(localArroba);
                        }}
                        placeholder="@usuario..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-DEFAULT"
                      />
                    </div>

                    {/* Logo/Avatar upload */}
                    {onLogoUpload && (
                      <div>
                        <h3 className="text-white/70 text-xs font-medium mb-2 uppercase tracking-wider">
                          Logo/Avatar
                        </h3>
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => onLogoUpload(e as any);
                            input.click();
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-white/10 border border-dashed border-white/30 rounded-xl py-4 text-white/70 hover:bg-white/20 transition-all active:scale-98"
                        >
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">Fazer upload do logo</span>
                        </button>
                      </div>
                    )}

                    {/* Theme toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        {globalSettings.theme === 'light' ? (
                          <Sun className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Moon className="w-5 h-5 text-blue-400" />
                        )}
                        <span className="text-white font-medium">Tema</span>
                      </div>
                      <button
                        onClick={() => onUpdateGlobalSettings({ 
                          theme: globalSettings.theme === 'light' ? 'dark' : 'light' 
                        })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          globalSettings.theme === 'dark' ? 'bg-blue-DEFAULT' : 'bg-gray-400'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            globalSettings.theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Slide number toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-white/70" />
                        <span className="text-white font-medium">Número do slide</span>
                      </div>
                      <button
                        onClick={() => onUpdateGlobalSettings({ 
                          showSlideNumber: !globalSettings.showSlideNumber 
                        })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          globalSettings.showSlideNumber ? 'bg-blue-DEFAULT' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            globalSettings.showSlideNumber ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Badge verificado toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">Badge verificado</span>
                      </div>
                      <button
                        onClick={() => onUpdateGlobalSettings({ 
                          showVerifiedBadge: !globalSettings.showVerifiedBadge 
                        })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          globalSettings.showVerifiedBadge ? 'bg-blue-DEFAULT' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            globalSettings.showVerifiedBadge ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobilePropertiesPanel;
