/**
 * Templates React - Export central
 * 
 * Templates disponíveis:
 * - Template 1: Estilo Instagram com foto grande
 * - Template 2: Footer branco com chips azuis
 * - Template 3: Anton SC em fundo preto
 * - Template 4: Fundo roxo (#6750A4)
 * - Template 5: Fundo claro (#F1F1F1) com botão verde
 * - Template 6: Mix de fundos claro/escuro
 * - Template 7: Twitter Dark Mode (1170x1560)
 * - Template 8: Twitter Light Mode (1170x1560)
 */
export { ReactSlideRenderer, getTemplateDimensions } from './ReactSlideRenderer';
export type { EditableElementType } from './ReactSlideRenderer';

// Template 1
export { 
  renderTemplate1Slide, 
  renderAllTemplate1Slides 
} from './template1';

// Template 2
export { default as Template2, SLIDE_COMPONENTS as Template2Components } from './template2';

// Template 3
export { default as Template3, SLIDE_COMPONENTS as Template3Components } from './template3';

// Template 4
export { default as Template4, SLIDE_COMPONENTS as Template4Components } from './template4';

// Template 5
export { default as Template5, SLIDE_COMPONENTS as Template5Components } from './template5';

// Template 6
export { default as Template6, SLIDE_COMPONENTS as Template6Components } from './template6';

// Template 7
export { default as Template7, SLIDE_COMPONENTS as Template7Components } from './template7';

// Template 8
export { default as Template8, SLIDE_COMPONENTS as Template8Components } from './template8';
