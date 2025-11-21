import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Loader2, 
  Edit2, 
  Save,
  UploadCloud
} from 'lucide-react';
import { motion } from 'framer-motion';
import { submitStepAnswer, checkBusinessSelected, saveProgress, loadProgress, clearProgress, clearSubmittedQuestions } from '../services/toneSetup';
import { BusinessSelectorModal } from './BusinessSelectorModal';

interface ToneSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface WebhookResponse {
  posicionamento_da_marca: string;
  tom_de_voz: string;
  publico_alvo: string;
}

// Textarea que cresce com o conteúdo, sem scroll interno
const AutoResizeTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ className = '', onChange, ...props }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e);
    requestAnimationFrame(resize);
  };

  return (
    <textarea
      ref={ref}
      {...props}
      onChange={handleChange}
      className={
        'w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden ' +
        className
      }
    />
  );
};

export const ToneSetupModal: React.FC<ToneSetupModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[] | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);
  const [showBusinessSelector, setShowBusinessSelector] = useState(false);
  const [editableResponse, setEditableResponse] = useState<WebhookResponse | null>(null);
  const [isSavingToneVoice, setIsSavingToneVoice] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // ref para o container rolável das perguntas
  const contentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bloquear scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Preview do logo selecionado
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  // Carregar progresso salvo ao abrir o modal
  useEffect(() => {
    if (isOpen && showForm) {
      const saved = loadProgress();
      if (saved) {
        setAnswers(saved.answers);
        setCurrentStep(saved.currentStep);
        // Limpar registro de perguntas enviadas para forçar reenvio
        clearSubmittedQuestions();
        console.log('📂 Progresso restaurado - todas as respostas serão reenviadas');
      }
    }
  }, [isOpen, showForm]);

  // Salvar progresso sempre que answers ou currentStep mudar
  useEffect(() => {
    if (showForm && Object.keys(answers).length > 0) {
      saveProgress(answers, currentStep);
    }
  }, [answers, currentStep, showForm]);

  // Resetar scroll do container interno ao mudar de pergunta
  useEffect(() => {
    if (showForm && contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [currentStep, showForm]);

  const questions = [
    {
      title: "Qual é a missão central da marca?",
      subtitle: "Selecione de 1 a 3 opções que mais se conectam à marca",
      type: "multiple",
      minSelections: 1,
      maxSelections: 3,
      answers: [
        "Transformação do cliente",
        "Impacto social/cultural",
        "Excelência e inovação",
        "Propósito pessoal/profissional",
        "Eficiência/Simplificação",
        "Acesso/Democratização",
        "Conexão/Comunidade",
        "Liberdade/Autonomia",
        "Legado/Inspiração",
        "Especialização/Nicho",
        "Proteção/Segurança",
        "Prazer/Estilo de vida",
        "Performance/Alta competição",
        "Sustentabilidade/Meio ambiente",
        "Educação/Consciência",
        "Exclusividade/Status",
        "Velocidade/Agilidade",
        "Exploração/Descoberta",
        "Identidade/Expressão pessoal",
        "Transformação cultural/comportamental",
        "Colaboração/Cocriação",
        "Justiça/Equidade",
        "Tradição/Preservação",
        "Saúde/Vitalidade",
        "Tecnologia/Futuro",
        "Entretenimento/Inspiração criativa",
        "Resiliência/Superação",
        "Hospitalidade/Cuidado"
      ]
    },
    {
      title: "Quais valores não são negociáveis da marca?",
      subtitle: "Selecione de 1 a 3 valores centrais",
      type: "multiple",
      minSelections: 1,
      maxSelections: 3,
      answers: [
        "Ética e Integridade",
        "Respeito às Pessoas",
        "Excelência e Qualidade",
        "Inovação e Curiosidade",
        "Foco no Cliente",
        "Colaboração e Trabalho em Equipe",
        "Sustentabilidade e Responsabilidade Social",
        "Liberdade e Autonomia",
        "Coragem e Resiliência",
        "Humanidade e Empatia",
        "Disciplina",
        "Transparência Radical",
        "Velocidade/Agilidade",
        "Meritocracia e Reconhecimento",
        "Accountability (Responsabilização)",
        "Aprendizado Contínuo",
        "Pragmatismo e Simplicidade",
        "Generosidade e Compartilhamento",
        "Coragem Criativa",
        "Confiança",
        "Justiça",
        "Humildade",
        "Autenticidade",
        "Gratidão",
        "Espírito de Serviço",
        "Paciência",
        "Alegria",
        "Honra",
        "Determinação",
        "Visão de Futuro"
      ]
    },
    {
      title: "Quais são os principais diferenciais competitivos da marca?",
      subtitle: "Selecione de 1 a 3 diferenciais que realmente tornam a marca única",
      type: "multiple",
      minSelections: 1,
      maxSelections: 3,
      answers: [
        "Preço Acessível / Custo-benefício",
        "Qualidade Superior",
        "Inovação Tecnológica",
        "Atendimento e Suporte Excepcional",
        "Personalização/Flexibilidade",
        "Marca Autêntica/História Única",
        "Velocidade/Agilidade na Entrega",
        "Conveniência e Facilidade de Uso",
        "Expertise/Especialização",
        "Impacto Socioambiental Positivo",
        "Comunidade e Networking",
        "Parcerias ou Acessos Exclusivos"
      ]
    },
    {
      title: "Em qual segmento de mercado a marca atua?",
      subtitle: "Selecione a categoria principal ou descreva em poucas palavras",
      type: "single",
      answers: [
        "Tecnologia (Software/Serviços Digitais)",
        "Finanças (Fintech/Serviços Financeiros)",
        "Saúde e Bem-estar",
        "Educação",
        "Varejo e Bens de Consumo",
        "Alimentação/Hospitalidade",
        "Indústria/Manufatura",
        "Serviços Profissionais",
        "ONG/Impacto Social",
        "Outro (Nicho Específico)"
      ]
    },
    {
      title: "Qual afirmação melhor descreve o contexto competitivo da marca?",
      subtitle: "Selecione aquela que mais se aproxima da situação atual",
      type: "single",
      answers: [
        "Pioneira",
        "Desafiante",
        "Disruptiva",
        "Líder estabelecida",
        "Especialista de Nicho",
        "Concorrência Fragmentada"
      ]
    },
    {
      // NOVA PERGUNTA SEPARADA: MODELO DE ATUAÇÃO
      title: "Qual é o modelo de atuação principal da marca?",
      subtitle: "Selecione o modelo que melhor representa como a marca se relaciona com o cliente",
      type: "single",
      answers: [
        "B2B",
        "B2C",
        "B2B2C",
        "D2C"
      ]
    },
    {
      // PÚBLICO-ALVO: SOMENTE DEMOGRAFIA (SEM LOCALIZAÇÃO)
      title: "Quem é o público-alvo principal da marca?",
      subtitle: "Selecione as principais características demográficas do seu público",
      type: "grouped-multiple",
      minSelections: 1,
      maxSelections: 12,
      groups: {
        "Idade": [
          "18-24 anos",
          "25-34 anos",
          "35-44 anos",
          "45-60 anos",
          "60+ anos"
        ],
        "Gênero": [
          "Predominantemente masculino",
          "Predominantemente feminino",
          "Equilibrado entre gêneros",
          "Independente de gênero"
        ],
        "Renda": [
          "Baixa renda",
          "Média renda",
          "Alta renda",
          "Alta renda / Premium"
        ],
        "Contexto profissional": [
          "Estudantes",
          "Profissionais em início de carreira",
          "Gestores e líderes",
          "Empreendedores",
          "Autônomos / freelancers"
        ]
      }
    },
    {
      title: "Como o público percebe atualmente as soluções existentes (ou a própria marca)?",
      subtitle: "Selecione a opção que mais reflete a situação atual",
      type: "single",
      answers: [
        "Desconhecimento",
        "Ceticismo",
        "Insatisfação Latente",
        "Satisfeito com Concorrente",
        "Sensível a Preço",
        "Consciente e Exigente",
        "Entusiastas da Marca"
      ]
    },
    {
      title: "Qual é o principal benefício emocional/intangível que a marca proporciona?",
      subtitle: "Selecione se houver um apelo emocional claro na proposta de valor",
      type: "single",
      answers: [
        "Tranquilidade/Paz de Espírito",
        "Sentimento de Confiança",
        "Status/Orgulho",
        "Pertencimento",
        "Inspiração/Motivação",
        "Diversão/Alegria",
        "Realização Pessoal",
        "Alívio/Conforto",
        "Conexão Emocional",
        "Autonomia/Liberdade"
      ]
    },
    {
      title: "Por que o cliente deve acreditar que a marca entrega esses benefícios?",
      subtitle: "Selecione até 2 razões de credibilidade",
      type: "multiple",
      minSelections: 1,
      maxSelections: 2,
      answers: [
        "Expertise e Experiência",
        "Tecnologia Proprietária/Metodologia Comprovada",
        "Casos de Sucesso e Depoimentos",
        "Certificações/Prêmios/Recomendações",
        "Parcerias Estratégicas",
        "Qualidade Superior do Produto",
        "Garantias e Políticas Claras",
        "Comunidade de Usuários Engajada",
        "Resultados Mensuráveis",
        "Missão/Valores Fortes"
      ]
    },
    {
      title: "Quais atributos de personalidade definem o tom de voz da marca?",
      subtitle: "Selecione de 3 a 5 atributos",
      type: "multiple",
      minSelections: 3,
      maxSelections: 5,
      answers: [
        "Amigável / Conversacional",
        "Formal / Polido",
        "Descontraído / Divertido",
        "Sério / Sóbrio",
        "Inspirador / Emocional",
        "Informativo / Direto",
        "Inovador / Vanguardista",
        "Tradicional / Conservador",
        "Autoritativo / Especialista",
        "Humilde / Colaborativo",
        "Enérgico / Entusiasmado",
        "Calmo / Paciente",
        "Exclusivo / Sofisticado",
        "Acessível / Simples",
        "Empático / Acolhedor",
        "Objetivo / Frio"
      ]
    },
    {
      title: "Como assegurar que a marca mantenha consistência ao crescer ou se expandir?",
      subtitle: "Selecione os elementos relevantes",
      type: "grouped-multiple",
      maxSelections: 10,
      groups: {
        "Diretrizes de Consistência": [
          "Guia de Tom de Voz Formalizado",
          "Identidade Visual e Mensagens-Chave Coerentes",
          "Adequação Multicanal",
          "Treinamento Interno Contínuo"
        ],
        "Visão de Longo Prazo": [
          "Ser Líder no Mercado X",
          "Expandir Portfólio",
          "Alcançar Novos Segmentos",
          "Impacto e Legado",
          "Flexibilidade na Narrativa"
        ]
      }
    },
    {
      title: "Quais temas você não quer falar sobre?",
      subtitle: "Liste os tópicos que não devem ser abordados",
      type: "text",
      placeholder: "Ex: política, religião, concorrentes..."
    },
    {
      title: "Quais palavras você quer utilizar com frequência?",
      subtitle: "Liste termos que devem aparecer com frequência",
      type: "text",
      placeholder: "Ex: inovação, transformação, excelência..."
    },
    {
      title: "Quais palavras que você nunca quer utilizar?",
      subtitle: "Liste termos proibidos",
      type: "text",
      placeholder: "Ex: barato, desconto, promoção..."
    },
    {
      title: "Envie o logo da marca ou a foto do perfil",
      subtitle: "Faça upload do arquivo de logo (PNG, JPG, SVG)",
      type: "file"
    }
  ];

  const currentQuestion = questions[currentStep];

  const handleToggleAnswer = (answer: string) => {
    const current = (answers[currentStep] as string[]) || [];
    const question = questions[currentStep];
    
    if (current.includes(answer)) {
      setAnswers({
        ...answers,
        [currentStep]: current.filter(a => a !== answer)
      });
    } else {
      const maxSelections = (question as any).maxSelections || 1;
      if (current.length < maxSelections) {
        setAnswers({
          ...answers,
          [currentStep]: [...current, answer]
        });
      }
    }
  };

  const handleSelectSingle = (answer: string) => {
    setAnswers({
      ...answers,
      [currentStep]: [answer]
    });
  };

  const handleTextInput = (value: string) => {
    setAnswers({
      ...answers,
      [currentStep]: value
    });
  };

  const handleLogoFile = (file: File) => {
    if (!file) return;

    setLogoFile(file);

    // Se ainda não tiver URL salva, mantém resposta vazia até upload concluir
    setAnswers(prev => ({
      ...prev,
      [currentStep]:
        prev[currentStep] && typeof prev[currentStep] === 'string' && (prev[currentStep] as string).startsWith('http')
          ? prev[currentStep]
          : ''
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoFile(file);
    }
  };

  const uploadLogo = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return { success: false, error: 'Token de autenticação não encontrado' };
      }

      const formData = new FormData();
      // segue o padrão que você descreveu: key + file
      formData.append('key', 'logo_url');
      formData.append('file', file);

      const response = await fetch('https://carousel-api-sepia.vercel.app/api/business/forms/logo_url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NÃO coloca Content-Type, o browser seta com boundary correto
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Erro ao enviar logo: ${response.status} - ${errorText}` };
      }

      const data = await response.json();

      const uploadedUrl =
        data?.data?.uploaded_url || data?.data?.response || null;

      if (!uploadedUrl) {
        return { success: false, error: 'API não retornou URL do logo' };
      }

      return { success: true, url: uploadedUrl };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao enviar logo';
      return { success: false, error: msg };
    }
  };

  const canGoNext = () => {
    const answer = answers[currentStep];
    const question = questions[currentStep];

    // campos de texto continuam opcionais
    if (question.type === 'text') {
      return true;
    }

    // logo (file)
    if (question.type === 'file') {
      const answerStr = typeof answer === 'string' ? answer : '';
      const alreadyUploaded = answerStr.startsWith('http'); // URL gravada
      // pode avançar se já fez upload (URL) ou se já escolheu um arquivo (logoFile)
      return alreadyUploaded || !!logoFile;
    }

    if (!answer) return false;

    if (Array.isArray(answer)) {
      const minSelections = (question as any).minSelections || 1;
      return answer.length >= minSelections;
    }

    return (answer as string).length > 0;
  };

  const handleNext = async () => {
    setSubmitError(null);

    // Verificar se há negócio selecionado antes de qualquer ação
    const hasBusinessSelected = await checkBusinessSelected();
    if (!hasBusinessSelected) {
      setShowBusinessSelector(true);
      return;
    }

    const question = questions[currentStep];

    // CASO ESPECIAL: passo de logo (upload de arquivo)
    if (question.type === 'file') {
      const currentAnswer = answers[currentStep];
      const alreadyUploaded =
        typeof currentAnswer === 'string' && currentAnswer.startsWith('http');

      if (!alreadyUploaded) {
        if (!logoFile) {
          setSubmitError('Selecione um arquivo de logo antes de continuar.');
          return;
        }

        setIsSavingAnswer(true);
        const result = await uploadLogo(logoFile);
        setIsSavingAnswer(false);

        if (!result.success || !result.url) {
          setSubmitError(result.error || 'Erro ao enviar logo');
          // não avança se não salvou
          return;
        }

        // grava a URL retornada como resposta desse passo
        setAnswers(prev => ({
          ...prev,
          [currentStep]: result.url!,
        }));

        setLogoFile(null);
      }

      // avançar para próxima pergunta ou finalizar
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }

      return;
    }

    // FLUXO PADRÃO (igual ao seu, para as outras perguntas)
    const currentAnswer = answers[currentStep];
    if (currentAnswer) {
      setIsSavingAnswer(true);
      const result = await submitStepAnswer(currentStep, currentAnswer);
      setIsSavingAnswer(false);

      if (!result.success && result.error) {
        setSubmitError(`Erro ao salvar resposta: ${result.error}`);
        // Permite continuar mesmo com erro, mas mostra feedback
        setTimeout(() => setSubmitError(null), 3000);
      }
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Verificar se há business selecionado
      const hasBusinessSelected = await checkBusinessSelected();
      if (!hasBusinessSelected) {
        setShowBusinessSelector(true);
        setIsSubmitting(false);
        return;
      }

      console.log('🚀 Finalizando formulário de tom de voz...');

      // Preparar dados para o webhook
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;

      const formData = {
        user_id: userData?.id || null,
        business_id: userData?.selected_business_id || null,
        responses: answers,
        completed_at: new Date().toISOString(),
        // Mapear respostas para nomes legíveis
        mapped_responses: Object.entries(answers).reduce((acc, [step, answer]) => {
          const questionIndex = parseInt(step, 10);
          const question = questions[questionIndex];
          
          // Perguntas que devem enviar array:
          // 0,1,2 (missão/valores/diferenciais)
          // 6 (público-alvo demográfico)
          // 9,10,11 (razões, atributos de tom, consistência)
          const arrayQuestions = [0, 1, 2, 6, 9, 10, 11];
          
          if (arrayQuestions.includes(questionIndex)) {
            if (Array.isArray(answer)) {
              acc[question.title] = answer;
            } else if (typeof answer === 'string') {
              acc[question.title] = answer
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            } else {
              acc[question.title] = answer as any;
            }
          } else {
            let formattedAnswer;
            if (Array.isArray(answer)) {
              formattedAnswer = answer.join(', ');
            } else {
              formattedAnswer = answer as string;
            }
            acc[question.title] = formattedAnswer;
          }

          return acc;
        }, {} as Record<string, string | string[]>)
      };

      console.log('📋 Dados preparados para webhook:', formData);

      // Enviar para webhook e aguardar resposta
      const webhookResult = await sendToWebhook(formData);

      console.log('✅ Webhook processado com sucesso!');

      // Extrair a resposta do webhook (esperamos um array com um objeto)
      if (Array.isArray(webhookResult) && webhookResult.length > 0) {
        const responseData = webhookResult[0];
        setEditableResponse(responseData);
        console.log('📝 Resposta do webhook recebida:', responseData);
      } else if (webhookResult && typeof webhookResult === 'object') {
        setEditableResponse(webhookResult);
        console.log('📝 Resposta do webhook recebida:', webhookResult);
      } else {
        throw new Error('Formato de resposta do webhook inválido');
      }
    } catch (error) {
      console.error('❌ Erro ao finalizar formulário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao finalizar o formulário';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBusinessSelected = () => {
    setShowBusinessSelector(false);
    console.log('🏢 Negócio selecionado, continuando com o formulário');
  };

  const handleSaveToneVoice = async () => {
    if (!editableResponse) return;

    setIsSavingToneVoice(true);
    setSubmitError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const saveData = {
        brand_positioning: editableResponse.posicionamento_da_marca,
        voice_tone: editableResponse.tom_de_voz,
        target_audience: editableResponse.publico_alvo
      };

      console.log('💾 Salvando tom de voz:', saveData);
      
      const response = await fetch('https://carousel-api-sepia.vercel.app/api/business/tone-of-voice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          throw new Error(errorData.message || 'Nenhum business selecionado');
        } else if (response.status === 404) {
          throw new Error('Business não encontrado ou não pertence ao usuário');
        } else if (response.status === 422) {
          const errors = errorData.errors?.map((e: any) => e.msg).join(', ') || 'Dados inválidos';
          throw new Error(errors);
        } else {
          throw new Error(errorData.message || 'Erro ao salvar tom de voz');
        }
      }

      const result = await response.json();
      console.log('✅ Tom de voz salvo com sucesso!', result);

      // Marcar como completo
      localStorage.setItem('needs_tone_setup', 'false');
      localStorage.removeItem('tone_setup_postponed');

      // Limpa o progresso e perguntas enviadas
      clearProgress();
      clearSubmittedQuestions();

      onComplete();
    } catch (error) {
      console.error('❌ Erro ao salvar tom de voz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar tom de voz';
      setSubmitError(errorMessage);
    } finally {
      setIsSavingToneVoice(false);
    }
  };

  const sendToWebhook = async (formData: any): Promise<any> => {
    const webhookUrl = 'https://webhook.workez.online/webhook/createToneVoice';

    console.log('📤 Enviando dados para webhook:', webhookUrl);
    console.log('📦 Payload:', formData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Webhook response:', result);

    return result;
  };

  const renderAnswerOptions = () => {
    const question = questions[currentStep];
    const currentAnswers = (answers[currentStep] as string[]) || [];

    if (question.type === 'text') {
      return (
        <textarea
          value={(answers[currentStep] as string) || ''}
          onChange={(e) => handleTextInput(e.target.value)}
          placeholder={(question as any).placeholder}
          className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
        />
      );
    }

    // upload de logo
    if (question.type === 'file') {
      const answer = answers[currentStep];
      const uploadedUrl =
        typeof answer === 'string' && answer.startsWith('http') ? answer : null;

      const previewUrl = logoPreview || uploadedUrl || null;

      return (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-800">
              Arraste e solte o logo aqui
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou clique para selecionar um arquivo (PNG, JPG, SVG)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {logoFile && !uploadedUrl && (
              <p className="mt-3 text-xs text-gray-600">
                Arquivo selecionado: <span className="font-semibold">{logoFile.name}</span>
              </p>
            )}

            {uploadedUrl && !logoFile && (
              <p className="mt-3 text-xs text-green-600">
                Logo já enviado. Você pode avançar ou escolher outro arquivo para substituir.
              </p>
            )}
          </div>

          {previewUrl && (
            <div className="border border-gray-200 bg-white rounded-xl p-3 flex flex-col items-center">
              <p className="text-xs text-gray-500 mb-2">Pré-visualização do logo</p>
              <img
                src={previewUrl}
                alt="Logo"
                className="max-h-40 object-contain"
              />
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'grouped' || question.type === 'grouped-multiple') {
      return (
        <div className="space-y-6">
          {Object.entries((question as any).groups!).map(([groupName, options]) => (
            <div key={groupName}>
              <h4 className="font-semibold text-gray-900 mb-3">{groupName}</h4>
              <div className="grid grid-cols-1 gap-2">
                {(options as string[]).map((option: string) => (
                  <button
                    key={option}
                    onClick={() => question.type === 'grouped-multiple' ? handleToggleAnswer(option) : handleSelectSingle(option)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      currentAnswers.includes(option)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2">
        {(question as any).answers!.map((answer: string) => (
          <button
            key={answer}
            onClick={() => question.type === 'single' ? handleSelectSingle(answer) : handleToggleAnswer(answer)}
            className={`p-3 text-left rounded-lg border-2 transition-all ${
              currentAnswers.includes(answer)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto overscroll-contain">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {!showForm ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Falta só um detalhe para gerarmos os melhores carrosséis para você.
              </h2>
              <p className="text-gray-600">
                Defina o tom de voz que representa sua marca.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Fazer agora
              </button>
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Fazer mais tarde
              </button>
            </div>
          </div>
        ) : editableResponse ? (
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Revise seu Tom de Voz</h2>
                <p className="text-sm text-gray-600 mt-1">Edite os campos se necessário e salve</p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Posicionamento da Marca</label>
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                <AutoResizeTextarea
                  value={editableResponse.posicionamento_da_marca}
                  onChange={(e) =>
                    setEditableResponse({
                      ...editableResponse,
                      posicionamento_da_marca: e.target.value,
                    })
                  }
                  className="p-3"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Tom de Voz</label>
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                <AutoResizeTextarea
                  value={editableResponse.tom_de_voz}
                  onChange={(e) =>
                    setEditableResponse({
                      ...editableResponse,
                      tom_de_voz: e.target.value,
                    })
                  }
                  className="p-3"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Público Alvo</label>
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                <AutoResizeTextarea
                  value={editableResponse.publico_alvo}
                  onChange={(e) =>
                    setEditableResponse({
                      ...editableResponse,
                      publico_alvo: e.target.value,
                    })
                  }
                  className="p-3"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}
              
              <button
                onClick={handleSaveToneVoice}
                disabled={isSavingToneVoice}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingToneVoice ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Tom de Voz
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  Pergunta {currentStep + 1} de {questions.length}
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {currentQuestion.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {currentQuestion.subtitle}
              </p>
              
              {renderAnswerOptions()}
            </div>

            <div className="p-6 border-t border-gray-200">
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting || isSavingAnswer}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>
                
                <button
                  onClick={handleNext}
                  disabled={!canGoNext() || isSubmitting || isSavingAnswer}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmitting || isSavingAnswer) ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isSavingAnswer ? 'Salvando...' : 'Finalizando...'}
                    </>
                  ) : (
                    <>
                      {currentStep === questions.length - 1 ? 'Finalizar' : 'Próximo'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <BusinessSelectorModal
        isOpen={showBusinessSelector}
        onClose={() => setShowBusinessSelector(false)}
        onBusinessSelected={handleBusinessSelected}
      />
    </div>
  );
};