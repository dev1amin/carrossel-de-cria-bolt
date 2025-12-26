/**
 * useTemplateData - Hook para gerenciar dados do template
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import type { CarouselData } from '../../../../../types/carousel';
import { AVAILABLE_TEMPLATES, TEMPLATE_DIMENSIONS } from '../../../../../types/carousel';
import { templateService, templateRenderer } from '../../../../../services/carousel';
import { getGeneratedContent, getGeneratedContentById } from '../../../../../services/generatedContent';

export const useTemplateData = (carouselData: CarouselData, generatedContentId?: number) => {
  const [freshCarouselData, setFreshCarouselData] = useState<CarouselData | null>(null);
  const [contentId, setContentId] = useState<number | undefined>(generatedContentId);
  const hasFetchedRef = useRef(false);

  // Normaliza conteudos com id e layoutIndex (SEMPRE)
  const normalizeConteudos = (conteudos: any[]) =>
    (conteudos || []).map((c: any, i: number) => ({
      ...c,
      id:
        c.id ??
        (globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      layoutIndex: c.layoutIndex ?? i,
    }));

  // === MIGRAÇÃO DE FORMATO ===
  const migratedData = useMemo(() => {
    const data = carouselData as any;

    if (data.conteudos && Array.isArray(data.conteudos)) {
      const conteudos = normalizeConteudos(data.conteudos);
      return {
        ...carouselData,
        conteudos,
      };
    }

    if (data.slides && Array.isArray(data.slides)) {
      console.log('🔄 Migrando carouselData.slides para data.conteudos');

      const conteudos = normalizeConteudos(data.slides);
      return {
        ...carouselData,
        conteudos,
      };
    }

    return null;
  }, [carouselData]);

  // Usa dados frescos se disponíveis
  const activeData = freshCarouselData || migratedData;

  // === TEMPLATE CONFIG ===
  const templateId = useMemo(() => {
    return (activeData as any)?.dados_gerais?.template || '1';
  }, [activeData]);

  const templateCompatibility = useMemo(() => {
    const template = AVAILABLE_TEMPLATES.find((t) => t.id === templateId);
    return (template?.compatibility || 'video-image') as 'video-image' | 'image-only';
  }, [templateId]);

  const templateDimensions = useMemo(() => {
    return TEMPLATE_DIMENSIONS[templateId] || { width: 1080, height: 1350 };
  }, [templateId]);

  const isReactTemplate = useMemo(() => {
    return templateService.isReactTemplate(templateId);
  }, [templateId]);

  // Atualiza compatibilidade do renderer
  useEffect(() => {
    templateRenderer.setTemplateCompatibility(templateCompatibility);
  }, [templateCompatibility]);

  // === BUSCA DADOS ATUALIZADOS DA API ===
  useEffect(() => {
    const fetchFreshData = async () => {
      const idToFetch = generatedContentId || contentId;

      if (!idToFetch || hasFetchedRef.current) return;

      hasFetchedRef.current = true;

      try {
        console.log('🔄 Buscando dados atualizados do carrossel...', { idToFetch });
        const response = await getGeneratedContentById(idToFetch);

        if (response.success && response.data?.result) {
          const apiData = response.data.result as any;

          if (apiData.conteudos && apiData.dados_gerais) {
            console.log('✅ Dados atualizados recebidos da API');

            const updatedCarouselData = {
              conteudos: normalizeConteudos(apiData.conteudos), // <-- FIX CRÍTICO
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
            } as CarouselData;

            setFreshCarouselData(updatedCarouselData);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados atualizados:', error);
      }
    };

    fetchFreshData();
  }, [generatedContentId, contentId]);

  // === BUSCA CONTENT ID SE NÃO TIVER ===
  useEffect(() => {
    if (contentId) return;

    const firstTitle = (migratedData as any)?.conteudos?.[0]?.title;
    if (!firstTitle) return;

    const fetchContentId = async () => {
      try {
        const response = await getGeneratedContent({ limit: 100 });
        const matchingContent = response.data?.find((content: any) => {
          try {
            const result =
              typeof content.result === 'string' ? JSON.parse(content.result) : content.result;
            return result?.conteudos?.[0]?.title === firstTitle;
          } catch {
            return false;
          }
        });

        if (matchingContent) {
          setContentId(matchingContent.id);
          console.log('✅ Content ID encontrado:', matchingContent.id);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar contentId:', error);
      }
    };

    fetchContentId();
  }, [contentId, migratedData]);

  return {
    migratedData,
    activeData: activeData!,
    templateId,
    templateCompatibility,
    templateDimensions,
    isReactTemplate,
    contentId,
    isValidData: !!activeData && Array.isArray((activeData as any).conteudos),
  };
};