import { authenticatedFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';

export interface FormAnswerResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    business_id: string;
    question_id: number;
    key: string;
    response: string | string[];
    created_at: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrorResponse {
  error: string;
  details?: ValidationError[];
  message?: string;
}

// Chave para salvar progresso no localStorage
const TONE_SETUP_PROGRESS_KEY = 'tone_setup_progress';
const TONE_SETUP_SUBMITTED_KEY = 'tone_setup_submitted';

// Mapeamento das questões do modal para as keys da API
export const QUESTION_KEY_MAP: Record<number, string> = {
  0: 'brand_mission',
  1: 'brand_values',
  2: 'brand_differentials',
  3: 'market_segment',
  4: 'competitive_context',
  5: 'target_audience',
  6: 'current_perception',
  7: 'emotional_benefit',
  8: 'reasons_to_believe',
  9: 'voice_attributes',
  10: 'brand_consistency',
  11: 'forbidden_topics',
  12: 'preferred_words',
  13: 'forbidden_words',
  14: 'logo_url'
};

/**
 * Salva o progresso no localStorage
 */
export function saveProgress(
  answers: Record<number, string[] | string>,
  currentStep: number
): void {
  try {
    const progress = {
      answers,
      currentStep,
      timestamp: Date.now()
    };
    localStorage.setItem(TONE_SETUP_PROGRESS_KEY, JSON.stringify(progress));
    console.log('💾 Progresso salvo no localStorage:', { currentStep, answersCount: Object.keys(answers).length });
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
  }
}

/**
 * Carrega o progresso do localStorage
 */
export function loadProgress(): {
  answers: Record<number, string[] | string>;
  currentStep: number;
} | null {
  try {
    const saved = localStorage.getItem(TONE_SETUP_PROGRESS_KEY);
    if (!saved) return null;

    const progress = JSON.parse(saved);
    console.log('📂 Progresso carregado do localStorage:', { currentStep: progress.currentStep, answersCount: Object.keys(progress.answers).length });
    return progress;
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
    return null;
  }
}

/**
 * Limpa o progresso do localStorage
 */
export function clearProgress(): void {
  localStorage.removeItem(TONE_SETUP_PROGRESS_KEY);
  console.log('🗑️ Progresso limpo do localStorage');
}

/**
 * Verifica se uma pergunta já foi enviada para a API
 */
export function isQuestionSubmitted(step: number): boolean {
  try {
    const submitted = localStorage.getItem(TONE_SETUP_SUBMITTED_KEY);
    if (!submitted) return false;
    
    const submittedSteps: number[] = JSON.parse(submitted);
    return submittedSteps.includes(step);
  } catch (error) {
    return false;
  }
}

/**
 * Marca uma pergunta como enviada
 */
export function markQuestionAsSubmitted(step: number): void {
  try {
    const submitted = localStorage.getItem(TONE_SETUP_SUBMITTED_KEY);
    const submittedSteps: number[] = submitted ? JSON.parse(submitted) : [];
    
    if (!submittedSteps.includes(step)) {
      submittedSteps.push(step);
      localStorage.setItem(TONE_SETUP_SUBMITTED_KEY, JSON.stringify(submittedSteps));
      console.log('✅ Pergunta marcada como enviada:', step);
    }
  } catch (error) {
    console.error('Erro ao marcar pergunta como enviada:', error);
  }
}

/**
 * Limpa as perguntas enviadas
 */
export function clearSubmittedQuestions(): void {
  localStorage.removeItem(TONE_SETUP_SUBMITTED_KEY);
  console.log('🗑️ Perguntas enviadas limpas');
}

/**
 * Envia uma resposta individual de formulário
 */
export async function submitFormAnswer(
  key: string,
  value: string | string[]
): Promise<FormAnswerResponse> {
  try {
    const url = `${API_BASE_URL}/business/forms/${key}`;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No access token found. Please login first.');
    }
    
    console.log(`📤 Enviando para: ${url}`);
    
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      const errorData: FormErrorResponse = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to submit form answer');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error submitting form answer for ${key}:`, error);
    throw error;
  }
}

/**
 * Envia uma resposta específica de um step (auto-save)
 */
export async function submitStepAnswer(
  step: number,
  answer: string[] | string
): Promise<{ success: boolean; error?: string }> {
  const key = QUESTION_KEY_MAP[step];
  
  if (!key) {
    console.warn(`No key mapping found for step ${step}`);
    return { success: false, error: 'Key não encontrada' };
  }

  // Perguntas que devem enviar array: 0,1,2,8,9,10
  const arrayQuestions = [0, 1, 2, 8, 9, 10];
  
  let value: string | string[];
  if (arrayQuestions.includes(step)) {
    // Para essas perguntas, enviar como array
    if (Array.isArray(answer)) {
      value = answer;
    } else if (typeof answer === 'string') {
      // Para perguntas de texto, pode ser array se tiver vírgulas
      value = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } else {
      value = answer;
    }
  } else {
    // Para outras perguntas, manter como string
    if (Array.isArray(answer)) {
      value = answer.join(', ');
    } else {
      value = answer;
    }
  }

  // Pula respostas vazias para campos opcionais (text)
  if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
    console.log(`⏭️ Pulando resposta vazia para ${key}`);
    return { success: true };
  }

  try {
    await submitFormAnswer(key, value);
    markQuestionAsSubmitted(step);
    const logValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
    console.log(`✅ Auto-save: ${key} = ${logValue.substring ? logValue.substring(0, 50) : logValue}...`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Erro ao fazer auto-save de ${key}:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Envia todas as respostas do formulário em sequência
 * Retorna objeto com sucessos e erros
 */
export async function submitAllFormAnswers(
  answers: Record<number, string[] | string>
): Promise<{
  success: boolean;
  submitted: number;
  failed: number;
  errors: Array<{ step: number; key: string; error: string }>;
}> {
  const results = {
    success: true,
    submitted: 0,
    failed: 0,
    errors: [] as Array<{ step: number; key: string; error: string }>
  };

  for (const [stepStr, answer] of Object.entries(answers)) {
    const step = parseInt(stepStr);
    const key = QUESTION_KEY_MAP[step];

    if (!key) {
      console.warn(`No key mapping found for step ${step}`);
      continue;
    }

    // Perguntas que devem enviar array: 0,1,2,8,9,10
    const arrayQuestions = [0, 1, 2, 8, 9, 10];
    
    let value: string | string[];
    if (arrayQuestions.includes(step)) {
      // Para essas perguntas, enviar como array
      if (Array.isArray(answer)) {
        value = answer;
      } else if (typeof answer === 'string') {
        // Para perguntas de texto, pode ser array se tiver vírgulas
        value = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else {
        value = answer;
      }
    } else {
      // Para outras perguntas, manter como string
      if (Array.isArray(answer)) {
        value = answer.join(', ');
      } else {
        value = answer;
      }
    }

    // Pula respostas vazias para campos opcionais (text)
    if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
      console.log(`Skipping empty answer for ${key}`);
      continue;
    }

    try {
      await submitFormAnswer(key, value);
      results.submitted++;
      const logValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
      console.log(`✅ Submitted ${key}: ${logValue.substring ? logValue.substring(0, 50) : logValue}...`);
    } catch (error) {
      results.failed++;
      results.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push({ step, key, error: errorMessage });
      console.error(`❌ Failed to submit ${key}:`, error);
    }
  }

  return results;
}

/**
 * Verifica se o usuário tem um business selecionado
 */
export async function checkBusinessSelected(): Promise<boolean> {
  try {
    const user = localStorage.getItem('user');
    if (!user) return false;

    const userData = JSON.parse(user);
    return !!userData.selected_business_id;
  } catch (error) {
    console.error('Error checking business selection:', error);
    return false;
  }
}
