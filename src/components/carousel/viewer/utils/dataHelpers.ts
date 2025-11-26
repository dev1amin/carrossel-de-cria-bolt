/**
 * Utilitários para transformação e migração de dados
 */

// import { getIframeHTML, getIframeDocument } from './iframeHelpers';

/**
 * Aplica conteúdo editado aos slides renderizados
 */
export function applyEditedContentToSlides(
  slides: string[],
  editedContent: Record<string, any>
): string[] {
  return slides.map((slideHTML, slideIndex) => {
    let updatedHTML = slideHTML;

    // Aplica todas as edições deste slide
    Object.keys(editedContent).forEach((key) => {
      const [slideIdxStr, elementId] = key.split('-');
      const slideIdx = parseInt(slideIdxStr, 10);

      if (slideIdx === slideIndex) {
        const edits = editedContent[key];

        // Aplica texto editado
        if (edits.text !== undefined) {
          const textRegex = new RegExp(
            `(<[^>]*id=["']${elementId}["'][^>]*>)(.*?)(<\\/[^>]+>)`,
            'gi'
          );
          updatedHTML = updatedHTML.replace(textRegex, `$1${edits.text}$3`);
        }

        // Aplica estilos editados
        if (edits.styles) {
          Object.entries(edits.styles).forEach(([prop, value]) => {
            const styleRegex = new RegExp(
              `(<[^>]*id=["']${elementId}["'][^>]*)style=["']([^"']*)["']`,
              'gi'
            );

            updatedHTML = updatedHTML.replace(styleRegex, (_match, before, existingStyles) => {
              const styleObj: Record<string, string> = {};

              // Parse estilos existentes
              existingStyles.split(';').forEach((style: string) => {
                const [key, val] = style.split(':').map((s: string) => s.trim());
                if (key && val) {
                  styleObj[key] = val;
                }
              });

              // Adiciona/atualiza novo estilo
              const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
              styleObj[cssProp] = value as string;

              // Reconstrói string de style
              const newStyles = Object.entries(styleObj)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');

              return `${before}style="${newStyles}"`;
            });
          });
        }

        // Aplica imagem editada
        if (edits.image) {
          // Para tags <img>
          const imgSrcRegex = new RegExp(
            `(<img[^>]*id=["']${elementId}["'][^>]*src=["'])([^"']*)`,
            'gi'
          );
          updatedHTML = updatedHTML.replace(imgSrcRegex, `$1${edits.image}`);

          // Para background-image
          const bgImgRegex = new RegExp(
            `(<[^>]*id=["']${elementId}["'][^>]*)background-image:\\s*url\\([^)]*\\)`,
            'gi'
          );
          updatedHTML = updatedHTML.replace(
            bgImgRegex,
            `$1background-image: url(${edits.image})`
          );
        }
      }
    });

    return updatedHTML;
  });
}

/**
 * Extrai dados estruturados de um slide HTML
 */
export function extractSlideData(slideHTML: string): {
  elements: Array<{ id: string; type: string; content: string; styles: Record<string, string> }>;
  metadata: { width?: number; height?: number };
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideHTML, 'text/html');

  const elements: Array<{
    id: string;
    type: string;
    content: string;
    styles: Record<string, string>;
  }> = [];

  // Extrai elementos com ID
  const elementsWithId = doc.querySelectorAll('[id]');
  elementsWithId.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const styles: Record<string, string> = {};

    // Parse styles inline
    if (htmlEl.style.cssText) {
      htmlEl.style.cssText.split(';').forEach((style) => {
        const [key, value] = style.split(':').map((s) => s.trim());
        if (key && value) {
          styles[key] = value;
        }
      });
    }

    elements.push({
      id: htmlEl.id,
      type: htmlEl.tagName.toLowerCase(),
      content: htmlEl.textContent || htmlEl.innerHTML,
      styles,
    });
  });

  // Extrai metadados (se houver)
  const metadata: { width?: number; height?: number } = {};
  const body = doc.body;
  if (body) {
    const width = body.style.width;
    const height = body.style.height;
    if (width) metadata.width = parseInt(width, 10);
    if (height) metadata.height = parseInt(height, 10);
  }

  return { elements, metadata };
}

/**
 * Converte dados estruturados para HTML de slide
 */
export function buildSlideHTML(
  elements: Array<{ id: string; type: string; content: string; styles: Record<string, string> }>,
  metadata: { width?: number; height?: number }
): string {
  const styleStr = metadata.width && metadata.height
    ? `style="width: ${metadata.width}px; height: ${metadata.height}px; position: relative; overflow: hidden;"`
    : '';

  const elementsHTML = elements
    .map((el) => {
      const stylesStr = Object.entries(el.styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

      const styleAttr = stylesStr ? `style="${stylesStr}"` : '';
      const idAttr = `id="${el.id}"`;

      return `<${el.type} ${idAttr} ${styleAttr}>${el.content}</${el.type}>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body ${styleStr}>
${elementsHTML}
</body>
</html>`;
}

/**
 * Migra slides antigos para novo formato
 */
export function migrateOldSlideFormat(oldSlide: any): string {
  if (typeof oldSlide === 'string') {
    return oldSlide; // Já está no formato correto
  }

  // Se for objeto com estrutura antiga, converte
  if (oldSlide.elements && Array.isArray(oldSlide.elements)) {
    return buildSlideHTML(oldSlide.elements, oldSlide.metadata || {});
  }

  // Fallback: retorna HTML vazio
  return '<!DOCTYPE html><html><body></body></html>';
}

/**
 * Normaliza HTML de slide (remove espaços extras, formata)
 */
export function normalizeSlideHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove comentários
  const removeComments = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
    } else {
      const children = Array.from(node.childNodes);
      children.forEach(removeComments);
    }
  };
  removeComments(doc.documentElement);

  // Serializa de volta
  return doc.documentElement.outerHTML;
}

/**
 * Valida se HTML de slide está bem formado
 */
export function validateSlideHTML(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Verifica erros de parsing
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push('HTML mal formado');
    }

    // Verifica se tem body
    if (!doc.body) {
      errors.push('Tag <body> não encontrada');
    }

    // Verifica IDs duplicados
    const ids = new Set<string>();
    const elementsWithId = doc.querySelectorAll('[id]');
    elementsWithId.forEach((el) => {
      const id = (el as HTMLElement).id;
      if (ids.has(id)) {
        errors.push(`ID duplicado: ${id}`);
      }
      ids.add(id);
    });
  } catch (error) {
    errors.push(`Erro ao validar HTML: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clona profundamente conteúdo editado
 */
export function cloneEditedContent(
  editedContent: Record<string, any>
): Record<string, any> {
  return JSON.parse(JSON.stringify(editedContent));
}

/**
 * Mescla conteúdo editado (útil para desfazer/refazer)
 */
export function mergeEditedContent(
  base: Record<string, any>,
  changes: Record<string, any>
): Record<string, any> {
  const result = { ...base };

  Object.keys(changes).forEach((key) => {
    if (changes[key] === null) {
      // Remove se valor for null
      delete result[key];
    } else {
      // Mescla profundamente
      result[key] = {
        ...(result[key] || {}),
        ...changes[key],
      };
    }
  });

  return result;
}

/**
 * Calcula diferença entre dois estados de conteúdo editado
 */
export function diffEditedContent(
  before: Record<string, any>,
  after: Record<string, any>
): Record<string, any> {
  const diff: Record<string, any> = {};

  // Encontra mudanças e adições
  Object.keys(after).forEach((key) => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = after[key];
    }
  });

  // Encontra remoções
  Object.keys(before).forEach((key) => {
    if (!(key in after)) {
      diff[key] = null;
    }
  });

  return diff;
}
