/**
 * Utility function to render blocks to HTML
 */

import type { Block, BlockSlideContent } from '../../../../types/blocks';

interface RenderOptions {
  width: number;
  height: number;
  backgroundColor?: string;
}

/**
 * Converts an array of blocks to HTML string
 */
export function renderBlocksToHtml(
  blocks: Block[],
  options: RenderOptions
): string {
  const { width, height, backgroundColor = '#ffffff' } = options;

  const blocksHtml = blocks
    .sort((a, b) => a.order - b.order)
    .map((block) => renderBlock(block))
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: ${width}px;
      height: ${height}px;
      background-color: ${backgroundColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }
    .slide-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 40px;
    }
    .block {
      width: 100%;
    }
    .text-block {
      word-wrap: break-word;
    }
    .image-block img {
      width: 100%;
      height: auto;
      display: block;
    }
    .video-block video {
      width: 100%;
      height: auto;
      display: block;
    }
    .spacer-block {
      flex-shrink: 0;
    }
    .divider-block {
      display: flex;
      justify-content: center;
      padding: 10px 0;
    }
    .divider-block hr {
      border: none;
      border-top: 1px solid #e0e0e0;
    }
    .header-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-block img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .button-block {
      display: flex;
      justify-content: center;
    }
    .button-block button {
      padding: 12px 24px;
      border: none;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="slide-container">
    ${blocksHtml || '<p style="color: #999; text-align: center;">Arraste blocos para começar</p>'}
  </div>
</body>
</html>`;
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'text':
      return `<div class="block text-block" style="
        font-size: ${block.fontSize || '16px'};
        font-weight: ${block.fontWeight || '400'};
        font-style: ${block.fontStyle || 'normal'};
        text-align: ${block.textAlign || 'left'};
        color: ${block.color || '#000000'};
        padding: ${block.padding || '8px 0'};
      ">${block.content}</div>`;

    case 'image':
      return `<div class="block image-block">
        <img 
          src="${block.src}" 
          alt="${block.alt || ''}"
          style="
            object-fit: ${block.objectFit || 'cover'};
            object-position: ${block.objectPosition || 'center'};
            width: ${block.width || '100%'};
            height: ${block.height || 'auto'};
            border-radius: ${block.borderRadius || '0'};
          "
        />
      </div>`;

    case 'video':
      return `<div class="block video-block">
        <video 
          src="${block.src}"
          ${block.poster ? `poster="${block.poster}"` : ''}
          ${block.autoplay ? 'autoplay' : ''}
          ${block.loop ? 'loop' : ''}
          ${block.muted ? 'muted' : ''}
          playsinline
          style="
            object-fit: ${block.objectFit || 'cover'};
            width: ${block.width || '100%'};
            height: ${block.height || 'auto'};
          "
        ></video>
      </div>`;

    case 'spacer':
      return `<div class="block spacer-block" style="height: ${block.height};"></div>`;

    case 'divider':
      return `<div class="block divider-block">
        <hr style="
          width: ${block.width || '100%'};
          border-top: ${block.thickness || '1px'} ${block.style || 'solid'} ${block.color || '#e0e0e0'};
        "/>
      </div>`;

    case 'header':
      return `<div class="block header-block">
        ${block.profileImage ? `<img src="${block.profileImage}" alt="Profile" />` : ''}
        <div>
          <div style="font-weight: 600; display: flex; align-items: center; gap: 4px;">
            ${block.username || 'Username'}
            ${block.showVerified ? '<span style="color: #1d9bf0;">✓</span>' : ''}
          </div>
          <div style="color: #666; font-size: 14px;">${block.handle || '@handle'}</div>
        </div>
      </div>`;

    case 'button':
      return `<div class="block button-block">
        <button style="
          background-color: ${block.backgroundColor || '#4167B2'};
          color: ${block.textColor || '#ffffff'};
          border-radius: ${block.borderRadius || '8px'};
        ">${block.text}</button>
      </div>`;

    default:
      return '';
  }
}
