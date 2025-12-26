/**
 * Template 1 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fonte: Montserrat (500, 600, 700)
 * - Dimensões: 1080x1350px
 * - Cores: #fff (branco), #E3E3E3 (cinza claro), #EAEAEA (cinza), #000 (preto)
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

// Importa fonte Montserrat via CSS-in-JS
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap');`;

// Tipos
interface SlideData {
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
  imagem_fundo2?: string;
  imagem_fundo3?: string;
  thumbnail_url?: string;
}

interface DadosGerais {
  nome?: string;
  arroba?: string;
  foto_perfil?: string;
  template?: string;
}

interface SlideProps {
  data: SlideData;
  dadosGerais?: DadosGerais;
  styles?: Record<string, any>;
}

// Estilos base compartilhados
const baseStyles = {
  slide: {
    width: '1080px',
    height: '1350px',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: '#000',
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#fff',
    boxSizing: 'border-box' as const,
    // Antialiasing para texto nítido
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    textRendering: 'optimizeLegibility' as const,
    // GPU acceleration para evitar blur em scale
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
  },
  title: {
    fontWeight: 700,
    fontSize: '40px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    maxWidth: 'min(820px, 88%)',
    whiteSpace: 'normal' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
    hyphens: 'auto' as const,
    textAlign: 'left' as const,
  },
};

// Gradientes exatos do HTML
const GRADIENTS = {
  // Slide 1: gradiente de baixo para cima
  bottomToTop: 'linear-gradient(to top, rgba(0, 0, 0, 0.90) 0%, rgba(0, 0, 0, 0.62) 40%, rgba(0, 0, 0, 0) 100%)',
  // Slides 2/4/7: gradiente mais forte
  bottomToTopStrong: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.62) 40%, rgba(0,0,0,0) 60%)',
  // Slide 5: gradiente de cima para baixo
  topToBottom: 'linear-gradient(to bottom, rgba(0, 0, 0, .92) 0%, rgba(0, 0, 0, .70) 45%, rgba(0, 0, 0, .35) 70%, rgba(0, 0, 0, 0) 100%)',
};

// Componente de Background com imagem
const BackgroundWithGradient: React.FC<{ src?: string; gradient: string; position?: string }> = ({ 
  src, 
  gradient, 
  position = 'center center' 
}) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) return null;
  
  return (
    <div
      data-editable="background"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `${gradient}, url("${src}")`,
        backgroundSize: 'cover',
        // NÃO usa backgroundPosition inline para permitir que estilos dinâmicos funcionem
        // O position inicial vem do CSS ou dos estilos dinâmicos
      }}
      onError={() => setHasError(true)}
    />
  );
};

/**
 * Slide 1 - Cover (Capa)
 * Avatar + Nome + @arroba + Título + Subtítulo sobre imagem com gradiente
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>
      
      {/* Background com gradiente */}
      <BackgroundWithGradient 
        src={data.imagem_fundo} 
        gradient={GRADIENTS.bottomToTop}
      />
      
      {/* Content */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '72px 48px calc(72px + 60px) 48px',
          gap: '18px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', maxWidth: '90%', zIndex: 9 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', maxWidth: '100%', flexWrap: 'wrap' }}>
            {dadosGerais?.foto_perfil && !avatarError && (
              <img
                src={dadosGerais.foto_perfil}
                alt="Avatar"
                data-editable="image"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '3px solid #1ACD8A',
                  objectFit: 'cover',
                  flex: '0 0 auto',
                  // Renderização nítida
                  imageRendering: 'auto',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                onError={() => setAvatarError(true)}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'baseline' }}>
              {dadosGerais?.nome && (
                <div 
                  data-editable="nome"
                  style={{
                  fontWeight: 600,
                  fontSize: '22px',
                  lineHeight: 1.25,
                  letterSpacing: '0',
                  color: '#fff',
                  // Renderização nítida
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}>
                  {dadosGerais.nome}
                </div>
              )}
              {dadosGerais?.arroba && (
                <div 
                  data-editable="arroba"
                  style={{
                  fontWeight: 600,
                  fontSize: '22px',
                  lineHeight: 1.25,
                  letterSpacing: '0',
                  color: '#fff',
                  opacity: 0.95,
                  // Renderização nítida
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}>
                  @{dadosGerais.arroba.replace('@', '')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', maxWidth: '90%', marginTop: '12px', zIndex: 999 }}>
          {data.title && (
            <RenderHtml data-editable="title" html={data.title} style={{
              fontWeight: 700,
              fontSize: '60px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#fff',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              textAlign: 'center',
            }} />
          )}
          {data.subtitle && (
            <RenderHtml data-editable="subtitle" html={data.subtitle} style={{
              fontWeight: 600,
              fontSize: '40px',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#E3E3E3',
              marginTop: '12px',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              textAlign: 'center',
            }} />
          )}
        </div>
      </section>
    </div>
  );
};

/**
 * Slides 2/4/7 - Texto com Background Gradiente
 * Imagem de fundo com gradiente + título no rodapé esquerdo
 */
export const SlideTextBgGradient: React.FC<SlideProps> = ({ data }) => {
  return (
    <div style={{ ...baseStyles.slide, color: '#E3E3E3' }}>
      <style>{FONT_IMPORT}</style>
      
      {/* Background com gradiente */}
      <BackgroundWithGradient 
        src={data.imagem_fundo} 
        gradient={GRADIENTS.bottomToTopStrong}
      />
      
      {/* Content */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          padding: '72px 48px 72px 60px',
          boxSizing: 'border-box',
          zIndex: 9,
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
          fontWeight: 600,
          fontSize: '40px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#E3E3E3',
          maxWidth: 'min(820px, 88%)',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          hyphens: 'auto',
          textAlign: 'left',
          minHeight: '250px',
        }} />
      </section>
    </div>
  );
};

/**
 * Slide 3 - Foto em cima, texto em rodapé preto
 */
export const SlidePhotoTopTextBottom: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'minmax(0,1fr) auto',
        color: '#EAEAEA',
      }}
    >
      <style>{FONT_IMPORT}</style>
      
      {/* Foto no topo */}
      <div
        data-editable="background"
        style={{
          backgroundImage: `url("${data.imagem_fundo}")`,
          backgroundSize: 'cover',
          // Não usa backgroundPosition inline - deixa para estilos dinâmicos
          minHeight: 0,
        }}
      />
      
      {/* Footer preto */}
      <section
        style={{
          backgroundColor: '#000',
          minHeight: 'calc(1350px * 0.30)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'flex-start',
          padding: '54px 48px 24px 60px',
          boxSizing: 'border-box',
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
          fontWeight: 600,
          fontSize: '40px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#EAEAEA',
          maxWidth: 'min(820px, 88%)',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          hyphens: 'auto',
          textAlign: 'left',
          marginBottom: '60px',
        }} />
      </section>
    </div>
  );
};

/**
 * Slide 5 - Gradiente no topo
 */
export const SlideGradientTop: React.FC<SlideProps> = ({ data }) => {
  return (
    <div style={{ ...baseStyles.slide, color: '#E3E3E3' }}>
      <style>{FONT_IMPORT}</style>
      
      {/* Imagem de fundo */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <img
          src={data.imagem_fundo}
          alt=""
          data-editable="image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      </div>
      
      {/* Overlay com gradiente no topo */}
      <section
        style={{
          position: 'absolute',
          zIndex: 1,
          left: 0,
          right: 0,
          top: 0,
          minHeight: 'calc(1350px * 0.20)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '72px 48px 48px 60px',
          backgroundImage: GRADIENTS.topToBottom,
          boxSizing: 'border-box',
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
          fontWeight: 600,
          fontSize: '40px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#E3E3E3',
          maxWidth: 'min(820px, 88%)',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          hyphens: 'auto',
          textAlign: 'left',
        }} />
      </section>
    </div>
  );
};

/**
 * Slides 6/8 - Texto puro em fundo preto
 */
export const SlidePureBlackText: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '200px 48px 0 60px',
        color: '#E3E3E3',
      }}
    >
      <style>{FONT_IMPORT}</style>
      
      <RenderHtml data-editable="title" html={data.title || ''} style={{
        fontWeight: 700,
        fontSize: '40px',
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        color: '#E3E3E3',
        maxWidth: '88%',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        hyphens: 'auto',
        textAlign: 'left',
      }} />
    </div>
  );
};

/**
 * Slide 9 - Split 60/40 (texto esquerda, imagem direita)
 */
export const SlideSplit6040: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        color: '#E3E3E3',
      }}
    >
      <style>{FONT_IMPORT}</style>
      
      {/* Lado esquerdo - texto */}
      <section
        style={{
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '0 48px 0 60px',
          boxSizing: 'border-box',
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
          fontWeight: 700,
          fontSize: '40px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#E3E3E3',
          maxWidth: '88%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          hyphens: 'auto',
          textAlign: 'left',
        }} />
      </section>
      
      {/* Lado direito - imagem */}
      <div
        data-editable="background"
        style={{
          height: '100%',
          backgroundImage: `url("${data.imagem_fundo}")`,
          backgroundSize: 'cover',
          // Não usa backgroundPosition inline - deixa para estilos dinâmicos
        }}
      />
    </div>
  );
};

/**
 * Slide 10 - CTA Final (banner + foto + texto)
 */
export const SlideCTAFinal: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto minmax(40%, auto) 1fr',
        color: '#E3E3E3',
      }}
    >
      <style>{FONT_IMPORT}</style>
      
      {/* Faixa superior rosa */}
      <header
        style={{
          backgroundColor: '#FFDBDB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '18px 48px 18px 60px',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="https://i.imgur.com/Xb0AayN.png"
          alt=""
          data-editable="image"
          style={{ width: '76px', height: '76px', display: 'block' }}
        />
        <div
          style={{
            color: '#FF0B0B',
            fontWeight: 700,
            fontSize: '38px',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            hyphens: 'auto',
          }}
        >
          Me siga para mais conteúdos como esse!
        </div>
      </header>

      {/* Foto central */}
      <div
        data-editable="background"
        style={{
          backgroundImage: `url("${data.imagem_fundo}")`,
          backgroundSize: 'cover',
          // Não usa backgroundPosition inline - deixa para estilos dinâmicos
          minHeight: '620px',
        }}
      />

      {/* Rodapé preto */}
      <section
        style={{
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '60px 48px 60px 60px',
          boxSizing: 'border-box',
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
          fontWeight: 700,
          fontSize: '40px',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: '#E3E3E3',
          maxWidth: '88%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          hyphens: 'auto',
          textAlign: 'left',
        }} />
      </section>
    </div>
  );
};

/**
 * Mapeamento de índice de slide para componente
 * Template 1 tem 10 slides com layouts diferentes
 */
const SLIDE_COMPONENTS: Record<number, React.FC<SlideProps>> = {
  0: Slide1Cover,           // Slide 1 - Capa
  1: SlideTextBgGradient,   // Slide 2 - Texto com BG
  2: SlidePhotoTopTextBottom, // Slide 3 - Foto topo
  3: SlideTextBgGradient,   // Slide 4 - Texto com BG (igual ao 2)
  4: SlideGradientTop,      // Slide 5 - Gradiente topo
  5: SlidePureBlackText,    // Slide 6 - Texto puro
  6: SlideTextBgGradient,   // Slide 7 - Texto com BG (igual ao 2)
  7: SlidePureBlackText,    // Slide 8 - Texto puro (igual ao 6)
  8: SlideSplit6040,        // Slide 9 - Split 60/40
  9: SlideCTAFinal,         // Slide 10 - CTA Final
};

/**
 * Renderiza um slide específico do Template 1
 */
export const renderTemplate1Slide = (
  slideIndex: number,
  data: SlideData,
  dadosGerais?: DadosGerais,
  styles?: Record<string, any>
): React.ReactElement => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideTextBgGradient;
  return <SlideComponent data={data} dadosGerais={dadosGerais} styles={styles} />;
};

/**
 * Renderiza todos os slides do Template 1
 */
export const renderAllTemplate1Slides = (
  conteudos: SlideData[],
  dadosGerais?: DadosGerais,
  styles?: Record<string, Record<string, any>>
): React.ReactElement[] => {
  return conteudos.map((data, index) => (
    <React.Fragment key={index}>
      {renderTemplate1Slide(index, data, dadosGerais, styles?.[String(index)])}
    </React.Fragment>
  ));
};

export default {
  renderSlide: renderTemplate1Slide,
  renderAll: renderAllTemplate1Slides,
};
