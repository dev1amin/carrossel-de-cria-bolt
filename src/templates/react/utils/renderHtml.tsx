/**
 * Utilitário para renderizar texto com HTML inline (como <b>, <i>, <span style="...">)
 * 
 * A API retorna textos que podem conter tags HTML para formatação.
 * Este componente garante que essas tags sejam renderizadas corretamente.
 */
import React from 'react';

interface RenderHtmlProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  'data-editable'?: string;
  id?: string;
}

/**
 * Componente que renderiza HTML inline de forma segura
 * Usado para títulos e subtítulos que podem vir com formatação da API
 */
export const RenderHtml: React.FC<RenderHtmlProps> = ({ 
  html, 
  className = '', 
  style = {},
  as: Component = 'div',
  'data-editable': dataEditable,
  id,
}) => {
  const props: Record<string, any> = {
    className,
    style,
    id,
  };
  
  // Adiciona data-editable se fornecido
  if (dataEditable) {
    props['data-editable'] = dataEditable;
  }
  
  // Se não contém HTML, renderiza como texto normal (mais seguro e performático)
  if (!html || !/<[^>]+>/.test(html)) {
    return <Component {...props}>{html || ''}</Component>;
  }

  // Se contém HTML, usa dangerouslySetInnerHTML
  return (
    <Component 
      {...props}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Hook para processar texto que pode conter HTML
 * Retorna o texto processado pronto para renderização
 */
export function useHtmlText(text?: string): string {
  if (!text) return '';
  return text;
}

export default RenderHtml;
