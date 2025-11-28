import React from 'react';
import { Type, Upload, Search, Play, ChevronLeft, User } from 'lucide-react';
import type { CarouselData, ElementType, ElementStyles, TemplateCompatibility } from '../../../types/carousel';
import { isVideoUrl } from './viewerUtils';

interface PropertiesPanelProps {
  selectedElement: { slideIndex: number; element: ElementType };
  carouselData: CarouselData;
  editedContent: Record<string, any>;
  isLoadingProperties: boolean;
  searchKeyword: string;
  searchResults: string[];
  isSearching: boolean;
  uploadedImages: Record<number, string>;
  isMinimized?: boolean;
  templateCompatibility?: TemplateCompatibility; // Compatibilidade do template
  searchInputRef?: React.RefObject<HTMLInputElement>;
  isSearchInputPulsing?: boolean;
  onSearchInputClick?: () => void;
  onToggleMinimize?: () => void;
  onUpdateEditedValue: (slideIndex: number, field: string, value: any) => void;
  onUpdateElementStyle: (slideIndex: number, element: ElementType, prop: keyof ElementStyles, value: string) => void;
  onBackgroundImageChange: (slideIndex: number, imageUrl: string) => void;
  onAvatarChange?: (imageUrl: string) => void; // Novo: para mudar avatar em todos os slides
  onSearchKeywordChange: (keyword: string) => void;
  onSearchImages: () => void;
  onImageUpload: (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Novo: upload de avatar
  getElementStyle: (slideIndex: number, element: ElementType) => ElementStyles;
  getEditedValue: (slideIndex: number, field: string, def: any) => any;
}

// Hook para validar se uma imagem/vídeo pode ser carregado
const useMediaValidation = (urls: string[]) => {
  const [validUrls, setValidUrls] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const validateUrls = async () => {
      setLoading(true);
      const valid = new Set<string>();
      
      await Promise.all(
        urls.map(async (url) => {
          if (!url) return;
          
          try {
            // Tenta carregar a imagem/vídeo
            if (isVideoUrl(url)) {
              // Para vídeos, tenta fazer um HEAD request
              const response = await fetch(url, { method: 'HEAD' });
              if (response.ok) {
                valid.add(url);
              }
            } else {
              // Para imagens, tenta carregar
              await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                  valid.add(url);
                  resolve(true);
                };
                img.onerror = reject;
                img.src = url;
              });
            }
          } catch (error) {
            console.warn(`Failed to validate media: ${url}`, error);
          }
        })
      );
      
      setValidUrls(valid);
      setLoading(false);
    };

    if (urls.length > 0) {
      validateUrls();
    } else {
      setLoading(false);
    }
  }, [urls.join(',')]);

  return { validUrls, loading };
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
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
  searchInputRef,
  isSearchInputPulsing = false,
  onSearchInputClick,
  onToggleMinimize,
  onUpdateEditedValue,
  onUpdateElementStyle,
  onBackgroundImageChange,
  onAvatarChange,
  onSearchKeywordChange,
  onSearchImages,
  onImageUpload,
  onAvatarUpload,
  getElementStyle,
  getEditedValue,
}) => {
  const data = carouselData as any;
  const canUseVideo = templateCompatibility === 'video-image';
  
  // Coleta todas as URLs de mídia para validação
  const mediaUrls = React.useMemo(() => {
    const urls: string[] = [];
    const conteudo = data.conteudos?.[selectedElement.slideIndex];
    if (conteudo) {
      if (conteudo.imagem_fundo) urls.push(conteudo.imagem_fundo);
      if (conteudo.imagem_fundo2) urls.push(conteudo.imagem_fundo2);
      if (conteudo.imagem_fundo3) urls.push(conteudo.imagem_fundo3);
      if (conteudo.thumbnail_url) urls.push(conteudo.thumbnail_url);
    }
    if (uploadedImages[selectedElement.slideIndex]) {
      urls.push(uploadedImages[selectedElement.slideIndex]);
    }
    return urls;
  }, [data.conteudos, selectedElement.slideIndex, uploadedImages]);
  
  // Valida as mídias
  const { validUrls, loading: validatingMedia } = useMediaValidation(mediaUrls);

  // Se minimizado, mostra apenas um botão para expandir
  if (isMinimized) {
    return (
      <div className="w-12 bg-gray-50 border-l border-gray-200 flex flex-col items-center shrink-0">
        <button
          onClick={onToggleMinimize}
          className="h-14 w-full flex items-center justify-center hover:bg-gray-100 border-b border-gray-200 transition-colors"
          title="Expandir Propriedades"
        >
          <Type className="w-5 h-5 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4">
        <h3 className="text-white font-medium text-sm">Properties</h3>
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Minimizar"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {selectedElement.element === null ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Type className="w-8 h-8 text-neutral-700" />
            </div>
            <h4 className="text-white font-medium mb-2">No Element Selected</h4>
            <p className="text-neutral-500 text-sm mb-1">Click on an element in the preview</p>
            <p className="text-neutral-500 text-sm">to edit its properties</p>
            <div className="mt-6 space-y-2 text-xs text-neutral-600">
              <p>• Single click to select</p>
              <p>• Double click text to edit inline</p>
              <p>• Press ESC to deselect</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(selectedElement.element === 'title' || selectedElement.element === 'subtitle' || selectedElement.element === 'nome' || selectedElement.element === 'arroba') && (
              <>
                <div>
                  <label className="text-neutral-400 text-xs mb-2 block font-medium">Text Content</label>
                  <textarea
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={selectedElement.element === 'title' ? 4 : (selectedElement.element === 'nome' || selectedElement.element === 'arroba' ? 2 : 3)}
                    value={(() => {
                      // Nome e arroba vêm de dados_gerais, não de conteudos
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
                  />
                </div>

                <div>
                  <label className="text-gray-600 text-xs mb-2 block font-medium">Font Size</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={getElementStyle(selectedElement.slideIndex, selectedElement.element).fontSize}
                    onChange={(e) =>
                      onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'fontSize', e.target.value)
                    }
                    placeholder="e.g. 24px, 1.5rem"
                  />
                </div>

                <div>
                  <label className="text-gray-600 text-xs mb-2 block font-medium">Font Weight</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={getElementStyle(selectedElement.slideIndex, selectedElement.element).fontWeight}
                    onChange={(e) =>
                      onUpdateElementStyle(
                        selectedElement.slideIndex,
                        selectedElement.element!,
                        'fontWeight',
                        e.target.value
                      )
                    }
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 text-xs mb-2 block font-medium">Text Align</label>
                  <select
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={getElementStyle(selectedElement.slideIndex, selectedElement.element).textAlign}
                    onChange={(e) =>
                      onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'textAlign', e.target.value)
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 text-xs mb-2 block font-medium">Color</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      className="w-12 h-10 bg-white border border-gray-300 rounded cursor-pointer"
                      value={getElementStyle(selectedElement.slideIndex, selectedElement.element).color}
                      onChange={(e) =>
                        onUpdateElementStyle(selectedElement.slideIndex, selectedElement.element!, 'color', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

            {selectedElement.element === 'background' && (
              <>
                {isLoadingProperties || validatingMedia ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    {validatingMedia && <p className="text-neutral-400 text-xs ml-2">Validating media...</p>}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-neutral-400 text-xs mb-2 block font-medium">Imagem de Fundo{canUseVideo ? '/Vídeo' : ''}</label>
                      {!canUseVideo && (
                        <span className="text-xs text-yellow-500">Videos not supported</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {data.conteudos[selectedElement.slideIndex]?.imagem_fundo &&
                        (() => {
                          const bgUrl = data.conteudos[selectedElement.slideIndex]?.imagem_fundo;
                          const isVid = isVideoUrl(bgUrl);
                          
                          // Filtra vídeos se o template não suporta
                          if (isVid && !canUseVideo) return null;
                          
                          // Filtra mídias inválidas
                          if (!validUrls.has(bgUrl)) return null;
                          
                          const thumb = data.conteudos[selectedElement.slideIndex]?.thumbnail_url;
                          const displayUrl = isVid && thumb ? thumb : bgUrl;
                          const currentBg = getEditedValue(selectedElement.slideIndex, 'background', bgUrl);
                          return (
                            <div
                              className={`bg-white border rounded p-2 cursor-pointer transition-all ${
                                currentBg === bgUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                              }`}
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, bgUrl)}
                            >
                              <div className="text-gray-700 text-xs mb-1 flex items-center justify-between">
                                <span>{isVid ? 'Video 1' : 'Image 1'}</span>
                                {isVid && <Play className="w-3 h-3" />}
                              </div>
                              <div className="relative">
                                <img src={displayUrl} alt="Fundo 1" className="w-full h-24 object-cover rounded" />
                                {isVid && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                                    <Play className="w-8 h-8 text-white" fill="white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                      {data.conteudos[selectedElement.slideIndex]?.imagem_fundo2 &&
                        (() => {
                          const bgUrl = data.conteudos[selectedElement.slideIndex]?.imagem_fundo2!;
                          const isVid = isVideoUrl(bgUrl);
                          
                          // Filtra vídeos se o template não suporta
                          if (isVid && !canUseVideo) return null;
                          
                          // Filtra mídias inválidas
                          if (!validUrls.has(bgUrl)) return null;
                          
                          const currentBg = getEditedValue(
                            selectedElement.slideIndex,
                            'background',
                            data.conteudos[selectedElement.slideIndex]?.imagem_fundo
                          );
                          return (
                            <div
                              className={`bg-white border rounded p-2 cursor-pointer transition-all ${
                                currentBg === bgUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                              }`}
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, bgUrl)}
                            >
                              <div className="text-gray-700 text-xs mb-1">{isVid ? 'Video 2' : 'Image 2'}</div>
                              <img src={bgUrl} alt="Fundo 2" className="w-full h-24 object-cover rounded" />
                            </div>
                          );
                        })()}

                      {data.conteudos[selectedElement.slideIndex]?.imagem_fundo3 &&
                        (() => {
                          const bgUrl = data.conteudos[selectedElement.slideIndex]?.imagem_fundo3!;
                          const isVid = isVideoUrl(bgUrl);
                          
                          // Filtra vídeos se o template não suporta
                          if (isVid && !canUseVideo) return null;
                          
                          // Filtra mídias inválidas
                          if (!validUrls.has(bgUrl)) return null;
                          
                          const currentBg = getEditedValue(
                            selectedElement.slideIndex,
                            'background',
                            data.conteudos[selectedElement.slideIndex]?.imagem_fundo
                          );
                          return (
                            <div
                              className={`bg-white border rounded p-2 cursor-pointer transition-all ${
                                currentBg === bgUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                              }`}
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, bgUrl)}
                            >
                              <div className="text-gray-700 text-xs mb-1">{isVid ? 'Video 3' : 'Image 3'}</div>
                              <img src={bgUrl} alt="Fundo 3" className="w-full h-24 object-cover rounded" />
                            </div>
                          );
                        })()}

                      {uploadedImages[selectedElement.slideIndex] &&
                        (() => {
                          const bgUrl = uploadedImages[selectedElement.slideIndex];
                          const isVid = isVideoUrl(bgUrl);
                          
                          // Filtra vídeos se o template não suporta
                          if (isVid && !canUseVideo) return null;
                          
                          // Filtra mídias inválidas
                          if (!validUrls.has(bgUrl)) return null;
                          
                          const currentBg = getEditedValue(
                            selectedElement.slideIndex,
                            'background',
                            data.conteudos[selectedElement.slideIndex]?.imagem_fundo
                          );
                          return (
                            <div
                              className={`bg-white border rounded p-2 cursor-pointer transition-all ${
                                currentBg === bgUrl ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'
                              }`}
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, bgUrl)}
                            >
                              <div className="text-gray-700 text-xs mb-1">Image 4 (Uploaded)</div>
                              <img src={bgUrl} alt="Fundo 4 (Enviado)" className="w-full h-24 object-cover rounded" />
                            </div>
                          );
                        })()}
                    </div>

                    <div className="mt-3">
                      <label className="text-gray-600 text-xs mb-2 block font-medium">Search Images</label>
                      <style>
                        {`
                          @keyframes pulse-ring {
                            0% {
                              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                            }
                            50% {
                              box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
                            }
                            100% {
                              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
                            }
                          }
                          .search-input-pulsing {
                            animation: pulse-ring 1.5s ease-out infinite;
                            border-color: #3b82f6 !important;
                          }
                        `}
                      </style>
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          type="text"
                          className={`w-full bg-white border border-gray-300 rounded pl-10 pr-20 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isSearchInputPulsing ? 'search-input-pulsing' : ''}`}
                          placeholder="Search for images..."
                          value={searchKeyword}
                          onChange={(e) => onSearchKeywordChange(e.target.value)}
                          onClick={onSearchInputClick}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSearchImages();
                          }}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <button
                          onClick={onSearchImages}
                          disabled={isSearching || !searchKeyword.trim()}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          {isSearching ? 'Searching...' : 'Search'}
                        </button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((url, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-gray-300 hover:border-blue-400 rounded p-2 cursor-pointer transition-all"
                              onClick={() => onBackgroundImageChange(selectedElement.slideIndex, url)}
                            >
                              <img src={url} alt={`Search result ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="text-gray-600 text-xs mb-2 block font-medium">Upload Image</label>
                      <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-500 mb-2" />
                          <p className="text-xs text-gray-600">Click to upload</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG or GIF</p>
                        </div>
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
              </>
            )}

            {selectedElement.element === 'avatar' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-blue-500" />
                  <h4 className="text-gray-900 font-medium">Avatar</h4>
                </div>
                
                <p className="text-gray-600 text-xs mb-4">
                  O avatar é replicado em todos os slides automaticamente.
                </p>

                {/* Avatar atual */}
                <div className="mb-4">
                  <label className="text-gray-600 text-xs mb-2 block font-medium">Avatar Atual</label>
                  <div className="bg-white border border-gray-300 rounded p-3 flex items-center justify-center">
                    {data.dados_gerais?.avatar_url ? (
                      <img 
                        src={data.dados_gerais.avatar_url} 
                        alt="Avatar atual" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!data.dados_gerais?.avatar_url && (
                    <p className="text-gray-500 text-xs mt-2 text-center">Nenhum avatar definido</p>
                  )}
                </div>

                {/* Upload de novo avatar */}
                <div>
                  <label className="text-gray-600 text-xs mb-2 block font-medium">Trocar Avatar</label>
                  <label className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-xs text-gray-600">Click to upload new avatar</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG (square recommended)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => onAvatarUpload?.(e)}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
