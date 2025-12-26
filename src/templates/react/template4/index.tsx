/**
 * Template 4 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fontes: Montserrat (títulos), DM Sans (mesano, arroba)
 * - Dimensões: 1080x1350px
 * - Cor principal: #6750A4 (purple)
 */
import React from 'react';
import { RenderHtml } from '../utils/renderHtml';

// Importa fontes via CSS-in-JS
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,600;0,700&family=Montserrat:wght@600;700&display=swap');`;

// Tipos
interface SlideData {
  title?: string;
  subtitle?: string;
  mesano?: string;
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
    backgroundColor: '#6750A4',
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#fff',
    boxSizing: 'border-box' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    textRendering: 'optimizeLegibility' as const,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  },
  mesano: {
    fontFamily: '"DM Sans", system-ui, Arial, sans-serif',
    color: '#F1F1F1',
    fontWeight: 600,
    fontSize: '28px',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    maxWidth: '100%',
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  titleLarge: {
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '78px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    maxWidth: '100%',
    textAlign: 'left' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  titleSmall: {
    fontFamily: '"Montserrat", Arial, sans-serif',
    fontWeight: 700,
    fontSize: '35px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: '#FFFFFF',
    textAlign: 'left' as const,
    maxWidth: '100%',
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  subtitle: {
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#F1F1F1',
    fontWeight: 600,
    fontSize: '32px',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    maxWidth: '100%',
    textAlign: 'left' as const,
    overflowWrap: 'anywhere' as const,
    wordBreak: 'break-word' as const,
  },
  handle: {
    fontFamily: '"DM Sans", system-ui, Arial, sans-serif',
    color: '#F1F1F1',
    fontWeight: 600,
    fontSize: '22px',
  },
};

/**
 * Slide 1 - Cover com título italic, imagem e botão
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>

      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '100px 60px',
          gap: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Mesano (top) */}
        <div style={baseStyles.mesano}>{data.mesano || ''}</div>

        {/* Bloco central */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '18px',
            alignSelf: 'stretch',
          }}
        >
          {/* Title italic */}
          <RenderHtml data-editable="title" html={data.title || ''} style={{ ...baseStyles.titleLarge, fontStyle: 'italic' }} />

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
                boxShadow: '0 16px 48px rgba(0, 0, 0, .25)',
              }}
            />
          )}

          {/* Botão preto */}
          <div
            style={{
              background: '#111111',
              color: '#FFFFFF',
              padding: '14px 18px',
              borderRadius: '12px',
              fontFamily: '"DM Sans", system-ui, Arial, sans-serif',
              fontWeight: 300,
              fontSize: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>Passe para o lado</span>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h12M13 6l6 6-6 6"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Handle (bottom) */}
        <div data-editable="arroba" style={baseStyles.handle}>@{dadosGerais?.arroba?.replace('@', '') || ''}</div>
      </section>
    </div>
  );
};

/**
 * Slides 2, 4, 5, 7 - Texto centralizado (título grande + subtitle)
 */
export const SlideTextOnly: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>

      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          padding: '100px 60px',
          boxSizing: 'border-box',
        }}
      >
        {/* Mesano (top) */}
        <div style={{ ...baseStyles.mesano, alignSelf: 'start' }}>{data.mesano || ''}</div>

        {/* Centro (título + subtitle) */}
        <div
          style={{
            alignSelf: 'center',
            justifySelf: 'start',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
          }}
        >
          <RenderHtml data-editable="title" html={data.title || ''} style={baseStyles.titleLarge} />
          {data.subtitle && <RenderHtml data-editable="subtitle" html={data.subtitle} style={baseStyles.subtitle} />}
        </div>

        {/* Handle (bottom) */}
        <div data-editable="arroba" style={{ ...baseStyles.handle, alignSelf: 'end' }}>
          @{dadosGerais?.arroba?.replace('@', '') || ''}
        </div>
      </section>
    </div>
  );
};

/**
 * Slides 3, 6, 8, 9 - Imagem em cima, título pequeno embaixo
 */
export const SlideImageTitle: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>

      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          padding: '100px 60px',
          gap: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Mesano */}
        <div style={baseStyles.mesano}>{data.mesano || ''}</div>

        {/* Centro (imagem + título) */}
        <div
          style={{
            alignSelf: 'center',
            justifySelf: 'start',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            alignItems: 'flex-start',
          }}
        >
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
                boxShadow: '0 16px 48px rgba(0, 0, 0, .25)',
              }}
            />
          )}
          <RenderHtml data-editable="title" html={data.title || ''} style={baseStyles.titleSmall} />
        </div>

        {/* Handle */}
        <div data-editable="arroba" style={baseStyles.handle}>@{dadosGerais?.arroba?.replace('@', '') || ''}</div>
      </section>
    </div>
  );
};

/**
 * Slide 10 - CTA Final com barra rosa
 */
export const Slide10CTA: React.FC<SlideProps> = ({ data }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto minmax(40%, auto) 1fr',
        background: '#000',
        color: '#E3E3E3',
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

      {/* Rodapé purple com título */}
      <section
        style={{
          background: '#6750A4',
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
            maxWidth: '88%',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            textAlign: 'left',
          }} />
      </section>
    </div>
  );
};

// Array de componentes exportados (ordem dos slides)
export const SLIDE_COMPONENTS = [
  Slide1Cover,     // Slide 1 - Cover com imagem e botão
  SlideTextOnly,   // Slide 2 - Texto
  SlideImageTitle, // Slide 3 - Imagem + título
  SlideTextOnly,   // Slide 4 - Texto
  SlideTextOnly,   // Slide 5 - Texto
  SlideImageTitle, // Slide 6 - Imagem + título
  SlideTextOnly,   // Slide 7 - Texto
  SlideImageTitle, // Slide 8 - Imagem + título
  SlideImageTitle, // Slide 9 - Imagem + título
  Slide10CTA,      // Slide 10 - CTA
];

// Componente principal que renderiza o slide correto
const Template4: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideTextOnly;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template4;
