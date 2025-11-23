/**
 * ChatWelcomeScreen - Initial welcome screen for chat
 */

import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatWelcomeScreenProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  userName?: string;
}

const ChatWelcomeScreen: React.FC<ChatWelcomeScreenProps> = ({
  onSendMessage,
  isLoading,
  userName = 'User',
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '48px'; // Reset
      const newHeight = Math.min(textarea.scrollHeight, 128);
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isLoading) {
        console.log('🚀 Enviando mensagem do Welcome:', inputMessage);
        onSendMessage(inputMessage.trim());
        setInputMessage('');
      }
    }
  };

  const handleSend = () => {
    if (inputMessage.trim() && !isLoading) {
      console.log('🚀 Enviando mensagem do Welcome (botão):', inputMessage);
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  return (
    <div className="chat-welcome-screen">
      {/* Welcome Title */}
      <div className="chat-welcome-title text-[#1f2937]">
        Ei, {userName}. Tudo pronto para começar?
      </div>

      {/* Welcome Input */}
      <div className="chat-welcome-input-wrapper">
        <div className="relative flex items-end gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-3 border-2 border-gray-200 focus-within:border-blue-500 transition-colors shadow-lg">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem aqui..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 px-2 py-2 focus:outline-none resize-none overflow-hidden max-h-32 font-medium"
          />

          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-white shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Hint text */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Pressione <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono text-xs">Enter</kbd> para enviar ou <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono text-xs">Shift + Enter</kbd> para nova linha
        </p>
      </div>
    </div>
  );
};

export default ChatWelcomeScreen;
