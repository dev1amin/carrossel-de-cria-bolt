# Carousel Editor v2 - Arquitetura Modular

## Funcionalidades Identificadas no Editor Atual (NewCarouselViewer.tsx ~3000 linhas)

### 1. **Gerenciamento de Estado**
- Zoom e pan do canvas
- Slide focado / selecionado
- Elemento selecionado (title, subtitle, nome, arroba, image, background, avatar)
- Conteúdo editado (texto, imagens)
- Estilos dos elementos (fontSize, fontWeight, color, textAlign, etc)
- Estados de UI (batchMode, minimized panels, modals)

### 2. **Renderização de Slides**
- Templates HTML (via iframe)
- Templates React (via ReactSlideRenderer)
- Templates baseados em blocos (BlocksCanvas)
- Injeção de IDs editáveis no HTML
- Processamento de vídeos

### 3. **Edição de Conteúdo**
- Edição inline de texto (title, subtitle, nome, arroba)
- Formatação de texto (bold, italic, underline, strikethrough)
- Toolbar flutuante para formatação
- Alteração de imagens de fundo
- Alteração de avatar
- Alteração de cor de fundo do slide

### 4. **Interação com Canvas**
- Pan (arrastar canvas)
- Zoom (scroll com ctrl/cmd)
- Seleção de elementos via click
- Edição via double-click
- Centralização automática

### 5. **Gerenciamento de Slides**
- Adicionar slide (clonar)
- Deletar slide
- Modo batch (selecionar múltiplos)
- Navegação entre slides

### 6. **Persistência**
- Salvar alterações (API)
- Detectar mudanças não salvas
- Carregar dados atualizados da API
- Aviso ao sair sem salvar

### 7. **Export/Download**
- Download de slide atual (PNG)
- Download de todos os slides
- Auto-download após geração

### 8. **Busca de Imagens**
- Buscar imagens via keyword
- Upload de imagem local
- Galeria de imagens

### 9. **Configurações Globais**
- Tema light/dark
- Cor de destaque
- Badge verificado
- Escala de fonte/header

---

## Nova Arquitetura

```
viewer/v2/
├── index.ts                 # Export principal
├── CarouselEditor.tsx       # Componente principal (orquestra tudo)
├── context/
│   └── EditorContext.tsx    # Estado global do editor
├── hooks/
│   ├── useEditorState.ts    # Estado principal
│   ├── useCanvasInteraction.ts # Zoom, pan, seleção
│   ├── useTextEditor.ts     # Edição de texto inline
│   ├── useSlideManager.ts   # CRUD de slides
│   ├── useSaveExport.ts     # Salvar e exportar
│   ├── useImageSearch.ts    # Busca de imagens
│   └── useTemplateRenderer.ts # Renderização de templates
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx       # Container do canvas
│   │   ├── CanvasControls.tsx # Zoom controls
│   │   └── SlideRenderer.tsx # Renderiza slide (HTML/React/Blocks)
│   ├── Sidebar/
│   │   ├── SlidesSidebar.tsx # Lista de slides
│   │   └── SlideThumb.tsx   # Miniatura do slide
│   ├── Properties/
│   │   ├── PropertiesPanel.tsx # Painel direito
│   │   ├── TextProperties.tsx
│   │   ├── ImageProperties.tsx
│   │   ├── AvatarProperties.tsx
│   │   └── GlobalSettings.tsx
│   ├── Toolbar/
│   │   ├── EditorToolbar.tsx # Toolbar superior
│   │   └── FloatingToolbar.tsx # Toolbar de formatação
│   └── common/
│       ├── Toast.tsx
│       └── Modal.tsx
└── utils/
    ├── constants.ts
    ├── types.ts
    └── helpers.ts
```

## Benefícios da Nova Arquitetura

1. **Manutenibilidade**: Cada arquivo tem uma única responsabilidade
2. **Testabilidade**: Hooks podem ser testados isoladamente
3. **Reusabilidade**: Mobile e desktop compartilham os mesmos hooks
4. **Performance**: Separação permite memoização granular
5. **Escalabilidade**: Fácil adicionar novas funcionalidades
