/**
 * Block Types for block-based slide editor
 */

// Tipos de blocos disponíveis
export type BlockType = 'text' | 'image' | 'video' | 'spacer' | 'divider' | 'header' | 'button';

// Propriedades base de um bloco
export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

// Bloco de texto
export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  padding?: string;
}

// Bloco de imagem
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  objectPosition?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

// Bloco de vídeo
export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  width?: string;
  height?: string;
}

// Bloco de espaçador
export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: string;
}

// Bloco de divisor
export interface DividerBlock extends BaseBlock {
  type: 'divider';
  color?: string;
  thickness?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  width?: string;
}

// Bloco de cabeçalho
export interface HeaderBlock extends BaseBlock {
  type: 'header';
  profileImage?: string;
  username?: string;
  handle?: string;
  showVerified?: boolean;
}

// Bloco de botão
export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  href?: string;
}

// União de todos os tipos de blocos
export type Block = 
  | TextBlock 
  | ImageBlock 
  | VideoBlock 
  | SpacerBlock 
  | DividerBlock 
  | HeaderBlock 
  | ButtonBlock;

// Conteúdo de um slide baseado em blocos
export interface BlockSlideContent {
  layoutMode: 'blocks';
  blocks: Block[];
  backgroundColor?: string;
}

// Type guard para verificar se um conteúdo é baseado em blocos
export function isBlockSlide(conteudo: any): conteudo is BlockSlideContent {
  return conteudo && conteudo.layoutMode === 'blocks';
}
