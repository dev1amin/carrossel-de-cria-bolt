/**
 * ConversationList - Sidebar component for displaying list of conversations
 */

import React, { useRef, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  onNewConversation: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onNewConversation }) => {
  const {
    conversations,
    conversationsLoading,
    conversationsPagination,
    activeConversation,
    loadConversations,
    setActiveConversationById,
  } = useChat();

  const listRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Infinite scroll handler
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      if (loadingRef.current || conversationsLoading) return;
      
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const scrolledToBottom = scrollHeight - scrollTop <= clientHeight + 100;

      if (scrolledToBottom && conversationsPagination?.has_more) {
        loadingRef.current = true;
        loadConversations(conversationsPagination.offset + conversationsPagination.limit)
          .finally(() => {
            loadingRef.current = false;
          });
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [conversationsLoading, conversationsPagination, loadConversations]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationById(id);
  };

  return (
    <div className="relative flex h-full flex-col bg-white/80 backdrop-blur-md">
      {/* Sidebar Content */}
      <div className="opacity-100 h-full w-full overflow-x-clip overflow-y-auto text-clip whitespace-nowrap">
        <nav className="relative flex h-full w-full flex-1 flex-col overflow-y-auto" aria-label="Histórico de chats">
          {/* Sticky Header */}
          <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30">
            <div className="px-2">
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={() => {
                    // limpa conversa ativa no contexto
                    try {
                      setActiveConversationById(''); // força "nenhuma conversa"
                    } catch (e) {
                      console.error('Erro ao limpar activeConversation:', e);
                    }
                    onNewConversation(); // volta pro welcome (reset do ChatBotPage)
                  }}
                  className="group flex items-center gap-2 w-full rounded-lg hover:bg-white/60 p-2 transition-colors"
                  data-testid="create-new-chat-button"
                >
                  <div className="flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-[#1f2937]">
                      <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333Z" />
                    </svg>
                  </div>
                  <div className="flex min-w-0 grow items-center">
                    <div className="truncate text-[#1f2937] text-sm font-medium">Novo chat</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Conversations Section */}
          <div className="pb-1" ref={listRef}>
            <h2 className="px-2 text-xs font-semibold text-[#1f2937] mb-2 mt-2">Seus chats</h2>
            {conversations.length === 0 && !conversationsLoading ? (
              <div className="text-center text-[#1f2937] py-8 px-4">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs mt-1 opacity-70">Crie uma nova conversa para começar</p>
              </div>
            ) : (
              <ol className="divide-y divide-white/10">
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversation?.id === conversation.id}
                    onSelect={() => handleSelectConversation(conversation.id)}
                  />
                ))}
              </ol>
            )}

            {conversationsLoading && conversations.length > 0 && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-[#1f2937] animate-spin" />
              </div>
            )}
          </div>
        </nav>
      </div>

      {conversationsPagination && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-white/80 backdrop-blur-md">
          <p className="text-xs text-[#1f2937] text-center">
            {conversationsPagination.total} conversa
            {conversationsPagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationList;