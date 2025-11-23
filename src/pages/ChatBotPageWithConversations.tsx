/**
 * ChatBotPageWithConversations - ChatGPT-style layout with sidebar
 */

import React, { useState, useEffect } from 'react';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import ConversationList from '../components/ConversationList';
import ChatBotPage from './ChatBotPage';
import Navigation from '../components/Navigation';
import { MouseFollowLight } from '../components/MouseFollowLight';

interface ChatBotPageContentProps {
  newChatKey: number;
  onNewChat: () => void;
}

const ChatBotPageContent: React.FC<ChatBotPageContentProps> = ({
  newChatKey,
  onNewChat,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { activeConversation } = useChat();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-full w-full flex-col min-h-0 overflow-hidden">
      <div className="relative flex h-full w-full flex-1 transition-colors z-0 min-h-0 overflow-hidden">
        <div className="relative flex h-full w-full flex-row min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`
              relative z-20 h-full shrink-0 overflow-hidden
              ${isMobile ? 'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50' : ''}
              print:hidden
              transition-transform duration-200 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
            style={{ width: '260px' }}
          >
            <ConversationList
              onNewConversation={() => {
                onNewChat(); // só reseta pro welcome
                if (isMobile) setIsSidebarOpen(false);
              }}
            />
          </div>

          {/* Overlay mobile */}
          {isMobile && isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Área principal do chat */}
          <div className="relative flex h-full max-w-full min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
            {/* Header mobile */}
            <div className="h-14 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center border-b border-gray-200 px-2 md:hidden print:hidden">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  className="hover:text-gray-700 inline-flex h-9 w-9 items-center justify-center rounded-md focus:outline-none"
                  onClick={toggleSidebar}
                  aria-label="Abrir barra lateral"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#1f2937" className="w-5 h-5">
                    <circle cx="15" cy="6" r="4" fill="#0285FF" />
                    <path d="M11.8008 12.6826C12.1036 12.7448 12.3311 13.0128 12.3311 13.334C12.3307 13.6549 12.1034 13.9232 11.8008 13.9854L11.666 13.999H3.33301C2.96607 13.9989 2.66832 13.7009 2.66797 13.334C2.66797 12.9668 2.96585 12.6691 3.33301 12.6689H11.666L11.8008 12.6826Z" />
                    <path d="M9.16992 6.00195C9.17007 6.45966 9.22432 6.90473 9.32422 7.33203H3.33301C2.96596 7.3319 2.66814 7.03403 2.66797 6.66699C2.66797 6.2998 2.96585 6.00209 3.33301 6.00195H9.16992Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat interno – SEM scroll geral, só na área de mensagens lá dentro */}
            <main className="relative h-full w-full flex-1 overflow-hidden min-h-0">
              <ChatBotPage
                conversationId={activeConversation?.id}
                newChatKey={newChatKey}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBotPageWithConversations: React.FC = () => {
  const [newChatKey, setNewChatKey] = useState(0);

  return (
    <ChatProvider>
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <Navigation currentPage="chatbot" />

        {/* Área principal depois da navbar */}
        <div
          className="relative flex-1 flex min-h-0 overflow-hidden"
          style={{ marginLeft: '5.1rem' }}
        >
          <MouseFollowLight zIndex={-1} />

          {/* Grid de fundo */}
          <div
            className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Orbs */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              left: '8%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.3,
              filter: 'blur(80px)',
              animation: 'float 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '5%',
              right: '12%',
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.25,
              filter: 'blur(70px)',
              animation: 'float 10s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '40%',
              left: '5%',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.2,
              filter: 'blur(75px)',
              animation: 'float 11s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '45%',
              right: '8%',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.28,
              filter: 'blur(65px)',
              animation: 'float 9s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '15%',
              left: '15%',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.22,
              filter: 'blur(70px)',
              animation: 'float 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '20%',
              right: '20%',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.26,
              filter: 'blur(68px)',
              animation: 'float 13s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '25%',
              left: '45%',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.18,
              filter: 'blur(60px)',
              animation: 'float 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '70%',
              left: '35%',
              width: '230px',
              height: '230px',
              borderRadius: '50%',
              background:
                'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
              opacity: 0.24,
              filter: 'blur(72px)',
              animation: 'float 14s ease-in-out infinite reverse',
            }}
          />

          {/* Vidro global leve */}
          <main className="relative z-10 flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 flex bg-white/25 backdrop-blur-xl min-h-0 overflow-hidden">
              <ChatBotPageContent
                newChatKey={newChatKey}
                onNewChat={() => setNewChatKey((k) => k + 1)}
              />
            </div>
          </main>
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatBotPageWithConversations;