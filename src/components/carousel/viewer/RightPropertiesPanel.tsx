import React, { useState } from 'react';
import { 
  Settings2, 
  Type, 
  Image as ImageIcon, 
  Upload, 
  Search, 
  Play,
  ChevronRight,
  ChevronDown,
  Sun,
  Palette,
  Hash,
  BadgeCheck,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  User,
  Sliders,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { CarouselData, ElementType, ElementStyles, TemplateCompatibility } from '../../../types/carousel';
import { isVideoUrl } from './viewerUtils';

// === Types ===
interface RightPropertiesPanelProps {
  selectedElement: { slideIndex: number; element: ElementType };
  carouselData: CarouselData;
  editedContent: Record<string, any>;
  isLoadingProperties: boolean;
  searchKeyword: string;
  searchResults: string[];
  isSearching: boolean;
  uploadedImages: Record<number, string>;
  isMinimized?: boolean;
  templateCompatibility?: TemplateCompatibility;
  globalSettings: GlobalSettings;
  iframeRefs?: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  onToggleMinimize?: () => void;
  onUpdateEditedValue: (slideIndex: number, field: string, value: any) => void;
  onUpdateElementStyle: (slideIndex: number, element: ElementType, prop: keyof ElementStyles, value: string) => void;
  onBackgroundImageChange: (slideIndex: number, imageUrl: string) => void;
  onAvatarChange?: (imageUrl: string) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onSearchImages: () => void;
  onImageUpload: (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateAIImage?: (slideIndex: number, prompt?: string) => void;
  getElementStyle: (slideIndex: number, element: ElementType) => ElementStyles;
  getEditedValue: (slideIndex: number, field: string, def: any) => any;
  onUpdateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
}

interface GlobalSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  showSlideNumber: boolean;
  showVerifiedBadge: boolean;
  headerScale: number;
  fontStyle: string;
  fontScale: number;
}

// === Collapsible Section Component ===
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
}) => (
  <div className="border-b border-gray-light">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-light/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-dark">{title}</span>
        {badge && (
          <span className="text-[10px] bg-blue-light text-blue-dark px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-gray-DEFAULT" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-DEFAULT" />
      )}
    </button>
    {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
  </div>
);

// === Toggle Control Component ===
interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

const ToggleControl: React.FC<ToggleControlProps> = ({
  label,
  checked,
  onChange,
  icon,
}) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-medium text-gray-dark">{label}</span>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative w-10 h-5 rounded-full transition-colors
        ${checked ? 'bg-blue-DEFAULT' : 'bg-gray-light'}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
      />
    </button>
  </div>
);

// === Text Formatting Toolbar Component ===
interface TextFormattingToolbarProps {
  onApplyStyle: (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
  currentStyles: {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikethrough: boolean;
  };
}

const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({ onApplyStyle, currentStyles }) => (
  <div className="flex items-center gap-1 flex-wrap p-1 bg-gray-100 rounded-lg border border-gray-200">
    <button
      onClick={() => onApplyStyle('bold')}
      className={`p-1.5 rounded transition-colors border ${currentStyles.isBold ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'hover:bg-white text-gray-dark border-gray-300 bg-white'}`}
      title="Negrito"
    >
      <Bold className="w-4 h-4" />
    </button>
    <button
      onClick={() => onApplyStyle('italic')}
      className={`p-1.5 rounded transition-colors border ${currentStyles.isItalic ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'hover:bg-white text-gray-dark border-gray-300 bg-white'}`}
      title="Itálico"
    >
      <Italic className="w-4 h-4" />
    </button>
    <button
      onClick={() => onApplyStyle('underline')}
      className={`p-1.5 rounded transition-colors border ${currentStyles.isUnderline ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'hover:bg-white text-gray-dark border-gray-300 bg-white'}`}
      title="Sublinhado"
    >
      <Underline className="w-4 h-4" />
    </button>
    <button
      onClick={() => onApplyStyle('strikethrough')}
      className={`p-1.5 rounded transition-colors border ${currentStyles.isStrikethrough ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' : 'hover:bg-white text-gray-dark border-gray-300 bg-white'}`}
      title="Tachado"
    >
      <Strikethrough className="w-4 h-4" />
    </button>
  </div>
);

// === Main Component ===
export const RightPropertiesPanel: React.FC<RightPropertiesPanelProps> = ({
  selectedElement,
  carouselData,
  editedContent,
  isLoadingProperties,
  searchKeyword,
  searchResults,
  isSearching,
  uploadedImages,
  isMinimized = false,
  templateCompatibility = 'video-image',
  globalSettings,
  iframeRefs,
  onToggleMinimize,
  onUpdateEditedValue,
  onUpdateElementStyle,
  onBackgroundImageChange,
  onSearchKeywordChange,
  onSearchImages,
  onImageUpload,
  onAvatarUpload,
  onGenerateAIImage,
  getElementStyle,
  getEditedValue,
  onUpdateGlobalSettings,
}) => {
  const data = carouselData as any;
  const canUseVideo = templateCompatibility === 'video-image';

  // Section states
  const [openSections, setOpenSections] = useState({
    global: true,
    slide: true,
    image: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Image settings state
  const [imageSettings, setImageSettings] = useState({
    position: 'center' as 'top' | 'center' | 'bottom',
    aiPrompt: '',
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Handle image position change
  const handleImagePositionChange = (position: 'top' | 'center' | 'bottom') => {
    setImageSettings((prev) => ({ ...prev, position }));
    
    // Mapeia posição para object-position CSS
    const positionMap = {
      top: 'center top',
      center: 'center center',
      bottom: 'center bottom',
    };
    
    onUpdateElementStyle(
      selectedElement.slideIndex, 
      'background', 
      'objectPosition', 
      positionMap[position]
    );
  };

  // Text formatting handler - aplica estilos CSS reais
  // Suporta seleção parcial de texto usando execCommand
  const handleApplyTextStyle = (style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    const field = selectedElement.element;
    if (!field || field === 'background' || field === 'avatar') return;
    
    // Tenta aplicar via execCommand no iframe para seleção parcial
    if (iframeRefs) {
      const ifr = iframeRefs.current[selectedElement.slideIndex];
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (doc) {
        const selection = doc.getSelection();
        // Se há seleção de texto, aplica via execCommand
        if (selection && selection.toString().length > 0) {
          try {
            const commandMap: Record<string, string> = {
              'bold': 'bold',
              'italic': 'italic',
              'underline': 'underline',
              'strikethrough': 'strikeThrough',
            };
            doc.execCommand(commandMap[style], false);
            return;
          } catch (e) {
            console.warn('execCommand failed, falling back to CSS styles', e);
          }
        }
      }
    }
    
    // Fallback: aplica no elemento inteiro via CSS
    const currentStyle = getElementStyle(selectedElement.slideIndex, field);
    
    switch (style) {
      case 'bold':
        const newWeight = currentStyle.fontWeight === '700' || currentStyle.fontWeight === 'bold' ? '400' : '700';
        onUpdateElementStyle(selectedElement.slideIndex, field, 'fontWeight', newWeight);
        break;
      case 'italic':
        const newFontStyle = currentStyle.fontStyle === 'italic' ? 'normal' : 'italic';
        onUpdateElementStyle(selectedElement.slideIndex, field, 'fontStyle', newFontStyle);
        break;
      case 'underline':
        // Se já tem underline, remove. Senão, adiciona (remove line-through se tiver)
        const hasUnderline = currentStyle.textDecoration?.includes('underline');
        const newUnderlineDecoration = hasUnderline ? 'none' : 'underline';
        onUpdateElementStyle(selectedElement.slideIndex, field, 'textDecoration', newUnderlineDecoration);
        break;
      case 'strikethrough':
        // Se já tem line-through, remove. Senão, adiciona (remove underline se tiver)
        const hasStrikethrough = currentStyle.textDecoration?.includes('line-through');
        const newStrikeDecoration = hasStrikethrough ? 'none' : 'line-through';
        onUpdateElementStyle(selectedElement.slideIndex, field, 'textDecoration', newStrikeDecoration);
        break;
    }
  };

  // Retorna os estilos atuais do texto para mostrar na toolbar
  const getCurrentTextStyles = () => {
    const field = selectedElement.element;
    if (!field || field === 'background' || field === 'avatar') {
      return { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false };
    }
    
    const currentStyle = getElementStyle(selectedElement.slideIndex, field);
    return {
      isBold: currentStyle.fontWeight === '700' || currentStyle.fontWeight === 'bold',
      isItalic: currentStyle.fontStyle === 'italic',
      isUnderline: currentStyle.textDecoration?.includes('underline') || false,
      isStrikethrough: currentStyle.textDecoration?.includes('line-through') || false,
    };
  };

  // Minimized state
  if (isMinimized) {
    return (
      <div className="w-14 bg-white border-l border-gray-light flex flex-col items-center shrink-0">
        <button
          onClick={onToggleMinimize}
          className="h-14 w-full flex items-center justify-center hover:bg-gray-light border-b border-gray-light transition-colors"
          title="Expandir Propriedades"
        >
          <Settings2 className="w-5 h-5 text-gray-DEFAULT" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[384px] bg-white border-l border-gray-light flex flex-col shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-gray-light flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-DEFAULT" />
          <h3 className="text-gray-dark font-semibold text-sm">Propriedades</h3>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-1.5 hover:bg-gray-light rounded transition-colors"
          title="Minimizar"
        >
          <ChevronRight className="w-4 h-4 text-gray-DEFAULT" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* SECTION A: Global Settings */}
        <CollapsibleSection
          title="Configurações Globais"
          icon={<Sliders className="w-4 h-4 text-blue-DEFAULT" />}
          isOpen={openSections.global}
          onToggle={() => toggleSection('global')}
        >
          {/* Theme Toggle - Only for templates 7 and 8 */}
          {(data.dados_gerais?.template === '7' || data.dados_gerais?.template === '8') && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-light/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-dark">Tema</span>
              </div>
              <div className="flex items-center bg-white rounded-lg border border-gray-light p-0.5">
                <button
                  onClick={() => onUpdateGlobalSettings({ theme: 'light' })}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    globalSettings.theme === 'light'
                      ? 'bg-blue-DEFAULT text-white'
                      : 'text-gray-DEFAULT hover:text-gray-dark'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => onUpdateGlobalSettings({ theme: 'dark' })}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    globalSettings.theme === 'dark'
                      ? 'bg-blue-dark text-white'
                      : 'text-gray-DEFAULT hover:text-gray-dark'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          )}

          {/* Background Color */}
          <div className="flex items-center gap-3">
            <Palette className="w-4 h-4 text-blue-DEFAULT" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-dark block mb-1.5">
                Cor de Fundo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={globalSettings.accentColor}
                  onChange={(e) => onUpdateGlobalSettings({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-light"
                />
                <input
                  type="text"
                  value={globalSettings.accentColor}
                  onChange={(e) => onUpdateGlobalSettings({ accentColor: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-light rounded focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT"
                  placeholder="#4167B2"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <ToggleControl
            label="Número do Slide"
            icon={<Hash className="w-3.5 h-3.5 text-gray-DEFAULT" />}
            checked={globalSettings.showSlideNumber}
            onChange={(checked) => onUpdateGlobalSettings({ showSlideNumber: checked })}
          />
          <ToggleControl
            label="Badge Verificado"
            icon={<BadgeCheck className="w-3.5 h-3.5 text-blue-DEFAULT" />}
            checked={globalSettings.showVerifiedBadge}
            onChange={(checked) => onUpdateGlobalSettings({ showVerifiedBadge: checked })}
          />

          {/* Font Style */}
          <div>
            <label className="text-xs font-medium text-gray-dark block mb-1.5">
              Estilo de Fonte
            </label>
            <select
              value={globalSettings.fontStyle}
              onChange={(e) => onUpdateGlobalSettings({ fontStyle: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-light rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT bg-white"
            >
              <option value="sans">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="display">Display</option>
            </select>
          </div>
        </CollapsibleSection>

        {/* SECTION B: Slide Settings */}
        <CollapsibleSection
          title="Configurações do Slide"
          icon={<Type className="w-4 h-4 text-blue-DEFAULT" />}
          isOpen={openSections.slide}
          onToggle={() => toggleSection('slide')}
          badge={`#${selectedElement.slideIndex + 1}`}
        >
          {selectedElement.element === null ? (
            <div className="text-center py-6">
              <Type className="w-10 h-10 text-gray-light mx-auto mb-3" />
              <p className="text-sm text-gray-DEFAULT">Selecione um elemento</p>
              <p className="text-xs text-gray-DEFAULT mt-1">
                Clique em um elemento no preview para editar
              </p>
            </div>
          ) : (
            <>
              {/* Text Elements */}
              {(selectedElement.element === 'title' || 
                selectedElement.element === 'subtitle' || 
                selectedElement.element === 'nome' || 
                selectedElement.element === 'arroba') && (
                <>
                  {/* Text Formatting Toolbar */}
                  <div className="mb-2">
                    <label className="text-xs font-medium text-gray-dark block mb-1.5">
                      Formatação
                    </label>
                    <TextFormattingToolbar 
                      onApplyStyle={handleApplyTextStyle} 
                      currentStyles={getCurrentTextStyles()}
                    />
                  </div>

                  {/* Text Content */}
                  <div>
                    <label className="text-xs font-medium text-gray-dark block mb-1.5">
                      Conteúdo
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-gray-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-DEFAULT focus:border-transparent"
                      rows={selectedElement.element === 'title' ? 5 : 3}
                      value={(() => {
                        if (selectedElement.element === 'nome' || selectedElement.element === 'arroba') {
                          const defaultValue = data.dados_gerais?.[selectedElement.element] || '';
                          return editedContent[`${selectedElement.slideIndex}-${selectedElement.element}`] ?? defaultValue;
                        }
                        const v = data.conteudos[selectedElement.slideIndex]?.[selectedElement.element] || '';
                        return editedContent[`${selectedElement.slideIndex}-${selectedElement.element}`] ?? v;
                      })()}
                      onChange={(e) =>
                        onUpdateEditedValue(selectedElement.slideIndex, selectedElement.element!, e.target.value)
                      }
                      placeholder="Digite o texto..."
                    />
                  </div>

                  {/* Typography Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-dark block mb-1.5">
                        Tamanho
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 text-xs border border-gray-light rounded focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT"
                        value={getElementStyle(selectedElement.slideIndex, selectedElement.element).fontSize}
                        onChange={(e) =>
                          onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'fontSize', e.target.value)
                        }
                        placeholder="24px"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-dark block mb-1.5">
                        Peso
                      </label>
                      <select
                        className="w-full px-2 py-1.5 text-xs border border-gray-light rounded focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT bg-white"
                        value={getElementStyle(selectedElement.slideIndex, selectedElement.element).fontWeight}
                        onChange={(e) =>
                          onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'fontWeight', e.target.value)
                        }
                      >
                        <option value="300">Light</option>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="text-xs font-medium text-gray-dark block mb-1.5">
                      Alinhamento
                    </label>
                    <div className="flex items-center gap-1 bg-gray-light/50 rounded-lg p-1">
                      {[
                        { value: 'left', icon: AlignLeft },
                        { value: 'center', icon: AlignCenter },
                        { value: 'right', icon: AlignRight },
                      ].map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() =>
                            onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'textAlign', value)
                          }
                          className={`flex-1 p-2 rounded-md transition-all ${
                            getElementStyle(selectedElement.slideIndex, selectedElement.element).textAlign === value
                              ? 'bg-white shadow-sm'
                              : 'hover:bg-white/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-gray-dark mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-xs font-medium text-gray-dark block mb-1.5">
                      Cor
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="w-8 h-8 rounded cursor-pointer border border-gray-light"
                        value={getElementStyle(selectedElement.slideIndex, selectedElement.element).color}
                        onChange={(e) =>
                          onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'color', e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-light rounded focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT"
                        value={getElementStyle(selectedElement.slideIndex, selectedElement.element).color}
                        onChange={(e) =>
                          onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'color', e.target.value)
                        }
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Avatar */}
              {selectedElement.element === 'avatar' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-DEFAULT" />
                    <span className="text-sm font-medium text-gray-dark">Avatar</span>
                  </div>
                  <p className="text-xs text-gray-DEFAULT">
                    O avatar é replicado em todos os slides automaticamente.
                  </p>
                  
                  {/* Current Avatar */}
                  <div className="flex justify-center">
                    {data.dados_gerais?.foto_perfil ? (
                      <img 
                        src={data.dados_gerais.foto_perfil} 
                        alt="Avatar" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-light"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-light flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-DEFAULT" />
                      </div>
                    )}
                  </div>

                  {/* Upload */}
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-light rounded-lg cursor-pointer hover:bg-gray-light/30 transition-colors">
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-DEFAULT mx-auto mb-1" />
                      <span className="text-xs text-gray-DEFAULT">Upload novo avatar</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => onAvatarUpload?.(e)}
                    />
                  </label>
                </div>
              )}
            </>
          )}
        </CollapsibleSection>

        {/* SECTION C: Image Settings */}
        {selectedElement.element === 'background' && (
          <CollapsibleSection
            title="Configurações de Imagem"
            icon={<ImageIcon className="w-4 h-4 text-blue-DEFAULT" />}
            isOpen={openSections.image}
            onToggle={() => toggleSection('image')}
          >
            {isLoadingProperties ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-blue-DEFAULT animate-spin" />
              </div>
            ) : (
              <>
                {/* Current Images */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-dark">
                    Imagens Disponíveis
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      data.conteudos[selectedElement.slideIndex]?.imagem_fundo,
                      data.conteudos[selectedElement.slideIndex]?.imagem_fundo2,
                      data.conteudos[selectedElement.slideIndex]?.imagem_fundo3,
                      uploadedImages[selectedElement.slideIndex],
                    ].filter(Boolean).map((url, idx) => {
                      const isVid = isVideoUrl(url);
                      if (isVid && !canUseVideo) return null;
                      
                      const currentBg = getEditedValue(
                        selectedElement.slideIndex,
                        'background',
                        data.conteudos[selectedElement.slideIndex]?.imagem_fundo
                      );

                      return (
                        <div
                          key={idx}
                          onClick={() => onBackgroundImageChange(selectedElement.slideIndex, url)}
                          className={`
                            relative rounded-lg overflow-hidden cursor-pointer transition-all
                            ${currentBg === url 
                              ? 'ring-2 ring-blue-DEFAULT ring-offset-1' 
                              : 'hover:ring-2 hover:ring-blue-light'
                            }
                          `}
                        >
                          <img 
                            src={url} 
                            alt={`Option ${idx + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          {isVid && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Play className="w-6 h-6 text-white" fill="white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Image Position - Simple selector */}
                <div>
                  <label className="text-xs font-medium text-gray-dark block mb-2">
                    Posição da Imagem
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'top', label: 'Topo', icon: '⬆️' },
                      { value: 'center', label: 'Centro', icon: '⬅️➡️' },
                      { value: 'bottom', label: 'Baixo', icon: '⬇️' },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        onClick={() => handleImagePositionChange(value as 'top' | 'center' | 'bottom')}
                        className={`
                          flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-all border
                          ${imageSettings.position === value
                            ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT'
                            : 'bg-white text-gray-dark border-gray-light hover:border-blue-light hover:bg-blue-light/10'
                          }
                        `}
                      >
                        <span className="text-base">{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Images */}
                <div>
                  <label className="text-xs font-medium text-gray-dark block mb-1.5">
                    Buscar Imagens
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => onSearchKeywordChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSearchImages()}
                      className="w-full pl-9 pr-16 py-2 text-sm border border-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-DEFAULT"
                      placeholder="Buscar imagens..."
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-DEFAULT" />
                    <button
                      onClick={onSearchImages}
                      disabled={isSearching || !searchKeyword.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-DEFAULT text-white text-xs rounded-md disabled:bg-gray-light disabled:text-gray-DEFAULT"
                    >
                      {isSearching ? '...' : 'Buscar'}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                      {searchResults.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Result ${idx + 1}`}
                          onClick={() => onBackgroundImageChange(selectedElement.slideIndex, url)}
                          className="w-full aspect-square object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-DEFAULT"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Generate */}
                <div className="pt-2 border-t border-gray-light">
                  <label className="text-xs font-medium text-gray-dark block mb-1.5">
                    Gerar com IA
                  </label>
                  <textarea
                    value={imageSettings.aiPrompt}
                    onChange={(e) => setImageSettings((prev) => ({ ...prev, aiPrompt: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-DEFAULT"
                    rows={2}
                    placeholder="Descreva a imagem que deseja gerar..."
                  />
                  <button
                    onClick={() => {
                      setIsGeneratingAI(true);
                      onGenerateAIImage?.(selectedElement.slideIndex, imageSettings.aiPrompt);
                      setTimeout(() => setIsGeneratingAI(false), 3000);
                    }}
                    disabled={isGeneratingAI}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-blue-DEFAULT to-blue-dark text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Gerar Imagem
                      </>
                    )}
                  </button>
                </div>

                {/* Upload */}
                <div>
                  <label className="text-xs font-medium text-gray-dark block mb-1.5">
                    Upload
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-light rounded-lg cursor-pointer hover:bg-gray-light/30 transition-colors">
                    <Upload className="w-6 h-6 text-gray-DEFAULT mb-1" />
                    <span className="text-xs text-gray-DEFAULT">Clique para fazer upload</span>
                    <span className="text-[10px] text-gray-DEFAULT mt-0.5">PNG, JPG ou GIF</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => onImageUpload(selectedElement.slideIndex, e)}
                    />
                  </label>
                </div>
              </>
            )}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

export default RightPropertiesPanel;
