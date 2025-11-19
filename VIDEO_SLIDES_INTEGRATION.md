# Integração de Slides com Vídeo

## Visão Geral

O serviço de download de slides agora suporta **slides com vídeo** além dos slides de imagem tradicionais. A detecção é automática e o sistema usa endpoints diferentes conforme o tipo de conteúdo.

## Funcionamento

### Detecção Automática

O sistema detecta automaticamente se um slide contém vídeo através da função `isVideoSlide()`:

```typescript
function isVideoSlide(html: string): boolean {
  // Verifica tag <video>
  if (/<video[^>]*>/i.test(html)) {
    return true;
  }
  
  // Verifica URLs .mp4
  if (/\.mp4/i.test(html)) {
    return true;
  }
  
  return false;
}
```

### Endpoints Utilizados

#### 1. Slides Normais (Imagem)
- **Endpoint**: `POST /html-to-png`
- **URL**: `https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-png`
- **Body**:
```json
{
  "html": "<HTML DO SLIDE>",
  "width": 1080,
  "height": 1350,
  "delay_ms": 2000
}
```
- **Resposta**: 
  - `200 OK` com `Content-Type: image/png`
  - Corpo: bytes do arquivo `.png`

#### 2. Slides com Vídeo
- **Endpoint**: `POST /html-to-mp4`
- **URL**: `https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-mp4`
- **Body**:
```json
{
  "html": "<HTML DO SLIDE>"
}
```
- **Resposta**:
  - `200 OK` com `Content-Type: video/mp4`
  - Corpo: bytes do arquivo `.mp4` original
- **Erro**:
  - Status `≥ 400` com JSON: `{ "detail": "mensagem de erro" }`

## Funções Principais

### `downloadSlidesAsPNG(slides, onProgress)`

Baixa todos os slides do carrossel, detectando automaticamente o tipo de cada slide.

```typescript
await downloadSlidesAsPNG(slides, (current, total) => {
  console.log(`Processando slide ${current}/${total}`);
});
```

**Comportamento**:
- Para cada slide:
  1. Detecta se contém vídeo
  2. Chama o endpoint apropriado (`/html-to-png` ou `/html-to-mp4`)
  3. Faz download com extensão correta (`.png` ou `.mp4`)
  4. Aguarda 500ms entre downloads

### `downloadSingleSlideAsPNG(html, slideNumber)`

Baixa um único slide, detectando automaticamente o tipo.

```typescript
await downloadSingleSlideAsPNG(htmlContent, 1);
```

## Tratamento de Erros

### Slides com Vídeo

O sistema trata erros específicos para vídeos:

```typescript
if (!response.ok) {
  let errorMessage = `Rendering API error: ${response.statusText}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch {
    // Se JSON parsing falhar, usa status text
  }
  throw new Error(errorMessage);
}
```

Mensagens de erro incluem:
- Número do slide
- Mensagem detalhada do servidor
- Exemplo: `"Erro ao baixar slide 2: Vídeo não encontrado no HTML"`

### Validação de Content-Type

O sistema valida o tipo de conteúdo retornado:

```typescript
const contentType = response.headers.get('content-type');
if (contentType && !contentType.includes('video/mp4')) {
  console.warn(`⚠️ Expected video/mp4, got ${contentType}`);
}
```

## Logs e Debug

O sistema fornece logs detalhados no console:

### Para Slides de Imagem:
```
🎨 Starting download of 3 slides

📄 Processing slide 1/3
🖼️ Rendering slide to PNG...
✅ Downloaded: slide_01.png
```

### Para Slides de Vídeo:
```
📄 Processing slide 2/3
🎥 Rendering video slide to MP4...
✅ Downloaded: slide_02.mp4
```

### Logs de Erro:
```
❌ Error processing slide 2: Erro ao baixar vídeo do slide 2: Vídeo não encontrado
```

## Exemplo de Uso

### Cenário: Carrossel Misto (Imagens + Vídeos)

```typescript
import { downloadSlidesAsPNG } from './services/carousel/download.service';

const slides = [
  '<div>Slide 1 com imagem</div>',
  '<div><video src="https://example.com/video.mp4"></video></div>',
  '<div>Slide 3 com imagem</div>',
];

try {
  await downloadSlidesAsPNG(slides, (current, total) => {
    updateProgressBar(current / total * 100);
  });
  console.log('Todos os slides baixados com sucesso!');
} catch (error) {
  console.error('Erro ao baixar slides:', error.message);
  showErrorToUser(error.message);
}
```

**Resultado**:
- `slide_01.png` (imagem)
- `slide_02.mp4` (vídeo)
- `slide_03.png` (imagem)

## Estrutura de Dados

### Exemplo de Slide com Vídeo

```typescript
{
  "title": "Título do Slide",
  "subtitle": "Subtítulo do Slide",
  "imagem_fundo": "https://cloudinary.com/.../video.mp4",
  "thumbnail_url": "https://cloudinary.com/.../thumbnail.jpg"
}
```

**Observações**:
- `imagem_fundo` com extensão `.mp4` indica slide de vídeo
- `thumbnail_url` é usado apenas para preview (não afeta o download)

## Compatibilidade

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Requisitos
- Suporte a `fetch` API
- Suporte a `Blob` e `URL.createObjectURL`
- JavaScript habilitado

## Performance

### Otimizações Implementadas
1. **Delay entre downloads**: 500ms para evitar sobrecarga do servidor
2. **Streaming de blobs**: Usa `response.blob()` para memória eficiente
3. **Cleanup automático**: `URL.revokeObjectURL()` após download

### Considerações
- Vídeos podem ser arquivos grandes (10-50 MB)
- O tempo de download depende da conexão do usuário
- O servidor processa o HTML e retorna o vídeo original

## Próximos Passos

### Melhorias Futuras
1. [ ] Suporte a outros formatos de vídeo (webm, mov)
2. [ ] Download paralelo com controle de concorrência
3. [ ] Compressão de vídeos no servidor
4. [ ] Preview antes do download
5. [ ] Escolha de qualidade/resolução

### Testes Necessários
- [ ] Teste com múltiplos vídeos em sequência
- [ ] Teste com vídeos grandes (>50 MB)
- [ ] Teste de erro com vídeo inválido
- [ ] Teste de timeout em conexões lentas
- [ ] Teste cross-browser

## Suporte

Para problemas ou dúvidas sobre a integração de vídeos:
1. Verificar os logs do console para erros detalhados
2. Confirmar que o HTML contém uma tag `<video>` ou URL `.mp4`
3. Validar que o endpoint `/html-to-mp4` está respondendo corretamente
4. Verificar permissões CORS se necessário
