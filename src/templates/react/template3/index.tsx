/**
 * Template 3 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fontes: Anton SC (títulos), Montserrat (600, 700)
 * - Dimensões: 1080x1350px
 * - Cores: #000 (bg), #fff/#F1F1F1 (texto), #E3E3E3 (cor secundária)
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

// Importa fontes via CSS-in-JS
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Anton+SC&family=Montserrat:wght@600;700&display=swap');`;

// Tipos
interface SlideData {
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
}

interface DadosGerais {
  nome?: string;
  arroba?: string;
  foto_perfil?: string;
}

interface SlideProps {
  data: SlideData;
  dadosGerais?: DadosGerais;
  slideIndex: number;
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
    color: '#E3E3E3',
    boxSizing: 'border-box' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    textRendering: 'optimizeLegibility' as const,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  },
  titleAnton: {
    fontFamily: '"Anton SC", "Anton", system-ui, Arial, sans-serif',
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: '0.5px',
    color: '#FFF',
    maxWidth: '100%',
    textAlign: 'left' as const,
    whiteSpace: 'normal' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  subtitle: {
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#F1F1F1',
    fontWeight: 600,
    fontSize: '38px',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    maxWidth: '100%',
    textAlign: 'left' as const,
    whiteSpace: 'normal' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  handle: {
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#F1F1F1',
    fontWeight: 700,
    fontStyle: 'italic' as const,
    fontSize: '20px',
  },
};

// Gradiente para Slide 1 (esquerda para direita)
const GRADIENT_LEFT_TO_RIGHT = `linear-gradient(to right,
  rgba(0,0,0,1) 0%,
  rgba(0,0,0,1) 25%,
  rgba(0,0,0,.85) 40%,
  rgba(0,0,0,.45) 65%,
  rgba(0,0,0,0) 100%
)`;

/**
 * Slide 1 - Cover com gradiente lateral
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div style={{ ...baseStyles.slide, color: '#fff' }}>
      <style>{FONT_IMPORT}</style>

      {/* Background com gradiente esquerda→direita */}
      <div
        data-editable="background"
        style={{
          position: 'absolute',
          inset: 0,
          paddingLeft: '0%',
          backgroundImage: data.imagem_fundo
            ? `${GRADIENT_LEFT_TO_RIGHT}, url("${data.imagem_fundo}")`
            : GRADIENT_LEFT_TO_RIGHT,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%, cover',
          backgroundPosition: 'left',
          backgroundOrigin: 'border-box, content-box',
          backgroundClip: 'border-box, content-box',
        }}
      />

      {/* Content */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px',
          gap: '14px',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        {/* Profile */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          {dadosGerais?.foto_perfil && !avatarError && (
            <img
              data-editable="image"
              src={dadosGerais.foto_perfil}
              alt="Avatar"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '3px solid #1ACD8A',
                objectFit: 'cover',
                flex: '0 0 auto',
              }}
              onError={() => setAvatarError(true)}
            />
          )}
          <div>
            {dadosGerais?.nome && (
              <div data-editable="nome" style={{ fontWeight: 700, fontSize: '22px', lineHeight: 1.2 }}>{dadosGerais.nome}</div>
            )}
            {dadosGerais?.arroba && (
              <div data-editable="arroba" style={{ fontWeight: 600, fontSize: '18px', opacity: 0.95 }}>
                @{dadosGerais.arroba.replace('@', '')}
              </div>
            )}
          </div>
        </div>

        {/* Title Anton SC 96px */}
        <RenderHtml data-editable="title" html={data.title || ''} style={{
            ...baseStyles.titleAnton,
            fontSize: '96px',
            lineHeight: 1.02,
            marginTop: '8px',
            maxWidth: '60%',
          }} />
      </section>
    </div>
  );
};

/**
 * Slides 2-9 - Conteúdo com imagem, título Anton, subtítulo e handle
 */
export const SlideContent: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: '1fr',
      }}
    >
      <style>{FONT_IMPORT}</style>

      <section
        style={{
          background: '#000',
          minHeight: '100%',
          display: 'grid',
          gridTemplateRows: '1fr',
          padding: '66px 60px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* Imagem */}
          {data.imagem_fundo && (
            <img
              data-editable="image"
              src={data.imagem_fundo}
              alt=""
              style={{
                width: '100%',
                height: '450px',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '24px',
                display: 'block',
                boxShadow: '0 16px 48px rgba(0, 0, 0, .28)',
              }}
            />
          )}

          {/* Title - 36px margin after image */}
          {data.title && (
            <RenderHtml data-editable="title" html={data.title} style={{
                ...baseStyles.titleAnton,
                fontSize: '65px',
                marginTop: '36px',
              }} />
          )}

          {/* Subtitle - 26px margin */}
          {data.subtitle && (
            <RenderHtml data-editable="subtitle" html={data.subtitle} style={{ ...baseStyles.subtitle, marginTop: '26px' }} />
          )}

          {/* Handle italic - 26px margin */}
          {dadosGerais?.arroba && (
            <div data-editable="arroba" style={{ ...baseStyles.handle, marginTop: '26px' }}>
              Powered by @{dadosGerais.arroba.replace('@', '')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

/**
 * Slide 10 - CTA Final com barra rosa e título Anton
 */
export const Slide10CTA: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto minmax(40%, auto) 1fr',
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Barra CTA superior */}
      <header
        style={{
          background: '#FFDBDB',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '18px 48px 18px 60px',
          justifyContent: 'center',
        }}
      >
        <img src="https://i.imgur.com/Xb0AayN.png" alt="" style={{ width: '76px', height: '76px', display: 'block' }} />
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
          }}
        >
          Me siga para mais conteúdos como esse!
        </div>
      </header>

      {/* Foto central */}
      <div
        data-editable="background"
        style={{
          backgroundImage: data.imagem_fundo ? `url("${data.imagem_fundo}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          minHeight: '620px',
        }}
      />

      {/* Rodapé preto com título Anton */}
      <section
        style={{
          background: '#000',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '60px 48px 60px 60px',
          boxSizing: 'border-box',
        }}
      >
        <RenderHtml data-editable="title" html={data.title || ''} style={{
            ...baseStyles.titleAnton,
            fontSize: '65px',
            lineHeight: 1.2,
            maxWidth: '88%',
          }} />
      </section>
    </div>
  );
};

// Array de componentes exportados (ordem dos slides)
export const SLIDE_COMPONENTS = [
  Slide1Cover,     // Slide 1
  SlideContent,    // Slide 2
  SlideContent,    // Slide 3
  SlideContent,    // Slide 4
  SlideContent,    // Slide 5
  SlideContent,    // Slide 6
  SlideContent,    // Slide 7
  SlideContent,    // Slide 8
  SlideContent,    // Slide 9
  Slide10CTA,      // Slide 10
];

// Componente principal que renderiza o slide correto
const Template3: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideContent;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template3;
