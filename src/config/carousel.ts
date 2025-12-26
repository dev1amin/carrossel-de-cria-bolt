export interface CarouselConfig {
  webhook: {
    generateCarousel: string;
    searchImages: string;
  };
}

const defaultConfig: CarouselConfig = {
  webhook: {
    generateCarousel: 'https://api.workez.online/webhook/generateCarousel',
    searchImages: 'https://api.workez.online/webhook/searchImages',
  },
};

let currentConfig: CarouselConfig = { ...defaultConfig };

export const configureCarousel = (config: Partial<CarouselConfig>): void => {
  currentConfig = {
    webhook: { ...currentConfig.webhook, ...config.webhook },
  };
};

export const getCarouselConfig = (): CarouselConfig => currentConfig;

export const resetCarouselConfig = (): void => {
  currentConfig = { ...defaultConfig };
};
