/**
 * Template 7 - Versão React (sem iframes)
 * Estilo Twitter Dark Mode
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fonte: Roboto (400, 700), Ubuntu (400)
 * - Dimensões: 1170x1560px
 * - Background: #000000
 * - 10 slides:
 *   - Slides 1-6: Com imagem (tweet-image)
 *   - Slides 7-8: Sem imagem (text only)
 *   - Slides 9-10: Com imagem
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Ubuntu:wght@400&display=swap');`;

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
    width: '1170px',
    height: '1560px',
    backgroundColor: '#000000',
    color: '#E7E9EA',
    fontFamily: '"Roboto", Arial, sans-serif',
    padding: '60px',
    paddingBottom: '80px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    gap: '40px',
    boxSizing: 'border-box' as const,
    WebkitFontSmoothing: 'antialiased' as const,
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  },
};

// Header com avatar, nome e handle
const Header: React.FC<{ dadosGerais?: DadosGerais }> = ({ dadosGerais }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      {dadosGerais?.foto_perfil && !avatarError && (
        <img
          data-editable="image"
          src={dadosGerais.foto_perfil}
          alt="Avatar"
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            objectFit: 'cover',
            flex: '0 0 auto',
          }}
          onError={() => setAvatarError(true)}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <div
          data-editable="nome"
          style={{
            fontWeight: 700,
            fontSize: '45px',
            color: '#E7E9EA',
            fontFamily: '"Roboto", sans-serif',
          }}
        >
          {dadosGerais?.nome}
        </div>
        <div
          data-editable="arroba"
          style={{
            fontFamily: '"Ubuntu", sans-serif',
            fontWeight: 400,
            fontSize: '45px',
            color: '#71767B',
          }}
        >
          @{dadosGerais?.arroba?.replace('@', '')}
        </div>
      </div>
    </div>
  );
};

// Tweet text section
const TweetText: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => (
  <section
    style={{
      fontSize: '51px',
      lineHeight: 1.38,
      fontWeight: 400,
      color: '#E7E9EA',
    }}
  >
    {title && <RenderHtml data-editable="title" html={title} as="p" style={{ marginBottom: '20px' }} />}
    {subtitle && <RenderHtml data-editable="subtitle" html={subtitle} as="p" style={{ marginBottom: '20px' }} />}
  </section>
);

/**
 * Slide COM imagem
 */
export const SlideWithImage: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={baseStyles.slide}>
      <style>{FONT_IMPORT}</style>

      <Header dadosGerais={dadosGerais} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TweetText title={data.title} subtitle={data.subtitle} />

        {data.imagem_fundo && !imgError && (
          <img
            data-editable="image"
            src={data.imagem_fundo}
            alt=""
            style={{
              width: '100%',
              height: '600px',
              background: '#D9D9D9',
              borderRadius: '38px',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Slide SEM imagem (text only)
 */
export const SlideTextOnly: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        ...baseStyles.slide,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{FONT_IMPORT}</style>

      <Header dadosGerais={dadosGerais} />

      <section
        style={{
          fontSize: '51px',
          lineHeight: 1.38,
          fontWeight: 400,
          color: '#E7E9EA',
          marginTop: '20px',
        }}
      >
        {data.title && <RenderHtml data-editable="title" html={data.title} as="p" style={{ marginBottom: '20px' }} />}
        {data.subtitle && <RenderHtml data-editable="subtitle" html={data.subtitle} as="p" style={{ marginBottom: '20px' }} />}
      </section>
    </div>
  );
};

export const SLIDE_COMPONENTS = [
  SlideWithImage, // 0
  SlideWithImage, // 1
  SlideWithImage, // 2
  SlideWithImage, // 3
  SlideWithImage, // 4
  SlideWithImage, // 5
  SlideTextOnly,  // 6
  SlideTextOnly,  // 7
  SlideWithImage, // 8
  SlideWithImage, // 9
  SlideWithImage, // 10
  SlideTextOnly,  // 11
  SlideWithImage, // 12
  SlideTextOnly,  // 13
  SlideWithImage, // 14
];

const Template7: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideWithImage;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template7;
