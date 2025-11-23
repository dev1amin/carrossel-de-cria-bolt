/**
 * MessageBubble - Component for displaying chat messages
 */

import React from 'react';
import { Bot, User, Trash2 } from 'lucide-react';
import type { ConversationMessage } from '../types/conversation';

interface MessageBubbleProps {
  message: ConversationMessage;
  onDelete?: (messageId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onDelete }) => {
  const isUser = message.sender_type === 'user';
  const isDeleted = message.deleted_at !== null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = () => {
    if (onDelete && !isDeleted) {
      if (confirm('Deseja realmente excluir esta mensagem?')) {
        onDelete(message.id);
      }
    }
  };

  if (isDeleted) {
    return (
      <div className="flex items-center justify-center my-2">
        <p className="text-xs text-gray-400 italic">
          Mensagem excluída
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4 group`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}
          `}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`
            relative px-4 py-3 rounded-2xl
            ${isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-900 rounded-tl-none'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.message_text}
          </p>

          {/* Delete button - only shown on hover for user messages */}
          {isUser && onDelete && (
            <button
              onClick={handleDelete}
              className="absolute -right-8 top-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Excluir mensagem"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Timestamp and tokens */}
        <div className={`flex items-center gap-2 mt-1 px-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {message.tokens_used !== null && message.tokens_used > 0 && (
            <span className="text-xs text-gray-400">
              • {message.tokens_used} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
