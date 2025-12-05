import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ZoomIn, ZoomOut, CircleSlash, PanelsTopLeft, ChevronRight, ChevronLeft, BookOpen, Briefcase, GraduationCap, Package, MessageSquare, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateConfig, AVAILABLE_TEMPLATES, TEMPLATE_DIMENSIONS } from "../../types/carousel";
import { templateService, templateRenderer } from "../../services/carousel";
import { TEMPLATE_PREVIEW_DATA } from "../../data/templatePreviews";

// ==================== Generation Options Types ====================
export type ContentType = 'historias' | 'cases' | 'educacional' | 'produto';
export type ScreenCount = 5 | 10 | 15;
export type DescriptionLength = 'curta' | 'longa';
export type CarouselDimension = '1080x1350' | '1170x1560';
export type CTAType = 'comentar' | 'link_bio';
export type CTAIntention = 'produto' | 'enviar_material';

export interface GenerationOptions {
  templateId: string;
  contentType: ContentType;
  screenCount: ScreenCount;
  descriptionLength: DescriptionLength;
  dimension: CarouselDimension;
  hasCTA: boolean;
  ctaType?: CTAType;
  ctaIntention?: CTAIntention;
}

type GenerationStep = 'template' | 'content-type' | 'characteristics' | 'cta';

interface UserData {
  name: string;
  instagram: string;
  logo_url: string;
}

// Função para obter dados do usuário do localStorage
const getUserData = (): UserData | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return {
      name: user.name || 'Nome do Usuário',
      instagram: user.instagram || '@usuario',
      logo_url: user.logo_url || 'https://via.placeholder.com/150'
    };
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
};

// Função para mesclar dados do usuário com dados do preview do template
const mergeUserDataWithPreview = (previewData: any, userData: UserData | null) => {
  if (!userData) return previewData;
  
  const merged = { ...previewData };
  
  // Substitui os dados gerais do template pelos dados do usuário
  if (merged.dados_gerais) {
    merged.dados_gerais = {
      ...merged.dados_gerais,
      nome: userData.name,
      arroba: userData.instagram,
      foto_perfil: userData.logo_url
    };
  }
  
  return merged;
};

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string, options?: GenerationOptions) => void;
  postCode: string;
  brand?: {
    bg?: string;
    card?: string;
    border?: string;
    text?: string;
    muted?: string;
    hover?: string;
    accent?: string;
  };
}

/** Preto & branco - paleta não mais usada diretamente */

const SLIDE_W = 1085;
const SLIDE_H = 1354;
const GAP_X = 60; // Aumentado para melhor espaçamento

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.05;

const MODAL_MAX_W_PX = 1200;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round2 = (v: number) => Number(v.toFixed(2));

// Retorna as dimensões do template (usa padrão ou específico do template)
const getTemplateDimensions = (templateId: string): { width: number; height: number } => {
  return TEMPLATE_DIMENSIONS[templateId] || { width: SLIDE_W, height: SLIDE_H };
};

function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
  compact = false,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  compact?: boolean;
}) {
  const btnCls =
    "p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors pointer-events-auto";
  return (
    <div className={`flex items-center gap-2 mr-2 ${compact ? "" : "mr-2"}`}>
      <button onClick={onZoomOut} className={btnCls} aria-label="Diminuir zoom">
        <ZoomOut className="w-4 h-4 text-gray-700" />
      </button>
      <span className="text-xs font-medium tabular-nums w-12 text-center select-none text-gray-700">
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomIn} className={btnCls} aria-label="Aumentar zoom">
        <ZoomIn className="w-4 h-4 text-gray-700 mr-[20px]" />
      </button>
    </div>
  );
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  postCode,
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<GenerationStep>('template');
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(
    AVAILABLE_TEMPLATES[0]
  );
  const [slidesHtml, setSlidesHtml] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Generation options state
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [screenCount, setScreenCount] = useState<ScreenCount>(10);
  const [descriptionLength, setDescriptionLength] = useState<DescriptionLength>('curta');
  const [dimension, setDimension] = useState<CarouselDimension>('1080x1350');
  const [hasCTA, setHasCTA] = useState<boolean | null>(null);
  const [ctaType, setCtaType] = useState<CTAType | null>(null);
  const [ctaIntention, setCtaIntention] = useState<CTAIntention | null>(null);

  // Canvas state
  const [zoom, setZoom] = useState(0.30); // 30% de zoom inicial
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true); // Para centralizar na primeira vez

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const modalRootRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const dragState = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number }>({
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setCurrentStep('template');
      setContentType(null);
      setScreenCount(10);
      setDescriptionLength('curta');
      setDimension('1080x1350');
      setHasCTA(null);
      setCtaType(null);
      setCtaIntention(null);
      setIsInitialMount(true);
    }
  }, [isOpen]);

  // Step navigation helpers
  const getStepTitle = () => {
    switch (currentStep) {
      case 'template': return 'Selecionar Template';
      case 'content-type': return 'Tipo de Conteúdo';
      case 'characteristics': return 'Características do Carrossel';
      case 'cta': return 'Configurar CTA';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'template': return 1;
      case 'content-type': return 2;
      case 'characteristics': return 3;
      case 'cta': return 4;
    }
  };

  const getTotalSteps = () => hasCTA === false ? 3 : 4;

  const canAdvance = () => {
    switch (currentStep) {
      case 'template': return true;
      case 'content-type': return contentType !== null;
      case 'characteristics': return hasCTA !== null;
      case 'cta': return ctaType !== null && ctaIntention !== null;
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'template':
        setCurrentStep('content-type');
        break;
      case 'content-type':
        setCurrentStep('characteristics');
        break;
      case 'characteristics':
        if (hasCTA === false) {
          // Generate immediately
          handleGenerate();
        } else {
          setCurrentStep('cta');
        }
        break;
      case 'cta':
        handleGenerate();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'content-type':
        setCurrentStep('template');
        break;
      case 'characteristics':
        setCurrentStep('content-type');
        break;
      case 'cta':
        setCurrentStep('characteristics');
        break;
    }
  };

  // Portal root
  useEffect(() => {
    let existing = document.getElementById("modal-root");
    if (!existing) {
      const el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
      existing = el;
    }
    modalRootRef.current = existing as HTMLElement;
  }, []);

  // Pré-carrega todos os templates em background quando o modal abre
  useEffect(() => {
    if (!isOpen) return;
    
    // Pré-carrega templates em background (sem bloquear a UI)
    const templateIds = AVAILABLE_TEMPLATES.map(t => t.id).filter(id => id !== selectedTemplate.id);
    templateService.preloadTemplates(templateIds).catch(err => {
      console.error('Error preloading templates:', err);
    });
  }, [isOpen, selectedTemplate.id]);

  // Fetch slides com dados de preview
  useEffect(() => {
    if (!isOpen || !selectedTemplate) return;
    let cancelled = false;
    (async () => {
      setIsLoadingPreview(true);
      try {
        // Busca os slides do template
        const slides = await templateService.fetchTemplate(selectedTemplate.id);
        
        if (!cancelled && Array.isArray(slides)) {
          // Verifica se existe dados de preview para este template
          const previewData = TEMPLATE_PREVIEW_DATA[selectedTemplate.id];
          
          if (previewData) {
            // Mescla dados do usuário com dados do template
            const userData = getUserData();
            const mergedPreviewData = mergeUserDataWithPreview(previewData, userData);
            
            // Renderiza os slides com os dados mesclados
            const renderedSlides = templateRenderer.renderAllSlides(slides, mergedPreviewData);
            setSlidesHtml(renderedSlides);
          } else {
            // Se não houver dados de preview, usa os slides vazios
            setSlidesHtml(slides);
          }
        } else if (!cancelled) {
          setSlidesHtml([]);
        }
      } catch (error) {
        console.error('Erro ao carregar preview do template:', error);
        if (!cancelled) setSlidesHtml([]);
      } finally {
        if (!cancelled) setIsLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedTemplate]);

  // ESC + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev || "";
    };
  }, [isOpen, onClose]);

  // Focus + trap
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      (firstFocusableRef.current || closeBtnRef.current)?.focus();
    }, 40);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const c = containerRef.current;
      if (!c) return;
      const focusables = c.querySelectorAll<HTMLElement>(
        'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isOpen]);

  // Bounds pan
  const getContentDims = useCallback(() => {
    const count = Math.max(1, slidesHtml.length);
    const dims = getTemplateDimensions(selectedTemplate.id);
    const contentW = count * dims.width + Math.max(0, count - 1) * GAP_X;
    const contentH = dims.height;
    const scaledW = contentW * zoom;
    const scaledH = contentH * zoom;
    const vp = viewportRef.current;
    const vpW = vp ? vp.clientWidth : 0;
    const vpH = vp ? vp.clientHeight : 0;
    const minX = Math.min(0, vpW - scaledW);
    const minY = Math.min(0, vpH - scaledH);
    return { minX, minY };
  }, [slidesHtml.length, zoom, selectedTemplate.id]);

  const clampPan = useCallback((nx: number, ny: number) => {
    const { minX, minY } = getContentDims();
    return { x: clamp(nx, minX, 0), y: clamp(ny, minY, 0) };
  }, [getContentDims]);

  // Fit-to-height + pan(0,0)
  const fitToHeight = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const usable = vp.clientHeight;
    const dims = getTemplateDimensions(selectedTemplate.id);
    const newZoom = clamp(usable / dims.height, ZOOM_MIN, ZOOM_MAX);
    setZoom(round2(newZoom));
    setPan(clampPan(0, 0));
  }, [clampPan, selectedTemplate.id]);

  // Centraliza os slides no viewport
  const centerSlides = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    
    const count = Math.max(1, slidesHtml.length);
    const dims = getTemplateDimensions(selectedTemplate.id);
    const contentW = count * dims.width + Math.max(0, count - 1) * GAP_X;
    const contentH = dims.height;
    
    const scaledW = contentW * zoom;
    const scaledH = contentH * zoom;
    
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    
    const centerX = Math.max(0, (vpW - scaledW) / 2);
    const centerY = Math.max(0, (vpH - scaledH) / 2);
    
    const clamped = clampPan(centerX, centerY);
    setPan(clamped);
  }, [zoom, slidesHtml.length, clampPan, selectedTemplate.id]);

  // ResizeObserver para responsividade - não chama fitToHeight automaticamente
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => {
      setPan((p) => clampPan(p.x, p.y));
    });
    ro.observe(vp);
    roRef.current = ro;
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
  }, [clampPan]);

  // Revalida pan quando zoom / n° slides mudam
  useEffect(() => {
    setPan((p) => clampPan(p.x, p.y));
  }, [zoom, slidesHtml.length, clampPan]);

  // Centraliza os slides quando forem carregados pela primeira vez
  useEffect(() => {
    if (slidesHtml.length > 0 && isInitialMount) {
      const timer = setTimeout(() => {
        centerSlides();
        setIsInitialMount(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [slidesHtml.length, isInitialMount, centerSlides]);

  // Zoom helpers (com re-clamp imediato pra refletir visual)
  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const nz = round2(clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
      setPan((p) => clampPan(p.x, p.y));
      return nz;
    });
  }, [clampPan]);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const nz = round2(clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
      setPan((p) => clampPan(p.x, p.y));
      return nz;
    });
  }, [clampPan]);

  const resetZoom = useCallback(() => fitToHeight(), [fitToHeight]);

  // Pan (canvas)
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [pan.x, pan.y]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan(clampPan(dragState.current.startPanX + dx, dragState.current.startPanY + dy));
  }, [isDragging, clampPan]);

  const endPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
  }, []);

  // Wheel: Ctrl/Cmd => zoom; Shift => pan X; sem nada => pan Y e X (dois dedos)
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const dir = Math.sign(e.deltaY);
      setZoom((z) => {
        const nz = round2(clamp(z - dir * ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
        setPan((p) => clampPan(p.x, p.y));
        return nz;
      });
    } else if (e.shiftKey) {
      e.preventDefault();
      setPan((p) => clampPan(p.x - e.deltaY, p.y));
    } else {
      e.preventDefault();
      setPan((p) => clampPan(p.x - e.deltaX, p.y - e.deltaY));
    }
  }, [clampPan]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleGenerate = () => {
    const options: GenerationOptions = {
      templateId: selectedTemplate.id,
      contentType: contentType!,
      screenCount,
      descriptionLength,
      dimension,
      hasCTA: hasCTA!,
      ...(hasCTA && ctaType && { ctaType }),
      ...(hasCTA && ctaIntention && { ctaIntention }),
    };
    
    console.log('🎯 TemplateSelectionModal - handleGenerate called');
    console.log('🎯 Generation options:', options);
    console.log('🎯 Calling onSelectTemplate with:', selectedTemplate.id, options);
    
    onSelectTemplate(selectedTemplate.id, options);
    onClose();
  };

  // Content Type Options
  const contentTypeOptions: { value: ContentType; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'historias', label: 'Histórias', icon: <BookOpen className="w-6 h-6" />, description: 'Narrativas envolventes' },
    { value: 'cases', label: 'Cases', icon: <Briefcase className="w-6 h-6" />, description: 'Casos de sucesso' },
    { value: 'educacional', label: 'Educacional', icon: <GraduationCap className="w-6 h-6" />, description: 'Conteúdo informativo' },
    { value: 'produto', label: 'Produto', icon: <Package className="w-6 h-6" />, description: 'Divulgação de produtos' },
  ];

  // CTA Type Options
  const ctaTypeOptions: { value: CTAType; label: string; icon: React.ReactNode }[] = [
    { value: 'comentar', label: 'Comentar na publicação', icon: <MessageSquare className="w-5 h-5" /> },
    { value: 'link_bio', label: 'Clicar no link da bio', icon: <Link2 className="w-5 h-5" /> },
  ];

  // CTA Intention Options
  const ctaIntentionOptions: { value: CTAIntention; label: string }[] = [
    { value: 'produto', label: 'Produto' },
    { value: 'enviar_material', label: 'Enviar material' },
  ];

  if (!isOpen || !modalRootRef.current) return null;

  const count = Math.max(1, slidesHtml.length);
  const templateDimensions = getTemplateDimensions(selectedTemplate.id);
  const contentW = count * templateDimensions.width + Math.max(0, count - 1) * GAP_X;

  const modal = (
    <AnimatePresence>
      <motion.div
        key="template-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden={false}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
        onClick={handleBackdropClick}
        className="
          fixed inset-0 z-[10000]
          flex justify-center
          items-start md:items-center
          p-2 md:p-4
          bg-black/50
          overflow-y-auto
        "
      >
        <motion.div
          key="template-modal"
          id="template-modal"
          ref={containerRef}
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="
            bg-white text-gray-900 shadow-2xl rounded-2xl border border-gray-300
            relative w-full
            flex flex-col
            max-h-[calc(100vh-32px)]
            md:max-h-[calc(100vh-120px)]
            overflow-hidden
          "
          style={{
            maxWidth: `${MODAL_MAX_W_PX}px`,
            zIndex: 10001,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm relative z-20 pointer-events-auto">
            <div className="flex items-center gap-3">
              {currentStep !== 'template' && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {currentStep === 'template' && (
                <button
                  className="md:hidden p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
                  onClick={() => setShowSidebar((s) => !s)}
                  aria-label="Alternar lista de templates"
                >
                  <PanelsTopLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div>
                <h2 id="template-modal-title" className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">
                  {getStepTitle()}
                </h2>
                <p className="text-xs text-gray-500">
                  Etapa {getStepNumber()} de {getTotalSteps()}
                </p>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="relative h-[600px] overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Step 1: Template Selection */}
              {currentStep === 'template' && (
                <motion.div
                  key="step-template"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex flex-col md:grid md:grid-cols-[18rem,1fr]"
                >
                  {/* Mobile: Horizontal scroll template selector */}
                  <div className="md:hidden flex-shrink-0 bg-gray-50 border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 p-3 min-w-max">
                      {AVAILABLE_TEMPLATES.map((template, idx) => {
                        const isActive = selectedTemplate.id === template.id;
                        return (
                          <button
                            key={template.id}
                            ref={idx === 0 ? firstFocusableRef : undefined}
                            onClick={() => setSelectedTemplate(template)}
                            className={`
                              flex-shrink-0 w-32 p-3 rounded-xl border-2 transition-all text-left
                              ${isActive 
                                ? "bg-purple-50 border-purple-500 shadow-lg shadow-purple-100" 
                                : "bg-white border-gray-200 active:scale-95"
                              }
                            `}
                          >
                            <h3 className={`font-semibold text-xs truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
                              {template.name}
                            </h3>
                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">
                              {template.description}
                            </p>
                            <span className={`mt-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[8px] font-medium ${
                              isActive ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {template.compatibilityLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop: Sidebar */}
                  <aside
                    className={`
                      hidden md:block
                      ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                      transition-transform duration-200 ease-out
                      bg-gray-50 border-r border-gray-200
                      overflow-y-auto
                      pointer-events-auto
                      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300
                    `}
                  >
                    <div className="p-3 md:p-4 space-y-2">
                      {AVAILABLE_TEMPLATES.map((template, idx) => {
                        const isActive = selectedTemplate.id === template.id;
                        return (
                          <button
                            key={template.id}
                            ref={idx === 0 ? firstFocusableRef : undefined}
                            onClick={() => setSelectedTemplate(template)}
                            className={`group w-full text-left rounded-lg border transition-all focus:outline-none focus:ring-2 ring-blue-500/30 ${
                              isActive 
                                ? "bg-blue-50 border-blue-400 shadow-md shadow-blue-100" 
                                : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium text-sm truncate text-gray-900">{template.name}</h3>
                                  {isActive && (
                                    <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-blue-600 text-white">
                                      ATIVO
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {template.description}
                                </p>
                                <div className="mt-2">
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                                    template.compatibility === 'video-image' 
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                      : template.compatibility === 'text-only'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    {template.compatibilityLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  {/* Canvas - ocupa espaço restante */}
                  <section className="flex-1 relative bg-gray-100 overflow-hidden min-h-[300px] md:min-h-0">
                    {/* BG grid pattern */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:20px_20px]" />
                    </div>

                    {/* Viewport */}
                    <div
                      ref={viewportRef}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={endPointer}
                      onPointerCancel={endPointer}
                      onWheel={onWheel}
                      className={`${isDragging ? "cursor-grabbing" : "cursor-grab"} absolute inset-0 z-10`}
                      style={{ touchAction: "none", overflow: "hidden", pointerEvents: "auto" }}
                    >
                      {isLoadingPreview && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700 z-20 pointer-events-none">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="text-sm font-medium">Carregando slides…</p>
                          </div>
                        </div>
                      )}

                      <div
                        className="absolute top-0 left-0"
                        style={{
                          transform: `translate(${pan.x}px, ${pan.y}px)`,
                          transformOrigin: "top left",
                          willChange: "transform",
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "top left",
                            willChange: "transform",
                          }}
                        >
                          {slidesHtml.length > 0 ? (
                            <div
                              className="flex"
                              style={{
                                gap: GAP_X,
                                height: getTemplateDimensions(selectedTemplate.id).height,
                                width: contentW,
                                marginTop: "34px",
                                marginLeft: "60px",
                                marginRight: "100px",
                              }}
                            >
                              {slidesHtml.map((html, idx) => {
                                const { width, height } = getTemplateDimensions(selectedTemplate.id);
                                return (
                                  <div
                                    key={idx}
                                    className="relative shadow-lg rounded-lg overflow-hidden bg-white border border-gray-300"
                                    style={{ width, height, zIndex: 10000001 }}
                                  >
                                    <iframe
                                      title={`Slide ${idx + 1}`}
                                      srcDoc={html}
                                      className="w-full h-full pointer-events-none"
                                      sandbox="allow-scripts"
                                      style={{ zIndex: 10000002 }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            !isLoadingPreview && (
                              <div
                                className="flex items-center justify-center text-gray-600"
                                style={{ width: SLIDE_W, height: SLIDE_H }}
                              >
                                <div className="text-center">
                                  <p className="text-sm font-medium">Preview não disponível</p>
                                  <p className="text-xs mt-1 text-gray-500">Selecione um template para visualizar</p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {/* Step 2: Content Type Selection */}
              {currentStep === 'content-type' && (
                <motion.div
                  key="step-content-type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6"
                >
                  <div className="w-full max-w-2xl">
                    <p className="text-center text-gray-600 mb-8">
                      Selecione o tipo de conteúdo para seu carrossel
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {contentTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setContentType(option.value)}
                          className={`
                            flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all
                            ${contentType === option.value
                              ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-100'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                            }
                          `}
                        >
                          <div className={`
                            p-3 rounded-full
                            ${contentType === option.value ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {option.icon}
                          </div>
                          <div className="text-center">
                            <h3 className={`font-semibold ${contentType === option.value ? 'text-purple-700' : 'text-gray-900'}`}>
                              {option.label}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Carousel Characteristics */}
              {currentStep === 'characteristics' && (
                <motion.div
                  key="step-characteristics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto"
                >
                  <div className="w-full max-w-2xl space-y-6">
                    {/* Screen Count */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Quantidade de telas</h3>
                      <div className="flex gap-3">
                        {([5, 10, 15] as ScreenCount[]).map((count) => (
                          <button
                            key={count}
                            onClick={() => setScreenCount(count)}
                            className={`
                              flex-1 py-3 px-4 rounded-lg font-medium transition-all
                              ${screenCount === count
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description Length */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Descrição</h3>
                      <div className="flex gap-3">
                        {(['curta', 'longa'] as DescriptionLength[]).map((length) => (
                          <button
                            key={length}
                            onClick={() => setDescriptionLength(length)}
                            className={`
                              flex-1 py-3 px-4 rounded-lg font-medium capitalize transition-all
                              ${descriptionLength === length
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {length}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dimension */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Dimensão do carrossel</h3>
                      <div className="flex gap-3">
                        {(['1080x1350', '1170x1560'] as CarouselDimension[]).map((dim) => (
                          <button
                            key={dim}
                            onClick={() => setDimension(dim)}
                            className={`
                              flex-1 py-3 px-4 rounded-lg font-medium transition-all
                              ${dimension === dim
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {dim}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">CTA (Call to Action)</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setHasCTA(true)}
                          className={`
                            flex-1 py-3 px-4 rounded-lg font-medium transition-all
                            ${hasCTA === true
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setHasCTA(false)}
                          className={`
                            flex-1 py-3 px-4 rounded-lg font-medium transition-all
                            ${hasCTA === false
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: CTA Configuration */}
              {currentStep === 'cta' && (
                <motion.div
                  key="step-cta"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6"
                >
                  <div className="w-full max-w-2xl space-y-6">
                    {/* CTA Type */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Tipo de CTA</h3>
                      <div className="space-y-3">
                        {ctaTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setCtaType(option.value)}
                            className={`
                              w-full flex items-center gap-3 py-4 px-5 rounded-lg border-2 transition-all text-left
                              ${ctaType === option.value
                                ? 'border-purple-500 bg-purple-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }
                            `}
                          >
                            <div className={`
                              p-2 rounded-full
                              ${ctaType === option.value ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}
                            `}>
                              {option.icon}
                            </div>
                            <span className={`font-medium ${ctaType === option.value ? 'text-purple-700' : 'text-gray-900'}`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA Intention */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Intenção final</h3>
                      <div className="flex gap-3">
                        {ctaIntentionOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setCtaIntention(option.value)}
                            className={`
                              flex-1 py-3 px-4 rounded-lg font-medium transition-all
                              ${ctaIntention === option.value
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].slice(0, getTotalSteps()).map((step) => (
                  <div
                    key={step}
                    className={`
                      w-2 h-2 rounded-full transition-all
                      ${step === getStepNumber()
                        ? 'w-6 bg-purple-600'
                        : step < getStepNumber()
                        ? 'bg-purple-400'
                        : 'bg-gray-300'
                      }
                    `}
                  />
                ))}
              </div>

              {/* Action button */}
              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className={`
                  inline-flex items-center justify-center gap-2 font-semibold text-sm md:text-base py-3 px-6 rounded-lg shadow-md transition-all
                  ${canAdvance()
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
                  focus:outline-none focus:ring-2 ring-purple-500/50
                `}
              >
                <span>
                  {currentStep === 'characteristics' && hasCTA === false
                    ? 'Gerar Carrossel'
                    : currentStep === 'cta'
                    ? 'Gerar Carrossel'
                    : 'Avançar'
                  }
                </span>
                {currentStep !== 'cta' && hasCTA !== false && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, modalRootRef.current);
};

export default TemplateSelectionModal;