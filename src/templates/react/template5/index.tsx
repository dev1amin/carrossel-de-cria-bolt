/**
 * Template 5 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fonte: Montserrat (500, 600, 700)
 * - Dimensões: 1080x1350px
 * - Slide 1: profile + título (font-weight: 500) + botão verde + foto bottom
 * - Slides 2-9: profile + título centralizado vertical
 * - Slide 10: barra rosa CTA + profile + título
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap');`;

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
    backgroundColor: '#F1F1F1',
    fontFamily: '"Montserrat", Arial, sans-serif',
    color: '#37474F',
    boxSizing: 'border-box' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '3px solid #1ACD8A',
    objectFit: 'cover' as const,
    flex: '0 0 auto',
  },
  name: {
    fontWeight: 500,
    fontSize: '24px',
    lineHeight: 1.2,
  },
  handle: {
    fontWeight: 600,
    fontSize: '18px',
    opacity: 0.9,
    marginTop: '-2px',
  },
};

// Componente de Profile
const Profile: React.FC<{ dadosGerais?: DadosGerais; nameWeight?: number }> = ({ dadosGerais, nameWeight = 500 }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
      {dadosGerais?.foto_perfil && !avatarError && (
        <img
          data-editable="image"
          src={dadosGerais.foto_perfil}
          alt="Avatar"
          style={baseStyles.avatar}
          onError={() => setAvatarError(true)}
        />
      )}
      <div>
        {dadosGerais?.nome && <div data-editable="nome" style={{ ...baseStyles.name, fontWeight: nameWeight }}>{dadosGerais.nome}</div>}
        {dadosGerais?.arroba && (
          <div data-editable="arroba" style={baseStyles.handle}>@{dadosGerais.arroba.replace('@', '')}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Slide 1 - Cover: profile + título (500) + botão verde + foto bottom
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Conteúdo top */}
      <section
        style={{
          padding: '72px 60px 36px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'flex-start',
        }}
      >
        <Profile dadosGerais={dadosGerais} nameWeight={500} />

        {/* Título com font-weight 500 (conforme HTML original) */}
        <RenderHtml data-editable="title" html={data.title || ''} style={{
            fontWeight: 500,
            fontSize: '56px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '88%',
            textAlign: 'left',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }} />

        {/* Botão verde */}
        <div
          style={{
            width: '340px',
            height: '64px',
            background: '#008015',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '22px',
            lineHeight: 1,
          }}
        >
          <span>Deslize para o lado</span>
          <svg width="42" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h12M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Foto bottom */}
      <div
        data-editable="background"
        style={{
          backgroundImage: data.imagem_fundo ? `url("${data.imagem_fundo}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          minHeight: '520px',
        }}
      />
    </div>
  );
};

/**
 * Slides 2-9 - Conteúdo: profile + título centralizado vertical
 */
export const SlideContent: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>

      {/* Centro vertical do bloco inteiro */}
      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '72px 60px',
          gap: '20px',
        }}
      >
        <Profile dadosGerais={dadosGerais} nameWeight={700} />

        <RenderHtml data-editable="title" html={data.title || ''} style={{
            fontWeight: 700,
            fontSize: '56px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '88%',
            textAlign: 'left',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }} />
      </section>
    </div>
  );
};

/**
 * Slide 10 - CTA: barra rosa + profile + título
 */
export const Slide10CTA: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Faixa superior "Me siga…" */}
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

      {/* Bloco perfil + title */}
      <section
        style={{
          padding: '72px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'flex-start',
        }}
      >
        <Profile dadosGerais={dadosGerais} nameWeight={700} />

        <RenderHtml data-editable="title" html={data.title || ''} style={{
            fontWeight: 700,
            fontSize: '56px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '88%',
            textAlign: 'left',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
          }} />
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

const Template5: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideContent;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template5;
