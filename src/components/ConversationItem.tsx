/**
 * ConversationItem - Individual conversation item in the sidebar
 */

import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import type { Conversation } from '../types/conversation';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
}) => {
  const { updateConversationTitle, removeConversation } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      try {
        await updateConversationTitle(conversation.id, editTitle.trim());
      } catch (error) {
        console.error('Failed to update title:', error);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title || '');
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Deseja realmente excluir esta conversa? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeConversation(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setIsDeleting(false);
    }
  };

  const displayTitle = conversation.title || 'Nova Conversa';

  return (
    <li>
      <div
        onClick={isEditing ? undefined : onSelect}
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
          border-b border-gray-200 last:border-b-0
          bg-white/90 backdrop-blur-md
          text-[rgb(31,41,55)]
          ${isActive ? 'bg-gray-100' : 'hover:bg-white'}
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Ícone */}
        {!isEditing && (
          <div className="flex-shrink-0 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="text-[rgb(31,41,55)]"
            >
              <path d="M2.6687 9.06641V6.93359C2.6687 6.19531 2.66841 5.60938 2.71655 5.13867C2.76533 4.66113 2.86699 4.25391 3.10425 3.88086L3.25854 3.66016C3.64272 3.15918 4.19392 2.75195 4.85229 2.48242L5.02905 2.41602C5.44666 2.27344 5.90133 2.20703 6.42358 2.17383C7.01272 2.13672 7.74445 2.13672 8.66675 2.13672H9.16675C9.53393 2.13672 9.83165 2.43457 9.83179 2.80176C9.83179 3.16895 9.53402 3.4668 9.16675 3.4668H8.66675C7.7226 3.4668 7.05438 3.46973 6.53198 3.50293C6.14611 3.5293 5.87277 3.57227 5.65601 3.62695L5.45581 3.68555C5.01645 3.83691 4.64872 4.0957 4.39233 4.42578L4.28979 4.56836C4.16388 4.75977 4.08381 5.01367 4.04175 5.42188C3.99906 5.83984 3.99878 6.38574 3.99878 7.06055V9.03906C3.99878 9.71387 3.99906 10.2598 4.04175 10.6777C4.08381 11.0859 4.16389 11.3398 4.28979 11.5312L4.39233 11.6738C4.64871 12.0039 5.01648 12.2627 5.45581 12.4141L5.65601 12.4727C5.87276 12.5273 6.14614 12.5703 6.53198 12.5977C7.05439 12.6309 7.72256 12.6309 8.66675 12.6309H10.667C11.6112 12.6309 12.2794 12.6309 12.8018 12.5977C13.2162 12.5703 13.4895 12.5273 13.7063 12.4727L13.9065 12.4141C14.3458 12.2627 14.7136 12.0039 14.97 11.6738L15.0725 11.5312C15.1984 11.3398 15.2785 11.0859 15.3205 10.6777C15.3632 10.2598 15.3635 9.71387 15.3635 9.03906V8.53906C15.3636 8.17188 15.6615 7.87402 16.0285 7.87402C16.3957 7.87402 16.6934 8.17188 16.6936 8.53906V9.03906C16.6936 9.71387 16.6948 10.4453 16.6467 11.0352C16.604 11.5586 16.5202 12.0137 16.3409 12.4316L16.258 12.6084C15.9227 13.2676 15.4125 13.8184 14.7864 14.2031L14.5109 14.3574C14.045 14.5957 13.5356 14.6982 12.9386 14.7461C12.3495 14.7949 11.6177 14.7949 10.6954 14.7949H8.66675C7.74446 14.7949 7.01271 14.7949 6.42358 14.7461C5.90135 14.7031 5.44665 14.6191 5.02905 14.4395L4.85229 14.3574C4.19396 14.0217 3.64271 13.4697 3.25854 12.8438L3.10425 12.5684C2.86697 12.1021 2.76534 11.5586 2.71655 10.9609C2.66841 10.4453 2.6687 9.71387 2.6687 9.06641Z" />
            </svg>
          </div>
        )}

        {/* Conteúdo / edição */}
        <div className="flex-1 min-w-0 flex items-center">
          {isEditing ? (
            <div
              className="flex w-full items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-1 text-sm bg-white text-[rgb(31,41,55)] border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título da conversa"
                autoFocus
                maxLength={100}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-green-600 hover:bg-gray-100 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-500 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex-1 truncate text-sm font-medium text-[rgb(31,41,55)]">
              {displayTitle}
            </div>
          )}
        </div>

        {/* Ações */}
        {!isEditing && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              title="Editar título"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
              title="Excluir conversa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

export default ConversationItem;