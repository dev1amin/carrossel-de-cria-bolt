import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import PageTitle from '../components/PageTitle';
import { TemplateSelectionModal } from '../components/carousel';
import { CarouselPreviewModal } from '../components/carousel/CarouselPreviewModal';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import type { CarouselData } from '../types/carousel';
import {
  sendChatMessage,
  parseTemplateSelectionTrigger,
  parseCarouselData,
  generateMessageId,
  ChatMessage,
} from '../services/chatbot';

const ChatBotPage: React.FC = () => {
  const location = useLocation();
  const initialMessage = location.state?.initialMessage || '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateMessageId(),
      role: 'assistant',
      content: 'Olá! Sou seu assistente de criação de carrosséis. Como posso ajudar você hoje?',
      timestamp: new Date(),
    },
  ]);
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !isLoading) {
      handleSendMessage();
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '48px'; // Reset
      const newHeight = Math.min(textarea.scrollHeight, 128);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputMessage]);

  // Obter userId do localStorage
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userId = getUserId();
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Adiciona mensagem do usuário
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Envia mensagem para o chatbot
      const responses = await sendChatMessage(userId, userMessage.content);

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;
        
        // Primeiro, verifica se há dados de carrossel
        const carouselCheck = parseCarouselData(botResponse);
        
        if (carouselCheck.hasCarousel) {
          // Adiciona APENAS a mensagem "O que achou do carrossel?"
          const followUpMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: 'O que achou do carrossel?',
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, followUpMessage]);
          
          // Salva o carrossel, marca como gerado e ABRE o modal automaticamente
          setCarouselData(carouselCheck.carouselData);
          setHasGeneratedCarousel(true);
          setIsCarouselPreviewOpen(true);
          return;
        }
        
        // Se não for carrossel, verifica se há trigger de seleção de template
        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(botResponse);

        // Adiciona resposta do bot
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Se houver trigger de template, marca para esperar seleção
        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Adiciona mensagem de erro
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  // Inicia edição de mensagem
  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  // Cancela edição
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Salva mensagem editada e reenvia
  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;

    const userId = getUserId();
    
    // Remove todas as mensagens a partir da editada (usuário + bot)
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    
    // Adiciona mensagem editada
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

    try {
      // Envia mensagem editada para o chatbot
      const responses = await sendChatMessage(userId, editedMessage.content);

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;
        
        // Verifica se há dados de carrossel
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
          return;
        }
        
        // Verifica trigger de seleção de template
        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(botResponse);

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao reenviar mensagem editada:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem editada. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resize textarea de edição
  useEffect(() => {
    const textarea = editInputRef.current;
    if (textarea && editingMessageId) {
      textarea.style.height = '48px';
      const newHeight = Math.min(textarea.scrollHeight, 128);
      textarea.style.height = `${newHeight}px`;
      textarea.focus();
    }
  }, [editingContent, editingMessageId]);

  const handleTemplateSelect = async (templateId: string) => {
    setIsTemplateModalOpen(false);
    setWaitingForTemplate(false); // Limpa o estado de espera

    // Extrai o nome do template (ex: "Template 6")
    const templateName = `Template ${templateId}`;

    // Envia o nome do template como mensagem do usuário
    const userId = getUserId();
    const templateMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: templateName,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, templateMessage]);
    setIsLoading(true);

    try {
      const responses = await sendChatMessage(userId, templateName);

      if (responses && responses.length > 0) {
        const botResponse = responses[0].output;
        
        // Primeiro verifica se há carrossel
        const carouselCheck = parseCarouselData(botResponse);
        
        if (carouselCheck.hasCarousel) {
          const assistantMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: carouselCheck.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          
          // Abre popup de preview do carrossel
          setCarouselData(carouselCheck.carouselData);
          setIsCarouselPreviewOpen(true);
          return;
        }
        
        // Se não, verifica trigger de template
        const { message, hasTemplateTrigger } = parseTemplateSelectionTrigger(botResponse);

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Se houver outro trigger, marca para esperar novamente
        if (hasTemplateTrigger) {
          setWaitingForTemplate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar template selecionado:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua seleção. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();
  const { addEditorTab } = useEditorTabs();

  // Handler para editar carrossel
  const handleEditCarousel = (data: CarouselData) => {
    setIsCarouselPreviewOpen(false);
    
    // Cria slides vazios baseados no número de conteúdos
    const slides = data.conteudos?.map(() => '') || [];
    
    // Adiciona uma nova aba no editor com os dados do carrossel
    addEditorTab({
      id: `chat-carousel-${Date.now()}`,
      title: `Carrossel do Chat - ${data.dados_gerais?.nome || 'Novo'}`,
      slides,
      carouselData: data,
    });
    
    // Navega para a página de configurações (editor)
    navigate('/settings');
  };

  // Handler para salvar carrossel
  const handleSaveCarousel = async (data: CarouselData) => {
    setIsCarouselPreviewOpen(false);
    
    // TODO: Implementar salvamento na galeria via API
    // Por enquanto, apenas mostra mensagem de sucesso
    console.log('💾 Salvando carrossel:', data.dados_gerais?.nome);
    
    const successMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '✅ Carrossel salvo com sucesso na galeria!',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, successMessage]);
  };

  // Handler para continuar no chat
  const handleContinueChat = () => {
    setIsCarouselPreviewOpen(false);
    // Mantém hasGeneratedCarousel true para o botão continuar visível
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="chatbot" />
      
      <div className="md:ml-16">
        {/* Title with Back Button */}
        <div className="relative">
          <PageTitle title="Chat de Criação" />
          <button
            onClick={() => navigate('/create-carousel')}
            className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>

        {/* Main Chat Container - Fixed height, no global scroll */}
        <main className="fixed top-[64px] bottom-0 left-0 right-0 md:left-16 bg-transparent">
          <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
            {/* Messages Area - Scrollable */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto py-8 px-4 space-y-6 min-h-0"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white border border-white/10'
                    }`}
                  >
                    {/* Modo de edição */}
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          ref={editInputRef}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(message.id);
                            }
                            if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full glass-card text-white placeholder-white/40 rounded-lg px-2 py-1 border border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                          rows={1}
                          style={{ minHeight: '48px', maxHeight: '128px' }}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs glass-card hover:bg-primary-500/20 rounded-lg transition-colors text-white"
                          >
                            Cancelar (Esc)
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            disabled={!editingContent.trim()}
                            className="px-3 py-1 text-xs bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-lg transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Salvar (Enter)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${
                            message.role === 'user' ? 'text-black/60' : 'text-white/60'
                          }`}>
                            {message.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          
                          {/* Botão de editar apenas para mensagens do usuário */}
                          {message.role === 'user' && !isLoading && (
                            <button
                              onClick={() => handleStartEdit(message.id, message.content)}
                              className="text-xs text-black/60 hover:text-black transition-colors ml-2 underline"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-black" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="text-sm text-white/60">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de escolher template quando esperando */}
              {waitingForTemplate && !isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-white text-black px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 animate-pulse"
                  >
                    <span>✨ Escolher Template</span>
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-primary-500/20 px-4 py-4 glass-card">
              <div className="flex gap-2 items-end mb-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={waitingForTemplate ? "Aguardando seleção de template..." : "Digite sua mensagem..."}
                    disabled={isLoading || waitingForTemplate}
                    rows={1}
                    className="w-full glass-card text-white placeholder-white/40 rounded-xl px-4 py-3 border border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: '48px',
                      maxHeight: '128px',
                    }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || waitingForTemplate}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-glow"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              
              {/* Disclaimer text */}
              <p className="text-xs text-white/40 text-center">
                As suas mensagens não são salvas
              </p>
            </div>
          </div>
        </main>

        {/* Floating Carousel Button */}
        {hasGeneratedCarousel && !isCarouselPreviewOpen && (
          <button
            onClick={() => setIsCarouselPreviewOpen(true)}
            className="fixed top-[140px] right-6 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-6 py-3 rounded-full shadow-glow border-2 border-primary-400 transition-all hover:scale-105 flex items-center gap-2 z-50"
          >
            <span className="font-semibold">🎨 Ver Carrossel</span>
          </button>
        )}
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        postCode={postCode}
      />

      {/* Carousel Preview Modal */}
      <CarouselPreviewModal
        isOpen={isCarouselPreviewOpen}
        onClose={() => setIsCarouselPreviewOpen(false)}
        carouselData={carouselData}
        onEdit={handleEditCarousel}
        onSave={handleSaveCarousel}
        onContinue={handleContinueChat}
      />
    </div>
  );
};

export default ChatBotPage;