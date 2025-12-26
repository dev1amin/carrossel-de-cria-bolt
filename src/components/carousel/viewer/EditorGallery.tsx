/**
 * EditorGallery - Componente de galeria de imagens do business para o editor
 * Permite upload, visualização e seleção de imagens para usar nos slides
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Images,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ImagePlus,
  RefreshCw,
  Search,
  Grid3X3,
  List,
} from 'lucide-react';
import {
  uploadBusinessImage,
  listBusinessImages,
  deleteBusinessImages,
  validateImageFile,
  formatFileSize,
} from '../../../services/businessImages';
import type { BusinessImage } from '../../../types/business';

// Cache global para evitar recarregar a galeria toda vez
interface GalleryCache {
  images: BusinessImage[];
  timestamp: number;
}
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
let galleryCache: GalleryCache | null = null;

interface EditorGalleryProps {
  /** Chamado quando uma imagem é selecionada da galeria */
  onSelectImage: (imageUrl: string) => void;
  /** Largura máxima do componente */
  maxWidth?: string;
  /** Se deve mostrar em modo compacto */
  compact?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date' | 'name' | 'size';

export const EditorGallery: React.FC<EditorGalleryProps> = ({
  onSelectImage,
  maxWidth = '100%',
  compact: _compact = false,
}) => {
  // Estado
  const [images, setImages] = useState<BusinessImage[]>(galleryCache?.images || []);
  const [isLoading, setIsLoading] = useState(!galleryCache);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, _setSortBy] = useState<SortBy>('date');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Carrega imagens ao montar (com cache)
  const loadImages = useCallback(async (forceRefresh = false) => {
    // Usa cache se disponível e não expirado
    if (!forceRefresh && galleryCache && (Date.now() - galleryCache.timestamp) < CACHE_DURATION) {
      console.log('📦 Usando cache da galeria');
      setImages(galleryCache.images);
      setIsLoading(false);
      return;
    }
    
    console.log('🔄 Carregando galeria da API');
    try {
      setIsLoading(true);
      setError(null);
      const response = await listBusinessImages(100);
      setImages(response.images);
      // Atualiza o cache
      galleryCache = {
        images: response.images,
        timestamp: Date.now(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar imagens';
      setError(message);
      console.error('Erro ao carregar galeria:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Atualiza o cache quando imagens mudam (após upload ou delete)
  const updateCache = useCallback((newImages: BusinessImage[]) => {
    setImages(newImages);
    galleryCache = {
      images: newImages,
      timestamp: Date.now(),
    };
  }, []);

  // Upload de imagem
  const handleUpload = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simula progresso (já que fetch não suporta progress nativamente)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadBusinessImage({
        file,
        label: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Adiciona a nova imagem no início da lista e atualiza o cache
      const newImage: BusinessImage = {
        id: result.id,
        url: result.url,
        label: file.name.replace(/\.[^/.]+$/, ''),
        alt_text: null,
        mime_type: file.type,
        bytes: file.size,
        width: null,
        height: null,
        created_at: result.created_at,
      };
      updateCache([newImage, ...images]);

      console.log('✅ Imagem carregada e cache atualizado');

      // Reset após sucesso
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [images, updateCache]);

  // Handler do input de arquivo
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, [handleUpload]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  }, [handleUpload]);

  // Deleção de imagens
  const handleDelete = useCallback(async () => {
    if (selectedForDelete.size === 0) return;

    try {
      setIsDeleting(true);
      setError(null);

      const result = await deleteBusinessImages(Array.from(selectedForDelete));

      if (result.deleted_count > 0) {
        // Remove imagens deletadas da lista e atualiza o cache
        const newImages = images.filter(img => !selectedForDelete.has(img.id));
        updateCache(newImages);
        setSelectedForDelete(new Set());
      }

      if (result.failed.length > 0) {
        setError(`${result.failed.length} imagem(ns) não puderam ser deletadas`);
      }

      setShowDeleteConfirm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar imagens';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedForDelete, images, updateCache]);

  // Toggle seleção para delete
  const toggleSelectForDelete = useCallback((imageId: string) => {
    setSelectedForDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  // Filtra e ordena imagens
  const filteredImages = React.useMemo(() => {
    let result = [...images];

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(img => 
        img.label?.toLowerCase().includes(query) ||
        img.alt_text?.toLowerCase().includes(query)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
          return (a.label || '').localeCompare(b.label || '');
        case 'size':
          return b.bytes - a.bytes;
        default:
          return 0;
      }
    });

    return result;
  }, [images, searchQuery, sortBy]);

  // Render da área de upload
  const renderUploadArea = () => (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
        ${dragOver 
          ? 'border-blue-DEFAULT bg-blue-light/20' 
          : 'border-gray-light hover:border-blue-light hover:bg-gray-light/30'
        }
        ${isUploading ? 'pointer-events-none' : ''}
      `}
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
      />

      {isUploading ? (
        <div className="py-2">
          <Loader2 className="w-6 h-6 text-blue-DEFAULT animate-spin mx-auto mb-2" />
          <div className="w-full bg-gray-light rounded-full h-1.5 mb-2">
            <div 
              className="bg-blue-DEFAULT h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-DEFAULT">Fazendo upload...</p>
        </div>
      ) : (
        <>
          <ImagePlus className="w-6 h-6 text-gray-DEFAULT mx-auto mb-2" />
          <p className="text-xs text-gray-DEFAULT">
            {dragOver ? 'Solte a imagem aqui' : 'Arraste ou clique para upload'}
          </p>
          <p className="text-[10px] text-gray-DEFAULT mt-1">
            JPEG, PNG, GIF, WebP • Máx. 10MB
          </p>
        </>
      )}
    </div>
  );

  // Render de erro
  const renderError = () => error && (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 mb-3">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      <button onClick={() => setError(null)} className="p-0.5 hover:bg-red-100 rounded">
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  // Render da toolbar
  const renderToolbar = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-DEFAULT" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-32 pl-7 pr-2 py-1 text-xs border border-gray-light rounded focus:outline-none focus:ring-1 focus:ring-blue-DEFAULT"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* View mode toggle */}
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'grid' ? 'bg-gray-light text-gray-dark' : 'text-gray-DEFAULT hover:bg-gray-light/50'
          }`}
          title="Visualização em grade"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'list' ? 'bg-gray-light text-gray-dark' : 'text-gray-DEFAULT hover:bg-gray-light/50'
          }`}
          title="Visualização em lista"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Refresh - força recarregar do servidor */}
        <button
          onClick={() => loadImages(true)}
          disabled={isLoading}
          className="p-1.5 text-gray-DEFAULT hover:bg-gray-light/50 rounded transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Delete selected */}
        {selectedForDelete.size > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title={`Deletar ${selectedForDelete.size} selecionada(s)`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  // Render da grade de imagens
  const renderImageGrid = () => {
    if (isLoading && images.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-DEFAULT animate-spin" />
        </div>
      );
    }

    if (filteredImages.length === 0) {
      return (
        <div className="text-center py-6">
          <Images className="w-8 h-8 text-gray-light mx-auto mb-2" />
          <p className="text-xs text-gray-DEFAULT">
            {searchQuery ? 'Nenhuma imagem encontrada' : 'Nenhuma imagem na galeria'}
          </p>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`
                flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer group
                ${selectedForDelete.has(image.id)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-light hover:border-blue-light hover:bg-blue-light/5'
                }
              `}
            >
              {/* Checkbox para delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectForDelete(image.id);
                }}
                className={`
                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                  ${selectedForDelete.has(image.id)
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-gray-light group-hover:border-gray-DEFAULT'
                  }
                `}
              >
                {selectedForDelete.has(image.id) && <Check className="w-3 h-3" />}
              </button>

              {/* Thumbnail */}
              <img
                src={image.url}
                alt={image.alt_text || image.label || 'Imagem'}
                className="w-10 h-10 object-cover rounded"
                onClick={() => onSelectImage(image.url)}
              />

              {/* Info */}
              <div 
                className="flex-1 min-w-0"
                onClick={() => onSelectImage(image.url)}
              >
                <p className="text-xs font-medium text-gray-dark truncate">
                  {image.label || 'Sem nome'}
                </p>
                <p className="text-[10px] text-gray-DEFAULT">
                  {formatFileSize(image.bytes)}
                  {image.width && image.height && ` • ${image.width}×${image.height}`}
                </p>
              </div>

              {/* Use button */}
              <button
                onClick={() => onSelectImage(image.url)}
                className="px-2 py-1 text-[10px] font-medium text-blue-DEFAULT hover:bg-blue-light/20 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                Usar
              </button>
            </div>
          ))}
        </div>
      );
    }

    // Grid view
    return (
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={`
              relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer group
              ${selectedForDelete.has(image.id)
                ? 'ring-2 ring-red-500 ring-offset-1'
                : 'hover:ring-2 hover:ring-blue-DEFAULT hover:ring-offset-1'
              }
            `}
            onClick={() => onSelectImage(image.url)}
          >
            <img
              src={image.url}
              alt={image.alt_text || image.label || 'Imagem'}
              className="w-full h-full object-cover"
            />

            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button
                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-white text-gray-dark text-[10px] font-medium rounded shadow transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectImage(image.url);
                }}
              >
                Usar
              </button>
            </div>

            {/* Checkbox para delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectForDelete(image.id);
              }}
              className={`
                absolute top-1 left-1 w-5 h-5 rounded border flex items-center justify-center transition-all
                ${selectedForDelete.has(image.id)
                  ? 'bg-red-500 border-red-500 text-white opacity-100'
                  : 'bg-white/80 border-gray-light opacity-0 group-hover:opacity-100'
                }
              `}
            >
              {selectedForDelete.has(image.id) && <Check className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Modal de confirmação de delete
  const renderDeleteConfirm = () => showDeleteConfirm && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 max-w-sm mx-4 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-dark mb-2">
          Deletar {selectedForDelete.size} imagem(ns)?
        </h3>
        <p className="text-xs text-gray-DEFAULT mb-4">
          Esta ação não pode ser desfeita. As imagens serão removidas permanentemente.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="px-3 py-1.5 text-xs font-medium text-gray-DEFAULT hover:bg-gray-light rounded transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
            Deletar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth }} className="space-y-3">
      {/* Error */}
      {renderError()}

      {/* Upload area */}
      {renderUploadArea()}

      {/* Toolbar */}
      {images.length > 0 && renderToolbar()}

      {/* Image grid/list */}
      {renderImageGrid()}

      {/* Delete confirmation modal */}
      {renderDeleteConfirm()}
    </div>
  );
};

export default EditorGallery;
