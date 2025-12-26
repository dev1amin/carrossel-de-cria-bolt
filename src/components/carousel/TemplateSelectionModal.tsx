import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { X, Loader2, ZoomIn, ZoomOut, CircleSlash, PanelsTopLeft, ChevronRight, ChevronLeft, BookOpen, Briefcase, GraduationCap, Package, MessageSquare, Link2, Smartphone, Monitor, Instagram, Trash2, Newspaper, Image, FileText, Sparkles, Check, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateConfig, AVAILABLE_TEMPLATES, TEMPLATE_DIMENSIONS } from "../../types/carousel";
import { templateService, templateRenderer } from "../../services/carousel";
import { TEMPLATE_PREVIEW_DATA } from "../../data/templatePreviews";
import { ReactSlideRenderer } from "../../templates/react";

// ==================== Source Item Types ====================
export interface SourceItem {
  type: 'post' | 'news' | 'instagram' | 'website';
  id: string;
  code?: string; // Código do Instagram ou URL
  title?: string;
  thumbnail?: string;
  postId?: number;
  newsData?: any;
}

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
  context?: string; // Contexto/brisa do usuário para o carrossel
  multipleLinks?: string[]; // Links adicionais para gerar carrossel com múltiplos itens
  multifont?: boolean; // Indica geração com múltiplas fontes (envia cada link separadamente)
}

type GenerationStep = 'sources' | 'template' | 'context' | 'content-type' | 'characteristics' | 'cta';

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
  multipleLinks?: string[]; // Links adicionais para gerar carrossel com múltiplos itens
  initialSource?: SourceItem; // Fonte inicial (post ou notícia selecionada)
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
  multipleLinks = [],
  initialSource,
}) => {
  // Step management - se tem initialSource, começa em sources
  const [currentStep, setCurrentStep] = useState<GenerationStep>(initialSource ? 'sources' : 'template');
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(
    AVAILABLE_TEMPLATES[0]
  );
  const [slidesHtml, setSlidesHtml] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Dados brutos do preview (para templates React)
  const [previewRawData, setPreviewRawData] = useState<{
    conteudos: any[];
    dados_gerais: any;
  } | null>(null);

  // Generation options state
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [screenCount, setScreenCount] = useState<ScreenCount>(10);
  const [descriptionLength, setDescriptionLength] = useState<DescriptionLength>('curta');
  const [dimension, setDimension] = useState<CarouselDimension>('1080x1350');
  const [hasCTA, setHasCTA] = useState<boolean | null>(null);
  const [ctaType, setCtaType] = useState<CTAType | null>(null);
  const [ctaIntention, setCtaIntention] = useState<CTAIntention | null>(null);
  const [wantsContext, setWantsContext] = useState<boolean | null>(null); // Pergunta se quer adicionar contexto
  const [context, setContext] = useState<string>(''); // Contexto/brisa do carrossel

  // Sources state (multi-fonte)
  const [sources, setSources] = useState<SourceItem[]>(initialSource ? [initialSource] : []);
  const [linkInput, setLinkInput] = useState('');
  const [addingType, setAddingType] = useState<'instagram' | 'website' | null>(null);

  // Limites de fontes
  const MAX_INSTAGRAM_SOURCES = 2;
  const MAX_WEBSITE_SOURCES = 5;
  
  // Verifica se o template selecionado é React
  const isReactTemplate = useMemo(() => {
    return templateService.isReactTemplate(selectedTemplate.id);
  }, [selectedTemplate.id]);

  // Contadores de fontes por tipo
  const instagramSourcesCount = sources.filter(s => s.type === 'instagram').length;
  const websiteSourcesCount = sources.filter(s => s.type === 'website').length;

  // Helpers para sources
  const extractInstagramCode = (url: string): string | null => {
    try {
      const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  };

  const handleAddSource = (type: 'instagram' | 'website') => {
    // Verificar limites antes de permitir adicionar
    if (type === 'instagram' && instagramSourcesCount >= MAX_INSTAGRAM_SOURCES) {
      alert(`Limite atingido! Você pode adicionar no máximo ${MAX_INSTAGRAM_SOURCES} posts do Instagram.`);
      return;
    }
    if (type === 'website' && websiteSourcesCount >= MAX_WEBSITE_SOURCES) {
      alert(`Limite atingido! Você pode adicionar no máximo ${MAX_WEBSITE_SOURCES} links.`);
      return;
    }
    setAddingType(type);
    setLinkInput('');
  };

  const handleConfirmLink = () => {
    if (!linkInput.trim()) return;

    if (addingType === 'instagram') {
      // Verificar limite novamente
      if (instagramSourcesCount >= MAX_INSTAGRAM_SOURCES) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_INSTAGRAM_SOURCES} posts do Instagram.`);
        setAddingType(null);
        return;
      }
      const code = extractInstagramCode(linkInput);
      if (!code) {
        alert('Link do Instagram inválido. Use um link como: https://www.instagram.com/p/CODE/');
        return;
      }
      setSources(prev => [...prev, {
        type: 'instagram',
        id: `instagram-${code}-${Date.now()}`,
        code,
        title: `Post Instagram: ${code}`,
      }]);
    } else if (addingType === 'website') {
      // Verificar limite novamente
      if (websiteSourcesCount >= MAX_WEBSITE_SOURCES) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_WEBSITE_SOURCES} links.`);
        setAddingType(null);
        return;
      }
      setSources(prev => [...prev, {
        type: 'website',
        id: `website-${Date.now()}`,
        code: linkInput.trim(),
        title: linkInput.trim().substring(0, 50) + (linkInput.length > 50 ? '...' : ''),
      }]);
    }

    setLinkInput('');
    setAddingType(null);
  };

  const handleRemoveSource = (index: number) => {
    if (sources.length <= 1) return; // Não permite remover a última fonte
    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const getSourceIcon = (type: SourceItem['type']) => {
    switch (type) {
      case 'post': return <Image className="w-5 h-5" />;
      case 'news': return <Newspaper className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'website': return <Link2 className="w-5 h-5" />;
    }
  };

  const getSourceLabel = (type: SourceItem['type']) => {
    switch (type) {
      case 'post': return 'Post do Feed';
      case 'news': return 'Notícia';
      case 'instagram': return 'Instagram';
      case 'website': return 'Link Externo';
    }
  };

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
      setCurrentStep(initialSource ? 'sources' : 'template');
      setContentType(null);
      setScreenCount(10);
      setDescriptionLength('curta');
      setDimension('1080x1350');
      setHasCTA(null);
      setCtaType(null);
      setCtaIntention(null);
      setWantsContext(null);
      setContext('');
      setIsInitialMount(true);
      // Reset sources to initial
      setSources(initialSource ? [initialSource] : []);
      setLinkInput('');
      setAddingType(null);
    }
  }, [isOpen, initialSource]);

  // Step navigation helpers
  const getStepTitle = () => {
    switch (currentStep) {
      case 'sources': return 'Pronto para gerar!';
      case 'template': return 'Selecionar Template';
      case 'content-type': return 'Tipo de Conteúdo';
      case 'characteristics': return 'Características do Carrossel';
      case 'cta': return 'Configurar CTA';
      case 'context': return 'Contexto do Carrossel';
    }
  };

  const getStepNumber = () => {
    const hasSourcesStep = !!initialSource;
    switch (currentStep) {
      case 'sources': return 1;
      case 'template': return hasSourcesStep ? 2 : 1;
      case 'content-type': return hasSourcesStep ? 3 : 2;
      case 'characteristics': return hasSourcesStep ? 4 : 3;
      case 'cta': return hasSourcesStep ? 5 : 4;
      case 'context': return hasSourcesStep ? 6 : 5;
    }
  };

  const getTotalSteps = () => {
    const baseSteps = hasCTA === false ? 4 : 5;
    return initialSource ? baseSteps + 1 : baseSteps;
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 'sources': return sources.length > 0 && !addingType; // Precisa ter ao menos uma fonte e não estar adicionando
      case 'template': return true;
      case 'context': return wantsContext !== null; // Precisa escolher sim ou não
      case 'content-type': return contentType !== null;
      case 'characteristics': return hasCTA !== null;
      case 'cta': return ctaType !== null && ctaIntention !== null;
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'sources':
        setCurrentStep('template');
        break;
      case 'template':
        setCurrentStep('content-type');
        break;
      case 'content-type':
        setCurrentStep('characteristics');
        break;
      case 'characteristics':
        if (hasCTA === false) {
          setCurrentStep('context');
        } else {
          setCurrentStep('cta');
        }
        break;
      case 'cta':
        setCurrentStep('context');
        break;
      case 'context':
        // Se escolheu que quer adicionar contexto mas ainda não digitou, não avança
        if (wantsContext === true) {
          // Já está no campo de texto, pode gerar mesmo sem contexto
          handleGenerate();
        } else if (wantsContext === false) {
          // Escolheu não adicionar contexto, gera direto
          handleGenerate();
        }
        // Se wantsContext === null, não faz nada (não deveria chegar aqui)
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'template':
        // Volta para sources se veio de lá
        if (initialSource) {
          setCurrentStep('sources');
        }
        break;
      case 'content-type':
        setCurrentStep('template');
        break;
      case 'characteristics':
        setCurrentStep('content-type');
        break;
      case 'cta':
        setCurrentStep('characteristics');
        break;
      case 'context':
        // Se estiver no campo de texto, volta para a pergunta sim/não
        if (wantsContext === true) {
          setWantsContext(null);
        } else {
          // Volta para CTA ou characteristics dependendo se tem CTA
          if (hasCTA === false) {
            setCurrentStep('characteristics');
          } else {
            setCurrentStep('cta');
          }
        }
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
        // Para templates React, usa o ID base (sem -react) para buscar preview data
        const baseTemplateId = selectedTemplate.id.replace('-react', '');
        const isReact = templateService.isReactTemplate(selectedTemplate.id);
        
        // Verifica se existe dados de preview para este template (usa ID base)
        const previewData = TEMPLATE_PREVIEW_DATA[baseTemplateId] || TEMPLATE_PREVIEW_DATA['1'];
        
        if (previewData) {
          // Mescla dados do usuário com dados do template
          const userData = getUserData();
          const mergedPreviewData = mergeUserDataWithPreview(previewData, userData);
          
          // Salva dados brutos para templates React
          setPreviewRawData({
            conteudos: mergedPreviewData.conteudos || [],
            dados_gerais: mergedPreviewData.dados_gerais || {},
          });
          
          if (isReact) {
            // Templates React não precisam de HTML - renderização é via componentes
            // Define array vazio para indicar que deve usar renderização React
            setSlidesHtml(Array(10).fill('__REACT__'));
          } else {
            // Busca os slides do template HTML
            const slides = await templateService.fetchTemplate(selectedTemplate.id);
            
            if (!cancelled && Array.isArray(slides)) {
              // Renderiza os slides com os dados mesclados (para iframe)
              const renderedSlides = templateRenderer.renderAllSlides(slides, mergedPreviewData);
              setSlidesHtml(renderedSlides);
            }
          }
        } else {
          // Se não houver dados de preview
          setSlidesHtml([]);
          setPreviewRawData(null);
        }
      } catch (error) {
        console.error('Erro ao carregar preview do template:', error);
        if (!cancelled) {
          setSlidesHtml([]);
          setPreviewRawData(null);
        }
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
    // Se tem sources, inclui as informações de multi-fonte
    const isMultifont = sources.length > 1;
    // IMPORTANTE: O primeiro item (initialSource) já é enviado via postCode pelo componente pai
    // Então pegamos apenas os links adicionais (sources[1] em diante)
    const additionalLinks = sources.slice(1).map(s => s.code || s.id);
    
    const options: GenerationOptions = {
      templateId: selectedTemplate.id,
      contentType: contentType!,
      screenCount,
      descriptionLength,
      dimension,
      hasCTA: hasCTA!,
      ...(hasCTA && ctaType && { ctaType }),
      ...(hasCTA && ctaIntention && { ctaIntention }),
      ...(context.trim() && { context: context.trim() }),
      ...(isMultifont && additionalLinks.length > 0 && { multipleLinks: additionalLinks }),
      ...(isMultifont && { multifont: true }),
    };
    
    console.log('🎯 TemplateSelectionModal - handleGenerate called');
    console.log('🎯 Generation options:', options);
    console.log('🎯 Sources:', sources);
    console.log('🎯 Additional links (excluding first):', additionalLinks);
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
              {currentStep !== 'sources' && currentStep !== 'template' && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {currentStep === 'template' && !initialSource && (
                <button
                  className="md:hidden p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
                  onClick={() => setShowSidebar((s) => !s)}
                  aria-label="Alternar lista de templates"
                >
                  <PanelsTopLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {currentStep === 'template' && initialSource && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 ring-blue-500/30 transition-colors"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div>
                <h2 id="template-modal-title" className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">
                  {getStepTitle()}
                </h2>
                {currentStep === 'sources' ? (
                  <p className="text-xs text-gray-500">
                    Voc\u00ea pode gerar agora ou adicionar mais fontes (opcional)
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Etapa {getStepNumber()} de {getTotalSteps()}
                  </p>
                )}
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
              {/* Step Sources: Multi-source selection */}
              {currentStep === 'sources' && (
                <motion.div
                  key="step-sources"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-6 overflow-y-auto"
                >
                  <div className="w-full max-w-lg">
                    {/* Header visual */}
                    <div className="text-center mb-8">
                      <div className="relative inline-flex">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
                          <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Tudo pronto!</h3>
                      <p className="text-gray-600">
                        Sua fonte foi selecionada. Avance para escolher o template ou combine mais conteúdos.
                      </p>
                    </div>

                    {/* Lista de fontes */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {sources.length === 1 ? 'Fonte selecionada' : `${sources.length} fontes selecionadas`}
                        </label>
                      </div>
                      {sources.map((source, index) => (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            flex items-center gap-4 p-4 bg-white rounded-2xl border-2 shadow-sm
                            ${index === 0 ? 'border-purple-200 ring-2 ring-purple-100' : 'border-gray-200'}
                          `}
                        >
                          <div className={`
                            p-3 rounded-xl shadow-sm
                            ${source.type === 'instagram' ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white' : ''}
                            ${source.type === 'website' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : ''}
                            ${source.type === 'post' ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : ''}
                            ${source.type === 'news' ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' : ''}
                          `}>
                            {getSourceIcon(source.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {source.title || source.code || source.id}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              {getSourceLabel(source.type)}
                              {index === 0 && <span className="text-purple-500 font-medium">• Principal</span>}
                            </p>
                          </div>
                          {sources.length > 1 && (
                            <button
                              onClick={() => handleRemoveSource(index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Input de link (quando adicionando) */}
                    {addingType && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-xl ${addingType === 'instagram' ? 'bg-gradient-to-br from-pink-500 to-purple-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                            {addingType === 'instagram' ? (
                              <Instagram className="w-5 h-5 text-white" />
                            ) : (
                              <Link2 className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {addingType === 'instagram' ? 'Adicionar Post do Instagram' : 'Adicionar Link Externo'}
                          </span>
                        </div>
                        <input
                          type="url"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleConfirmLink()}
                          placeholder={addingType === 'instagram'
                            ? 'https://www.instagram.com/p/...'
                            : 'https://exemplo.com/artigo'
                          }
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 mb-4 bg-gray-50"
                          autoFocus
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setAddingType(null)}
                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleConfirmLink}
                            disabled={!linkInput.trim()}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            Adicionar
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Botões de adicionar (quando não está adicionando) */}
                    {!addingType && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Adicionar mais (opcional)</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAddSource('instagram')}
                            disabled={instagramSourcesCount >= MAX_INSTAGRAM_SOURCES}
                            className={`group flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all ${
                              instagramSourcesCount >= MAX_INSTAGRAM_SOURCES 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100'
                            }`}
                          >
                            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              <Instagram className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-900">Instagram</p>
                              <p className="text-xs text-gray-500">
                                {instagramSourcesCount >= MAX_INSTAGRAM_SOURCES 
                                  ? `Limite: ${MAX_INSTAGRAM_SOURCES}/${MAX_INSTAGRAM_SOURCES}` 
                                  : `${instagramSourcesCount}/${MAX_INSTAGRAM_SOURCES} adicionados`}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAddSource('website')}
                            disabled={websiteSourcesCount >= MAX_WEBSITE_SOURCES}
                            className={`group flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-2xl transition-all ${
                              websiteSourcesCount >= MAX_WEBSITE_SOURCES 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100'
                            }`}
                          >
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                              <Link2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-gray-900">Link Externo</p>
                              <p className="text-xs text-gray-500">
                                {websiteSourcesCount >= MAX_WEBSITE_SOURCES 
                                  ? `Limite: ${MAX_WEBSITE_SOURCES}/${MAX_WEBSITE_SOURCES}` 
                                  : `${websiteSourcesCount}/${MAX_WEBSITE_SOURCES} adicionados`}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Info sobre multi-fonte */}
                    {sources.length > 1 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-6 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-200"
                      >
                        <div className="flex items-center gap-3 text-white">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold">{sources.length} fontes combinadas</span>
                            <p className="text-sm text-white/80">
                              Conteúdo multi-fonte ativado
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step Template: Template Selection */}
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
                            // Usa zoom ao invés de transform:scale para texto nítido
                            zoom: zoom,
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
                                
                                // Se for template React, usa ReactSlideRenderer
                                if (isReactTemplate && previewRawData) {
                                  const slideData = previewRawData.conteudos[idx] || {};
                                  return (
                                    <div
                                      key={idx}
                                      className="relative shadow-lg rounded-lg overflow-hidden bg-black border border-gray-300"
                                      style={{ 
                                        width, 
                                        height, 
                                        zIndex: 10000001,
                                        // Renderização nítida
                                        transform: 'translateZ(0)',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden',
                                        willChange: 'auto',
                                      }}
                                    >
                                      <ReactSlideRenderer
                                        templateId={selectedTemplate.id}
                                        slideIndex={idx}
                                        slideData={slideData}
                                        dadosGerais={previewRawData.dados_gerais}
                                        containerWidth={width}
                                        containerHeight={height}
                                      />
                                    </div>
                                  );
                                }
                                
                                // Template normal: usa iframe
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

              {/* Step 2: Context Input */}
              {currentStep === 'context' && (
                <motion.div
                  key="step-context"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex items-center justify-center bg-gray-50 p-6"
                >
                  <div className="w-full max-w-2xl">
                    {/* Pergunta inicial: Quer adicionar contexto? */}
                    {wantsContext === null ? (
                      <>
                        <div className="text-center mb-8">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-purple-500" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Deseja adicionar contexto?</h3>
                          <p className="text-gray-600">
                            Adicionar contexto ajuda a IA a gerar um carrossel mais alinhado com sua ideia.
                          </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={() => setWantsContext(true)}
                            className="flex-1 max-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md"
                          >
                            Sim, quero
                          </button>
                          <button
                            onClick={() => {
                              setWantsContext(false);
                              handleGenerate();
                            }}
                            className="flex-1 max-w-[200px] py-4 px-6 rounded-xl font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Não, pular
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Campo de contexto quando wantsContext === true */
                      <>
                        <div className="text-center mb-8">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-purple-500" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Qual é a brisa?</h3>
                          <p className="text-gray-600">
                            Descreva a ideia ou contexto do seu carrossel. Isso ajuda a IA a gerar conteúdo mais relevante.
                          </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                          <label htmlFor="context-input" className="block font-semibold text-gray-900 mb-3">
                            Contexto
                          </label>
                          <textarea
                            id="context-input"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Ex: Quero fazer um carrossel sobre produtividade para empreendedores que estão começando, focando em dicas práticas..."
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 resize-none"
                            autoFocus
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Quanto mais detalhes você fornecer, melhor será o resultado.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Content Type Selection */}
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

              {/* Step 4: Carousel Characteristics */}
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
                        <button
                          onClick={() => setDimension('1080x1350')}
                          className={`
                            flex-1 py-4 px-4 rounded-lg font-medium transition-all flex flex-col items-center gap-2
                            ${dimension === '1080x1350'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <Smartphone className={`w-5 h-5 ${dimension === '1080x1350' ? 'text-white' : 'text-gray-500'}`} />
                            <span className="text-sm font-semibold">Feed</span>
                          </div>
                          <span className="text-xs opacity-80">1080x1350</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${dimension === '1080x1350' ? 'bg-white/20' : 'bg-gray-200'}`}>
                            Padrão Instagram
                          </span>
                        </button>
                        <button
                          onClick={() => setDimension('1170x1560')}
                          className={`
                            flex-1 py-4 px-4 rounded-lg font-medium transition-all flex flex-col items-center gap-2
                            ${dimension === '1170x1560'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2">
                            <Monitor className={`w-5 h-5 ${dimension === '1170x1560' ? 'text-white' : 'text-gray-500'}`} />
                            <span className="text-sm font-semibold">Full</span>
                          </div>
                          <span className="text-xs opacity-80">1170x1560</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${dimension === '1170x1560' ? 'bg-white/20' : 'bg-gray-200'}`}>
                            Alta resolução
                          </span>
                        </button>
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

              {/* Step 5: CTA Configuration */}
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
              {/* Progress indicator ou info de fontes */}
              <div className="flex items-center gap-2">
                {currentStep === 'sources' ? (
                  <span className="text-sm text-gray-500">
                    {sources.length === 1 
                      ? 'Gere com esta fonte ou adicione mais acima'
                      : <span className="flex items-center gap-1 text-purple-600 font-medium">
                          <FileText className="w-4 h-4" />
                          {sources.length} fontes combinadas
                        </span>
                    }
                  </span>
                ) : (
                  Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((step) => (
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
                  ))
                )}
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
                  {currentStep === 'sources'
                    ? (sources.length === 1 ? 'Gerar Carrossel' : `Gerar com ${sources.length} fontes`)
                    : currentStep === 'context'
                    ? 'Gerar Carrossel'
                    : 'Avançar'
                  }
                </span>
                <ChevronRight className="w-4 h-4" />
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