/**
 * Template 6 - Versão React (sem iframes)
 * 
 * ESPECIFICAÇÕES EXATAS DO HTML ORIGINAL:
 * - Fonte: Montserrat (400, 600, 700)
 * - Dimensões: 1080x1350px
 * - Slide 1: Foto com gradient + profile + título centralizado
 * - Slides 2-7: Fundo #F1F1F1, título 67px + subtitle 42px + imagem 450px + footer
 * - Slide 8: Igual mas SEM imagem
 * - Slide 9: Fundo #101010 escuro, SEM imagem
 * - Slide 10: Fundo #101010, imagem ANTES do texto, subtitle amarelo #FFCC00, footer centralizado
 */
import React, { useState } from 'react';
import { RenderHtml } from '../utils/renderHtml';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');`;

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

// Componente de Profile reutilizável
const Profile: React.FC<{ 
  dadosGerais?: DadosGerais; 
  avatarSize?: number;
  nameColor?: string;
  handleColor?: string;
}> = ({ dadosGerais, avatarSize = 64, nameColor = '#8D8D8D', handleColor = '#8D8D8D' }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
      {dadosGerais?.foto_perfil && !avatarError && (
        <img
          data-editable="image"
          src={dadosGerais.foto_perfil}
          alt="Avatar"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: '50%',
            border: '3px solid #1ACD8A',
            objectFit: 'cover',
            flex: '0 0 auto',
          }}
          onError={() => setAvatarError(true)}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {dadosGerais?.nome && (
          <div data-editable="nome" style={{ fontWeight: 700, fontSize: '24px', lineHeight: 1.2, color: nameColor }}>
            {dadosGerais.nome}
          </div>
        )}
        {dadosGerais?.arroba && (
          <div data-editable="arroba" style={{ fontWeight: 600, fontSize: '18px', color: handleColor }}>
            @{dadosGerais.arroba.replace('@', '')}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Top Labels
const TopLabels: React.FC<{ arroba?: string; color?: string }> = ({ arroba, color = '#848484' }) => (
  <>
    <div data-editable="arroba" style={{ position: 'absolute', top: '36px', left: '60px', color, fontWeight: 600, fontSize: '18px' }}>
      @{arroba?.replace('@', '')}
    </div>
    <div style={{ position: 'absolute', top: '36px', right: '60px', color, fontWeight: 700, fontSize: '18px' }}>
      Copyright ©
    </div>
  </>
);

// Footer com profile e "Arrasta para o lado"
const Footer: React.FC<{ dadosGerais?: DadosGerais }> = ({ dadosGerais }) => (
  <div
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '36px 60px',
    }}
  >
    <Profile dadosGerais={dadosGerais} />
    <div style={{ color: '#848484', fontWeight: 600, fontSize: '18px' }}>Arrasta para o lado &gt;</div>
  </div>
);

/**
 * Slide 1 - Cover: Foto com gradient + profile centralizado + título
 */
export const Slide1Cover: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
        color: '#fff',
        fontFamily: '"Montserrat", Arial, sans-serif',
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Background com gradient */}
      <div
        data-editable="background"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to top, rgba(0, 0, 0, .92) 0%, rgba(0, 0, 0, .62) 40%, rgba(0, 0, 0, 0) 60%),
            url("${data.imagem_fundo || ''}")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Top labels */}
      <div data-editable="arroba" style={{ position: 'absolute', top: '36px', left: '60px', color: '#fff', fontWeight: 600, fontSize: '18px' }}>
        @{dadosGerais?.arroba?.replace('@', '')}
      </div>
      <div style={{ position: 'absolute', top: '36px', right: '60px', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
        Copyright ©
      </div>

      {/* Conteúdo centralizado embaixo */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '72px 48px',
          gap: '18px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
          {dadosGerais?.foto_perfil && (
            <img
              data-editable="image"
              src={dadosGerais.foto_perfil}
              alt="Avatar"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '3px solid #1ACD8A',
                objectFit: 'cover',
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div data-editable="nome" style={{ fontWeight: 700, fontSize: '22px', lineHeight: 1.2, color: '#fff' }}>
              {dadosGerais?.nome}
            </div>
            <div data-editable="arroba" style={{ fontWeight: 600, fontSize: '18px', color: '#fff', opacity: 0.95 }}>
              @{dadosGerais?.arroba?.replace('@', '')}
            </div>
          </div>
        </div>

        <RenderHtml data-editable="title" html={data.title || ''} style={{
            fontWeight: 700,
            fontSize: '60px',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: 'min(880px, 90%)',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            textAlign: 'center',
          }} />
      </section>
    </div>
  );
};

/**
 * Slides 2-7 - Fundo claro com imagem
 */
export const SlideLight: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        background: '#F1F1F1',
        color: '#37474F',
        fontFamily: '"Montserrat", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Top labels */}
      <TopLabels arroba={dadosGerais?.arroba} />

      {/* Content */}
      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '120px 60px 60px',
          gap: '28px',
          justifyContent: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <RenderHtml data-editable="title" html={data.title || ''} style={{
                fontWeight: 700,
                fontSize: '67px',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                maxWidth: '88%',
                textAlign: 'left',
                color: '#37474F',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }} />
            <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={{
                fontWeight: 400,
                fontSize: '42px',
                lineHeight: 1.22,
                color: '#37474F',
                maxWidth: '88%',
                textAlign: 'left',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                marginBottom: '30px',
              }} />
          </div>

          {/* Imagem */}
          {data.imagem_fundo && !imgError && (
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
                boxShadow: '0 16px 48px rgba(0, 0, 0, .18)',
              }}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer dadosGerais={dadosGerais} />
    </div>
  );
};

/**
 * Slide 8 - Fundo claro SEM imagem
 */
export const SlideNoImage: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        background: '#F1F1F1',
        color: '#37474F',
        fontFamily: '"Montserrat", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{FONT_IMPORT}</style>

      <TopLabels arroba={dadosGerais?.arroba} />

      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '120px 60px 60px',
          gap: '28px',
          justifyContent: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <RenderHtml data-editable="title" html={data.title || ''} style={{
                fontWeight: 700,
                fontSize: '67px',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                maxWidth: '88%',
                textAlign: 'left',
                color: '#37474F',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }} />
            <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={{
                fontWeight: 400,
                fontSize: '42px',
                lineHeight: 1.22,
                color: '#37474F',
                maxWidth: '88%',
                textAlign: 'left',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                marginBottom: '30px',
              }} />
          </div>
        </div>
      </section>

      <Footer dadosGerais={dadosGerais} />
    </div>
  );
};

/**
 * Slide 9 - Fundo escuro #101010 SEM imagem
 */
export const SlideDark: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        background: '#101010',
        color: '#F1F1F1',
        fontFamily: '"Montserrat", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{FONT_IMPORT}</style>

      <TopLabels arroba={dadosGerais?.arroba} />

      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '120px 60px 60px',
          gap: '28px',
          justifyContent: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <RenderHtml data-editable="title" html={data.title || ''} style={{
                fontWeight: 700,
                fontSize: '67px',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                maxWidth: '88%',
                textAlign: 'left',
                color: '#F1F1F1',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }} />
            <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={{
                fontWeight: 400,
                fontSize: '42px',
                lineHeight: 1.22,
                color: '#CBCBCB',
                maxWidth: '88%',
                textAlign: 'left',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                marginBottom: '30px',
              }} />
          </div>
        </div>
      </section>

      {/* Footer escuro */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '36px 60px',
        }}
      >
        <Profile dadosGerais={dadosGerais} />
        <div style={{ color: '#848484', fontWeight: 600, fontSize: '18px' }}>Arrasta para o lado &gt;</div>
      </div>
    </div>
  );
};

/**
 * Slide 10 - Fundo escuro com imagem ANTES do texto, subtitle amarelo
 */
export const Slide10CTA: React.FC<SlideProps> = ({ data, dadosGerais }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: '1080px',
        height: '1350px',
        background: '#101010',
        color: '#F1F1F1',
        fontFamily: '"Montserrat", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{FONT_IMPORT}</style>

      <TopLabels arroba={dadosGerais?.arroba} />

      {/* Centro vertical - imagem primeiro, depois texto */}
      <section
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 60px 60px',
          paddingBottom: 0,
          gap: '28px',
        }}
      >
        <div>
          {/* Imagem primeiro */}
          {data.imagem_fundo && !imgError && (
            <img
              data-editable="image"
              src={data.imagem_fundo}
              alt=""
              style={{
                width: '100%',
                height: '450px',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '28px',
                display: 'block',
                boxShadow: '0 18px 50px rgba(0, 0, 0, .35)',
                marginBottom: '30px',
              }}
              onError={() => setImgError(true)}
            />
          )}

          {/* Texto depois */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <RenderHtml data-editable="title" html={data.title || ''} style={{
                fontWeight: 700,
                fontSize: '67px',
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                maxWidth: '88%',
                textAlign: 'left',
                color: '#F1F1F1',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }} />
            <RenderHtml data-editable="subtitle" html={data.subtitle || ''} style={{
                fontWeight: 600,
                fontSize: '42px',
                lineHeight: 1.22,
                color: '#FFCC00',
                maxWidth: '88%',
                textAlign: 'left',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                marginBottom: '30px',
              }} />
          </div>
        </div>
      </section>

      {/* Footer centralizado */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: '36px',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
          {dadosGerais?.foto_perfil && (
            <img
              data-editable="image"
              src={dadosGerais.foto_perfil}
              alt="Avatar"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '3px solid #1ACD8A',
                objectFit: 'cover',
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div data-editable="nome" style={{ fontWeight: 700, fontSize: '22px', lineHeight: 1.2, color: '#8D8D8D' }}>
              {dadosGerais?.nome}
            </div>
            <div data-editable="arroba" style={{ fontWeight: 600, fontSize: '18px', color: '#8D8D8D', opacity: 0.95 }}>
              @{dadosGerais?.arroba?.replace('@', '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SLIDE_COMPONENTS = [
  Slide1Cover,   // 0
  SlideLight,    // 1
  SlideLight,    // 2
  SlideLight,    // 3
  SlideLight,    // 4
  SlideLight,    // 5
  SlideLight,    // 6
  SlideNoImage,  // 7
  SlideDark,     // 8
  Slide10CTA,    // 9
];

const Template6: React.FC<{ slideIndex: number; data: SlideData; dadosGerais?: DadosGerais }> = ({
  slideIndex,
  data,
  dadosGerais,
}) => {
  const SlideComponent = SLIDE_COMPONENTS[slideIndex] || SlideLight;
  return <SlideComponent data={data} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
};

export default Template6;
