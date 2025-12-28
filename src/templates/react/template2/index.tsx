/**
 * Template 2 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fonte: Montserrat (600, 700)
 * - Dimensões: 1080x1350px
 * - Slide 1: Foto top + footer branco 40%
 * - Slides 2-9: Fundo branco, título+subtitle+imagem/vídeo, chips
 * - Slide 10: Barra rosa CTA + foto + footer branco
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap');`;

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

const baseStyles = {
  slide: {
    width: '1080px',
    height: '1350px',
    position: 'relative' as const,
    overflow: 'hidden',
    fontFamily: '"Montserrat", Arial, sans-serif',
    boxSizing: 'border-box' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  },
  title: {
    color: '#37474F',
    fontWeight: 700,
    fontSize: '58px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    maxWidth: '100%',
    textAlign: 'left' as const,
    whiteSpace: 'normal' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
    marginBottom: '20px',
  },
  subtitle: {
    color: '#37474F',
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
  chip: {
    background: '#007AFF',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '18px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Componente de Chips
const Chips: React.FC<{ slideNumber: number }> = ({ slideNumber }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
    <div style={{ ...baseStyles.chip, width: '120px' }}>
      {String(slideNumber).padStart(2, '0')} - 10
    </div>
    <div style={{ ...baseStyles.chip, width: '154px', gap: '8px' }}>
      <span>Deslize</span>
      <img src="https://i.imgur.com/Gc1eUTk.png" alt="" style={{ width: '18px', height: '18px', display: 'block' }} />
    </div>
  </div>
);

// Função para verificar se é vídeo
const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|webm|ogg|mov)(\?|$)/) !== null;
};

// Componente de mídia (imagem ou vídeo)
const MediaContent: React.FC<{ url?: string }> = ({ url }) => {
  const [error, setError] = useState(false);
  
  if (!url || error) return null;
  
  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '600px',
    objectFit: 'cover',
    objectPosition: 'top',
    borderRadius: '24px',
    display: 'block',
    boxShadow: '0 16px 48px rgba(0, 0, 0, .18)',
    marginTop: '16px',
  };

  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        style={mediaStyle}
        muted
        playsInline
        controls
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      data-editable="image"
      style={mediaStyle}
      onError={() => setError(true)}
    />
  );
};

/**
 * Slide 1 - Cover: Foto top + footer branco 40%
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr) auto',
        background: '#000',
        color: '#111',
        position: 'relative',
      }}
    >
      {/* Background editável */}
      <div 
        data-editable="background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      />
      
      <style>{FONT_IMPORT}</style>

      {/* Foto top */}
      <div
        style={{
          position: 'relative',
          backgroundImage: data.imagem_fundo ? `url("${data.imagem_fundo}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          minHeight: 0,
        }}
      >
        <img 
          src="https://i.imgur.com/DOgoEcV.png" 
          alt="" 
          style={{ position: 'absolute', right: '36px', bottom: '36px', width: '110px', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Footer branco */}
      <section
        style={{
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '66px 48px 66px 60px',
          gap: '14px',
          minHeight: 'calc(1350px * 0.40)',
        }}
      >
        <div style={{ width: '100%' }}>
          <RenderHtml data-editable="title" html={data.title || ''} style={baseStyles.title} />
          <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={baseStyles.subtitle} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '24px' }}>
          <Chips slideNumber={1} />
        </div>
      </section>
    </div>
  );
};

/**
 * Slides 2-9 - Conteúdo: título + subtitle + imagem/vídeo + chips
 */
export const SlideContent: React.FC<SlideProps> = ({ data, slideIndex }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: '1fr',
        background: '#000',
        color: '#111',
        position: 'relative',
      }}
    >
      {/* Background editável */}
      <div 
        data-editable="background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      />
      
      <style>{FONT_IMPORT}</style>

      <section
        style={{
          background: '#fff',
          minHeight: '100%',
          display: 'grid',
          gridTemplateRows: '1fr auto',
          padding: '66px 60px',
          paddingTop: 0,
          gap: '24px',
          alignItems: 'stretch',
        }}
      >
        {/* Bloco central */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignSelf: 'center',
            justifySelf: 'stretch',
            alignItems: 'flex-start',
          }}
        >
          <RenderHtml data-editable="title" html={data.title || ''} style={baseStyles.title} />
          <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={baseStyles.subtitle} />
          <MediaContent url={data.imagem_fundo} />
        </div>

        {/* Chips */}
        <Chips slideNumber={slideIndex + 1} />
      </section>
    </div>
  );
};

/**
 * Slide 10 - CTA: Barra rosa + foto + footer
 */
export const Slide10CTA: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto minmax(40%, auto) 1fr',
        background: '#fff',
        color: '#37474F',
        position: 'relative',
      }}
    >
      {/* Background editável */}
      <div 
        data-editable="background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      />
      
      <style>{FONT_IMPORT}</style>

      {/* Barra CTA */}
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
          }}
        >
          Me siga para mais conteúdos como esse!
        </div>
      </header>

      {/* Foto */}
      <div
        style={{
          backgroundImage: data.imagem_fundo ? `url("${data.imagem_fundo}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          minHeight: '620px',
        }}
      />

      {/* Footer */}
      <section
        style={{
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '60px 48px 60px 60px',
        }}
      >
        <RenderHtml 
          html={data.title || ''}
          style={{
            ...baseStyles.title,
            fontSize: '48px',
            maxWidth: '88%',
            marginBottom: 0,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '24px' }}>
          <Chips slideNumber={10} />
        </div>
      </section>
    </div>
  );
};

export const SLIDE_COMPONENTS = [
  Slide1Cover,   // 0
  SlideContent,  // 1
  SlideContent,  // 2
  SlideContent,  // 3
  SlideContent,  // 4
  SlideContent,  // 5
  SlideContent,  // 6
  SlideContent,  // 7
  SlideContent,  // 8
  Slide10CTA,    // 9
];

const Template2: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideContent;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template2;
