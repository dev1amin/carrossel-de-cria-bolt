/**
 * useImageManager - Hook para gerenciar imagens (upload, busca, alteração)
 */

import { useCallback, useRef } from 'react';
import type { EditorState, EditorRefs } from '../types';
import type { EditorDispatch } from './useEditorState';
import { searchImages } from '../../../../../services/carousel';

interface UseImageManagerProps {
  state: EditorState;
  dispatch: EditorDispatch;
  refs: EditorRefs;
  templateData: {
    templateCompatibility: 'video-image' | 'image-only';
    activeData: any;
  };
  addToast: (message: string, type: 'success' | 'error') => void;
}

export const useImageManager = ({
  state,
  dispatch,
  refs,
  templateData,
  addToast,
}: UseImageManagerProps) => {
  const { searchKeyword } = state;
  const { iframeRefs } = refs;
  const { activeData } = templateData;
  
  const lastSearchIdRef = useRef(0);
  
  // === SETTERS ===
  const setSearchKeyword = useCallback((keyword: string) => {
    dispatch({ type: 'SET_SEARCH_KEYWORD', payload: keyword });
  }, [dispatch]);
  
  // === BUSCA DE IMAGENS ===
  const handleSearchImages = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    
    dispatch({ type: 'SET_IS_SEARCHING', payload: true });
    const searchId = ++lastSearchIdRef.current;
    
    try {
      const imageUrls = await searchImages(searchKeyword);
      
      if (searchId === lastSearchIdRef.current) {
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: imageUrls });
      }
    } catch (error) {
      console.error('Erro na busca de imagens:', error);
      addToast('Erro ao buscar imagens', 'error');
    } finally {
      if (searchId === lastSearchIdRef.current) {
        dispatch({ type: 'SET_IS_SEARCHING', payload: false });
      }
    }
  }, [searchKeyword, dispatch, addToast]);
  
  // === ALTERAÇÃO DE IMAGEM DE FUNDO ===
  const handleBackgroundImageChange = useCallback((slideIndex: number, imageUrl: string, preserveGradient: boolean = true) => {
    console.log('🖼️ handleBackgroundImageChange:', { slideIndex, imageUrl });
    
    // Atualiza no editedContent
    dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: `${slideIndex}-background`, value: imageUrl } });
    
    // Atualiza no activeData - preserva estilos existentes
    if (activeData?.conteudos?.[slideIndex]) {
      const currentBg = activeData.conteudos[slideIndex].imagem_fundo || '';
      
      if (preserveGradient && typeof currentBg === 'string' && currentBg.includes('linear-gradient')) {
        // Extrai o gradiente e adiciona a nova URL
        const gradientMatch = currentBg.match(/linear-gradient\([^)]+\)/);
        if (gradientMatch) {
          activeData.conteudos[slideIndex].imagem_fundo = `${gradientMatch[0]}, url(${imageUrl})`;
        } else {
          activeData.conteudos[slideIndex].imagem_fundo = imageUrl;
        }
      } else {
        activeData.conteudos[slideIndex].imagem_fundo = imageUrl;
      }
    }
    
    addToast('Imagem atualizada!', 'success');
  }, [dispatch, activeData, addToast]);
  
  // === UPLOAD DE IMAGEM ===
  const handleImageUpload = useCallback((
    slideIndex: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      dispatch({ type: 'UPDATE_UPLOADED_IMAGE', payload: { index: slideIndex, url } });
      handleBackgroundImageChange(slideIndex, url);
    };
    reader.readAsDataURL(file);
  }, [dispatch, handleBackgroundImageChange]);
  
  // === UPLOAD DE AVATAR (Global - aplica em todos os slides) ===
  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      
      // Atualiza foto_perfil nos dados_gerais (global)
      if (activeData?.dados_gerais) {
        activeData.dados_gerais.foto_perfil = url;
      }
      
      // Atualiza no editedContent para persistir
      dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: 'global-avatar_url', value: url } });
      
      addToast('Avatar atualizado em todos os slides!', 'success');
    };
    reader.readAsDataURL(file);
  }, [dispatch, activeData, addToast]);
  
  // === GERAÇÃO DE IMAGEM COM IA ===
  const handleGenerateAIImage = useCallback((slideIndex: number, _prompt?: string) => {
    // Por enquanto, apenas simula a geração
    addToast(`Gerando imagem para slide ${slideIndex + 1}...`, 'success');
    
    setTimeout(() => {
      addToast('Imagem gerada com sucesso!', 'success');
    }, 3000);
  }, [addToast]);
  
  return {
    // State
    searchKeyword,
    
    // Setters
    setSearchKeyword,
    
    // Actions
    handleSearchImages,
    handleBackgroundImageChange,
    handleImageUpload,
    handleAvatarUpload,
    handleGenerateAIImage,
  };
};
