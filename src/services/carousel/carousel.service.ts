import { getCarouselConfig } from '../../config/carousel';
import { CarouselResponse } from '../../types/carousel';
import type { GenerationOptions } from '../../components/carousel/TemplateSelectionModal';

interface GenerateCarouselParams {
  code: string;
  template?: string;
  jwt_token?: string;
  post_id?: number;
  news_data?: {
    id: string;
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    country: string;
    lang: string;
    niche: string;
    type: 'news';
  };
  // New generation options
  content_type?: string;
  screen_count?: number;
  description_length?: string;
  dimension?: string;
  has_cta?: boolean;
  cta_type?: string;
  cta_intention?: string;
  context?: string; // Contexto/brisa do usuário
  multiple_links?: string[]; // Links adicionais para geração com múltiplos itens
  multifont?: boolean; // Indica geração com múltiplas fontes
}

export async function generateCarousel(
  code: string, 
  templateId?: string, 
  jwtToken?: string, 
  postId?: number,
  newsData?: GenerateCarouselParams['news_data'],
  generationOptions?: GenerationOptions
): Promise<CarouselResponse[]> {
  const config = getCarouselConfig();
  const webhookUrl = config.webhook.generateCarousel;

  const requestBody: GenerateCarouselParams = { code };
  
  if (templateId) {
    requestBody.template = templateId;
  }
  
  if (jwtToken) {
    requestBody.jwt_token = jwtToken;
  }
  
  if (postId !== undefined) {
    requestBody.post_id = postId;
  }

  if (newsData) {
    requestBody.news_data = newsData;
  }

  // Add generation options if provided
  if (generationOptions) {
    console.log('📋 Generation options received:', generationOptions);
    requestBody.content_type = generationOptions.contentType;
    requestBody.screen_count = generationOptions.screenCount;
    requestBody.description_length = generationOptions.descriptionLength;
    requestBody.dimension = generationOptions.dimension;
    requestBody.has_cta = generationOptions.hasCTA;
    
    if (generationOptions.ctaType) {
      requestBody.cta_type = generationOptions.ctaType;
    }
    
    if (generationOptions.ctaIntention) {
      requestBody.cta_intention = generationOptions.ctaIntention;
    }

    if (generationOptions.context) {
      requestBody.context = generationOptions.context;
    }

    if (generationOptions.multipleLinks && generationOptions.multipleLinks.length > 0) {
      requestBody.multiple_links = generationOptions.multipleLinks;
    }

    if (generationOptions.multifont) {
      requestBody.multifont = true;
    }
  } else {
    console.log('⚠️ No generation options provided');
  }

  console.log('📤 generateCarousel request:', requestBody);
  console.log('📤 Full request body JSON:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 generateCarousel response:', data);
    return data;
  } catch (error) {
    console.error('Error generating carousel:', error);
    throw error;
  }
}

export async function searchImages(keyword: string): Promise<string[]> {
  const config = getCarouselConfig();
  const webhookUrl = config.webhook.searchImages;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    if (!response.ok) {
      throw new Error('Failed to search images');
    }

    const data = await response.json();
    if (data) {
      const imageUrls = [
        data.imagem_fundo,
        data.imagem_fundo2,
        data.imagem_fundo3,
        data.imagem_fundo4,
        data.imagem_fundo5,
        data.imagem_fundo6,
      ].filter(Boolean);
      return imageUrls;
    }
    return [];
  } catch (error) {
    console.error('Error searching images:', error);
    throw error;
  }
}
