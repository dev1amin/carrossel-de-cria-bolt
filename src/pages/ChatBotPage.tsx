import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import ChatWelcomeScreen from '../components/ChatWelcomeScreen';
import { TemplateSelectionModal } from '../components/carousel';
import { CarouselPreviewModal } from '../components/carousel/CarouselPreviewModal';
import { ToneSetupModal } from '../components/ToneSetupModal';
import type { GenerationOptions } from '../components/carousel/TemplateSelectionModal';

import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useChat } from '../contexts/ChatContext';
import { useToneSetupOnDemand as useToneSetup } from '../hooks/useToneSetupVariants';

import type { CarouselData } from '../types/carousel';
import type { ConversationMessage } from '../types/conversation';

import {
  sendChatMessage,
  parseTemplateSelectionTrigger,
  parseCarouselData,
  generateMessageId,
  ChatMessage,
  createConversationMessage,
} from '../services/chatbot';

import { getConversationMessages } from '../services/conversations';

interface ChatBotPageProps {
  conversationId?: string;
  newChatKey?: number;
}

const ChatBotPage: React.FC<ChatBotPageProps> = ({ conversationId, newChatKey }) => {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage || '';
  const { createNewConversation, activeConversation } = useChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [postCode] = useState('');
  const [waitingForTemplate, setWaitingForTemplate] = useState(false);
  const [isCarouselPreviewOpen, setIsCarouselPreviewOpen] = useState(false);
  const [carouselData, setCarouselData] = useState<any>(null);
  const [hasGeneratedCarousel, setHasGeneratedCarousel] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(
    conversationId
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const { showToneModal, closeToneModal, completeToneSetup } = useToneSetup();
  const navigate = useNavigate();
  const { addEditorTab } = useEditorTabs();

  // Mapeia mensagem da API → modelo de chat
  const mapApiMessageToChat = (m: ConversationMessage): ChatMessage => ({
    id: m.id,
    role: m.sender_type === 'bot' ? 'assistant' : 'user',
    content: m.message_text,
    timestamp: new Date(m.created_at),
  });

  // Sincroniza conversationId vindo de fora (context / props)
  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
    } else if (activeConversation?.id) {
      setCurrentConversationId(activeConversation.id);
    }
  }, [conversationId, activeConversation]);

  // Reset COMPLETO quando clica em "Novo chat"
  useEffect(() => {
    if (!newChatKey) return;
    setMessages([]);
    setInputMessage('');
    setIsTemplateModalOpen(false);
    setWaitingForTemplate(false);
    setIsCarouselPreviewOpen(false);
    setCarouselData(null);
    setHasGeneratedCarousel(false);
    setEditingMessageId(null);
    setEditingContent('');
    setCurrentConversationId(undefined);
  }, [newChatKey]);

  // Processar mensagem inicial da HomePage (se houver)
  const initialMessageRef = useRef(false);
  useEffect(() => {
    const isProcessing = location.state?.isProcessing;
    const isCreating = location.state?.isCreatingConversation;
    
    // Se está criando ou processando, mostra a mensagem inicial imediatamente
    if ((isProcessing || isCreating) && initialMessage && !initialMessageRef.current) {
      console.log('📝 Exibindo mensagem inicial:', initialMessage);
      initialMessageRef.current = true;
      
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: initialMessage,
        timestamp: new Date(),
      };
      
      setMessages([userMessage]);
      setIsLoading(true); // Mostra "pensando..."
    }
  }, [initialMessage, location.state]);

  // Carregar histórico quando entra numa conversa existente
  const hasLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    // Ignora IDs temporários ou inválidos
    if (!currentConversationId || currentConversationId === 'creating') return;
    
    // Evita carregar múltiplas vezes o mesmo ID (mas permite polling se isProcessing)
    const isProcessing = location.state?.isProcessing;
    if (!isProcessing && hasLoadedRef.current === currentConversationId) return;
    hasLoadedRef.current = currentConversationId;

    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const loadHistory = async () => {
      try {
        console.log('📚 Carregando histórico da conversa:', currentConversationId);
        const res = await getConversationMessages(currentConversationId, {
          limit: 100,
          offset: 0,
        });

        if (cancelled) return;

        const sorted = [...res.data].sort((a, b) => {
          const ta = new Date(a.created_at).getTime();
          const tb = new Date(b.created_at).getTime();
          if (ta === tb) return a.id.localeCompare(b.id);
          return ta - tb;
        });

        const mapped = sorted.map(mapApiMessageToChat);
        console.log('✅ Histórico carregado:', mapped.length, 'mensagens');
        console.log('📝 Mensagens:', mapped.map(m => ({ role: m.role, content: m.content.substring(0, 50) })));
        
        setMessages(mapped);
        
        // Se encontrou mensagem do bot, para o polling e remove loading
        const botMessages = mapped.filter(m => m.role === 'assistant');
        const hasResponse = botMessages.length > 0;
        
        console.log('🤖 Mensagens do bot encontradas:', botMessages.length);
        
        if (hasResponse) {
          console.log('✅ Resposta do bot detectada! Parando polling...');
          setIsLoading(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        } else if (isProcessing) {
          console.log('⏳ Ainda aguardando resposta do bot...');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar histórico da conversa:', err);
        setIsLoading(false);
      }
    };

    // Carrega imediatamente
    loadHistory();
    
    // Se está processando, faz polling a cada 2 segundos (máximo 30 segundos)
    if (isProcessing) {
      console.log('🔄 Iniciando polling para aguardar resposta do bot...');
      let pollCount = 0;
      const maxPolls = 15; // 15 x 2s = 30 segundos
      
      pollInterval = setInterval(async () => {
        if (cancelled) return;
        
        pollCount++;
        console.log(`🔄 Poll #${pollCount}/${maxPolls}`);
        
        if (pollCount >= maxPolls) {
          console.log('⏰ Timeout: Parando polling após 30 segundos');
          setIsLoading(false);
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          return;
        }
        
        // Faz novo fetch
        try {
          const res = await getConversationMessages(currentConversationId, {
            limit: 100,
            offset: 0,
          });
          
          if (cancelled) return;
          
          const sorted = [...res.data].sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            if (ta === tb) return a.id.localeCompare(b.id);
            return ta - tb;
          });
          
          const mapped = sorted.map(mapApiMessageToChat);
          const botMessages = mapped.filter(m => m.role === 'assistant');
          
          console.log(`🔄 Poll #${pollCount}: ${mapped.length} mensagens, ${botMessages.length} do bot`);
          
          if (botMessages.length > 0) {
            console.log('✅ Resposta do bot detectada! Parando polling...');
            setMessages(mapped);
            setIsLoading(false);
            if (pollInterval) {
              clearInterval(pollInterval);
            }
          }
        } catch (err) {
          console.error('❌ Erro no polling:', err);
        }
      }, 2000);
    }

    return () => {
      cancelled = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentConversationId, location.state?.isProcessing]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll automático quando o bot responde
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      scrollToBottom('smooth');
    }
  }, [messages]);

  // Auto-resize textarea principal
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '48px';
      const newHeight = Math.min(textarea.scrollHeight, 128);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputMessage]);

  // Auto-resize textarea edição
  useEffect(() => {
    const textarea = editInputRef.current;
    if (textarea && editingMessageId) {
      textarea.style.height = '48px';
      const newHeight = Math.min(textarea.scrollHeight, 128);
      textarea.style.height = `${newHeight}px`;
      textarea.focus();
    }
  }, [editingContent, editingMessageId]);

  const getUserId = (): string => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || 'anonymous';
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    }
    return 'anonymous';
  };

  const getUserName = (): string => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.name || user.email?.split('@')[0] || 'User';
      } catch (error) {
        console.error('Erro ao obter nome do usuário:', error);
      }
    }
    return 'User';
  };

  // Garante que exista conversationId (cria se não existir)
  const ensureConversationId = async (): Promise<string | undefined> => {
    let convId = currentConversationId;

    if (!convId) {
      try {
        const newConv = await createNewConversation();
        convId = newConv?.id;
        if (!convId && activeConversation?.id) {
          convId = activeConversation.id;
        }
        if (convId) {
          setCurrentConversationId(convId);
        }
      } catch (err) {
        console.error('Erro ao criar conversa:', err);
      }
    }

    return convId;
  };

  const handleSendMessage = async (overrideMessage?: string) => {
    const rawMessage = overrideMessage ?? inputMessage;
    const trimmed = rawMessage.trim();
    if (!trimmed || isLoading) return;

    // Verifica se precisa configurar tom de voz
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      console.log('🚫 Bloqueando envio de mensagem - tom de voz não configurado');
      return; // O modal já aparece automaticamente pelo useToneSetup
    }

    const userId = getUserId();

    // Coloca mensagem do usuário na tela IMEDIATAMENTE
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideMessage) {
      setInputMessage('');
    }

    setIsLoading(true);

    const convId = await ensureConversationId();

    // Garante que temos um conversationId válido antes de continuar
    if (!convId) {
      console.error('❌ Não foi possível criar/obter conversationId');
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao iniciar a conversa. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    try {
      await createConversationMessage(convId, {
        sender_type: 'user',
        message_text: userMessage.content,
      });
    } catch (err) {
      console.error('Erro ao salvar mensagem do usuário:', err);
    }

    try {
      // manda conversationId pro agente - agora garantido não ser null
      const responses = await sendChatMessage(
        userId,
        userMessage.content,
        convId
      );

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;

        // 1) carrossel
        const carouselCheck = parseCarouselData(botResponse);

        if (carouselCheck.hasCarousel) {
          const followUpMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: 'O que achou do carrossel?',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, followUpMessage]);
          setCarouselData(carouselCheck.carouselData);
          setHasGeneratedCarousel(true);
          setIsCarouselPreviewOpen(true);

          try {
            await createConversationMessage(convId, {
              sender_type: 'bot',
              message_text: followUpMessage.content,
            });
          } catch (err) {
            console.error('Erro ao salvar mensagem do bot (carrossel):', err);
          }

          return;
        }

        // 2) resposta normal / template
        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(
          botResponse
        );

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        try {
          await createConversationMessage(convId, {
            sender_type: 'bot',
            message_text: assistantMessage.content,
          });
        } catch (err) {
          console.error('Erro ao salvar mensagem do bot:', err);
        }

        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content:
          'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // convId foi validado no início, então podemos salvar a mensagem de erro
      try {
        await createConversationMessage(convId, {
          sender_type: 'bot',
          message_text: errorMessage.content,
        });
      } catch (err) {
        console.error('Erro ao salvar mensagem de erro do bot:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;

    const userId = getUserId();
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    const editedMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: editingContent.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, editedMessage]);
    setEditingMessageId(null);
    setEditingContent('');
    setIsLoading(true);

    const convId = currentConversationId || (await ensureConversationId());

    if (convId) {
      try {
        await createConversationMessage(convId, {
          sender_type: 'user',
          message_text: editedMessage.content,
        });
      } catch (err) {
        console.error('Erro ao salvar mensagem editada do usuário:', err);
      }
    }

    try {
      const responses = await (sendChatMessage as any)(
        userId,
        editedMessage.content,
        convId
      );

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;

        const carouselCheck = parseCarouselData(botResponse);

        if (carouselCheck.hasCarousel) {
          const followUpMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: 'O que achou do carrossel?',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, followUpMessage]);
          setCarouselData(carouselCheck.carouselData);
          setHasGeneratedCarousel(true);
          setIsCarouselPreviewOpen(true);

          if (convId) {
            try {
              await createConversationMessage(convId, {
                sender_type: 'bot',
                message_text: followUpMessage.content,
              });
            } catch (err) {
              console.error(
                'Erro ao salvar mensagem do bot (carrossel, edição):',
                err
              );
            }
          }

          return;
        }

        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(
          botResponse
        );

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (convId) {
          try {
            await createConversationMessage(convId, {
              sender_type: 'bot',
              message_text: assistantMessage.content,
            });
          } catch (err) {
            console.error('Erro ao salvar mensagem do bot (edição):', err);
          }
        }

        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar mensagem editada:', error);

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content:
          'Desculpe, ocorreu um erro ao processar sua mensagem editada. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      if (currentConversationId) {
        try {
          await createConversationMessage(currentConversationId, {
            sender_type: 'bot',
            message_text: errorMessage.content,
          });
        } catch (err) {
          console.error(
            'Erro ao salvar mensagem de erro do bot (edição):',
            err
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string, options?: GenerationOptions) => {
    setIsTemplateModalOpen(false);
    setWaitingForTemplate(false);

    console.log('🚀 ChatBotPage: handleTemplateSelect iniciado', { templateId, options });

    // Constrói a mensagem com template e opções preenchidas
    let templateMessage = `Template ${templateId}`;
    
    // Se tiver options, inclui todos os dados na mensagem
    if (options) {
      const optionsParts: string[] = [];
      
      if (options.contentType) {
        optionsParts.push(`tipo_conteudo:${options.contentType}`);
      }
      if (options.screenCount) {
        optionsParts.push(`quantidade_slides:${options.screenCount}`);
      }
      if (options.descriptionLength) {
        optionsParts.push(`tamanho_descricao:${options.descriptionLength}`);
      }
      if (options.dimension) {
        optionsParts.push(`dimensao:${options.dimension}`);
      }
      if (options.hasCTA !== undefined) {
        optionsParts.push(`tem_cta:${options.hasCTA}`);
      }
      if (options.ctaType) {
        optionsParts.push(`tipo_cta:${options.ctaType}`);
      }
      if (options.ctaIntention) {
        optionsParts.push(`intencao_cta:${options.ctaIntention}`);
      }
      if (options.context) {
        optionsParts.push(`contexto:${options.context}`);
      }
      if (options.multipleLinks && options.multipleLinks.length > 0) {
        optionsParts.push(`links_multiplos:${options.multipleLinks.join(',')}`);
      }
      if (options.multifont) {
        optionsParts.push(`multifont:true`);
      }
      
      if (optionsParts.length > 0) {
        templateMessage = `Template ${templateId} [${optionsParts.join(' | ')}]`;
      }
    }

    console.log('📤 Mensagem do template:', templateMessage);

    const userId = getUserId();
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: templateMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const convId = currentConversationId || (await ensureConversationId());

    if (convId) {
      try {
        await createConversationMessage(convId, {
          sender_type: 'user',
          message_text: userMessage.content,
        });
      } catch (err) {
        console.error('Erro ao salvar mensagem de template do usuário:', err);
      }
    }

    try {
      const responses = await (sendChatMessage as any)(
        userId,
        templateMessage,
        convId
      );

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;

        const carouselCheck = parseCarouselData(botResponse);

        if (carouselCheck.hasCarousel) {
          const assistantMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: carouselCheck.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (convId) {
            try {
              await createConversationMessage(convId, {
                sender_type: 'bot',
                message_text: assistantMessage.content,
              });
            } catch (err) {
              console.error(
                'Erro ao salvar mensagem do bot (carrossel, template):',
                err
              );
            }
          }

          setCarouselData(carouselCheck.carouselData);
          setIsCarouselPreviewOpen(true);
          return;
        }

        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(
          botResponse
        );

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (convId) {
          try {
            await createConversationMessage(convId, {
              sender_type: 'bot',
              message_text: assistantMessage.content,
            });
          } catch (err) {
            console.error(
              'Erro ao salvar mensagem do bot (template normal):',
              err
            );
          }
        }

        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar template selecionado:', error);

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content:
          'Desculpe, ocorreu um erro ao processar sua seleção. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      if (currentConversationId) {
        try {
          await createConversationMessage(currentConversationId, {
            sender_type: 'bot',
            message_text: errorMessage.content,
          });
        } catch (err) {
          console.error(
            'Erro ao salvar mensagem de erro do bot (template):',
            err
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCarousel = (data: CarouselData) => {
    setIsCarouselPreviewOpen(false);

    const slides = data.conteudos?.map(() => '') || [];

    addEditorTab({
      id: `chat-carousel-${Date.now()}`,
      title: `Carrossel do Chat - ${data.dados_gerais?.nome || 'Novo'}`,
      slides,
      carouselData: data,
    });

    navigate('/settings');
  };

  const handleSaveCarousel = async (data: CarouselData) => {
    setIsCarouselPreviewOpen(false);

    console.log('💾 Salvando carrossel:', data.dados_gerais?.nome);

    const successMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '✅ Carrossel salvo com sucesso na galeria!',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, successMessage]);

    if (currentConversationId) {
      try {
        await createConversationMessage(currentConversationId, {
          sender_type: 'bot',
          message_text: successMessage.content,
        });
      } catch (err) {
        console.error(
          'Erro ao salvar mensagem de sucesso do bot (carrossel):',
          err
        );
      }
    }
  };

  const handleContinueChat = () => {
    setIsCarouselPreviewOpen(false);
  };

  const handleWelcomeSend = (message: string) => {
    handleSendMessage(message);
  };

  const showWelcome = !currentConversationId && messages.length === 0;

  return (
    <div className="flex h-full flex-col text-[#1f2937] bg-transparent min-h-0 overflow-hidden">
      <main className="h-full flex flex-col min-h-0 overflow-hidden">
        {showWelcome ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="w-full max-w-3xl">
              <ChatWelcomeScreen
                onSendMessage={handleWelcomeSend}
                isLoading={isLoading}
                userName={getUserName()}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col w-full min-h-0 overflow-hidden">
            {/* Área de mensagens (único lugar com scroll) */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto min-h-0"
            >
              <div className="max-w-3xl mx-auto space-y-6 py-6">
                {messages.map((message) => {
                  const mdContent = message.content
                    .replace(/\r\n/g, '\n')   // normaliza quebra de linha Windows
                    .replace(/\/n/g, '\n\n'); // transforma "/n" em duas quebras de linha (parágrafo)
                    
                  return (
                    <div
                      key={message.id}
                      className={`group w-full flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="max-w-[50%] w-full">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200">
                          <div className="px-4 py-5 flex gap-4">
                            {message.role === 'assistant' ? (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#1f2937]/15 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-[#1f2937]" />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#1f2937]/15 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-[#1f2937]" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    ref={editInputRef}
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveEdit(message.id);
                                      }
                                      if (e.key === 'Escape') {
                                        handleCancelEdit();
                                      }
                                    }}
                                    className="w-full bg-white text-[#1f2937] placeholder-gray-400 rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                    rows={1}
                                    style={{ minHeight: '48px', maxHeight: '128px' }}
                                  />
                                  <div className="flex gap-2 justify-end mt-2">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-[#1f2937]"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(message.id)}
                                      disabled={!editingContent.trim()}
                                      className="px-3 py-1.5 text-sm bg-[#1f2937] hover:bg-gray-900 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="prose max-w-none prose-p:my-0 prose-headings:mb-2 prose-headings:mt-2 prose-ul:my-1 prose-ol:my-1 prose-strong:text-[#1f2937] prose-p:text-[#1f2937]">
                                    <ReactMarkdown>{mdContent}</ReactMarkdown>
                                  </div>

                                  {message.role === 'user' && !isLoading && (
                                    <button
                                      onClick={() =>
                                        handleStartEdit(message.id, message.content)
                                      }
                                      className="mt-2 text-sm text-[#1f2937] hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      Editar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="group w-full flex justify-start">
                    <div className="max-w-[50%] w-full">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200">
                        <div className="px-4 py-5 flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#1f2937]/15 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-[#1f2937]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#1f2937]" />
                              <span className="text-base text-[#1f2937]">
                                Pensando...
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {waitingForTemplate && !isLoading && (
                  <div className="group w-full flex justify-start">
                    <div className="max-w-[50%] w-full">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200">
                        <div className="px-4 py-5 flex gap-4 items-center">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[#1f2937]/15 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-[#1f2937]" />
                          </div>
                          <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 animate-pulse"
                          >
                            <span>✨ Escolher Template</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input fixo embaixo, fora do scroll */}
            <div className="flex-shrink-0 px-4 pb-4">
              <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-gray-300 focus-within:border-blue-500 transition-colors shadow-lg">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      waitingForTemplate
                        ? 'Aguardando seleção de template...'
                        : 'Digite sua mensagem...'
                    }
                    disabled={isLoading || waitingForTemplate}
                    rows={1}
                    className="flex-1 bg-transparent text-[#1f2937] placeholder-gray-400 px-2 py-2 focus:outline-none resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed max-h-32 font-medium"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading || waitingForTemplate}
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#1f2937]" />
                    ) : (
                      <Send className="w-5 h-5 text-[#1f2937]" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-2">
                  Pressione{' '}
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono text-[10px]">
                    Enter
                  </kbd>{' '}
                  para enviar ou{' '}
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono text-[10px]">
                    Shift + Enter
                  </kbd>{' '}
                  para nova linha
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {hasGeneratedCarousel && !isCarouselPreviewOpen && (
        <button
          onClick={() => setIsCarouselPreviewOpen(true)}
          className="fixed top-[140px] right-6 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-6 py-3 rounded-full shadow-glow border-2 border-primary-400 transition-all hover:scale-105 flex items-center gap-2 z-50"
        >
          <span className="font-semibold">🎨 Ver Carrossel</span>
        </button>
      )}

      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        postCode={postCode}
      />

      <CarouselPreviewModal
        isOpen={isCarouselPreviewOpen}
        onClose={() => setIsCarouselPreviewOpen(false)}
        carouselData={carouselData}
        onEdit={handleEditCarousel}
        onSave={handleSaveCarousel}
        onContinue={handleContinueChat}
      />

      <ToneSetupModal
        isOpen={showToneModal}
        onClose={closeToneModal}
        onComplete={completeToneSetup}
      />
    </div>
  );
};

export default ChatBotPage;