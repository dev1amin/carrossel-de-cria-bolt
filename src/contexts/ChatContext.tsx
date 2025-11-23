/**
 * Chat Context for managing conversations and messages state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Conversation,
  ConversationMessage,
  PaginationInfo,
} from '../types/conversation';
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
} from '../services/conversations';
import {
  getMessages,
  createMessage,
  deleteMessage,
} from '../services/messages';

interface ChatContextType {
  // Conversations state
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsPagination: PaginationInfo | null;
  activeConversation: Conversation | null;
  
  // Messages state
  messages: ConversationMessage[];
  messagesLoading: boolean;
  messagesPagination: PaginationInfo | null;
  
  // Conversation operations
  loadConversations: (offset?: number) => Promise<void>;
  createNewConversation: (title?: string) => Promise<Conversation>;
  setActiveConversationById: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
  
  // Message operations
  loadMessages: (conversationId: string, offset?: number) => Promise<void>;
  sendMessage: (text: string, tokensUsed?: number) => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
  
  // UI state
  isSending: boolean;
  error: string | null;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsPagination, setConversationsPagination] = useState<PaginationInfo | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesPagination, setMessagesPagination] = useState<PaginationInfo | null>(null);
  
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Load conversations list
  const loadConversations = useCallback(async (offset: number = 0) => {
    try {
      setConversationsLoading(true);
      setError(null);
      
      const response = await getConversations({ limit: 50, offset });
      
      if (offset === 0) {
        setConversations(response.data);
      } else {
        setConversations(prev => [...prev, ...response.data]);
      }
      
      setConversationsPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      console.error('Error loading conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Create new conversation
  const createNewConversation = useCallback(async (title?: string): Promise<Conversation> => {
    try {
      setError(null);
      const newConversation = await createConversation(title ? { title } : undefined);
      
      // Add to beginning of list (most recent)
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      setMessages([]);
      setMessagesPagination(null);
      
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, []);

  // Set active conversation and load its messages
  const setActiveConversationById = useCallback(async (id: string) => {
    try {
      setError(null);
      const conversation = conversations.find(c => c.id === id);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      setActiveConversation(conversation);
      await loadMessages(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set active conversation';
      setError(errorMessage);
      console.error('Error setting active conversation:', err);
    }
  }, [conversations]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      setError(null);
      const updated = await updateConversation(id, { title });
      
      // Update in list
      setConversations(prev => 
        prev.map(c => c.id === id ? updated : c)
      );
      
      // Update active if it's the current one
      if (activeConversation?.id === id) {
        setActiveConversation(updated);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation';
      setError(errorMessage);
      console.error('Error updating conversation:', err);
      throw err;
    }
  }, [activeConversation]);

  // Delete conversation
  const removeConversation = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteConversation(id);
      
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== id));
      
      // Clear active if it was deleted
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
        setMessagesPagination(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      console.error('Error deleting conversation:', err);
      throw err;
    }
  }, [activeConversation]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, offset: number = 0) => {
    try {
      setMessagesLoading(true);
      setError(null);
      
      const response = await getMessages(conversationId, { limit: 50, offset });
      
      if (offset === 0) {
        setMessages(response.data);
      } else {
        setMessages(prev => [...prev, ...response.data]);
      }
      
      setMessagesPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (text: string, tokensUsed?: number) => {
    if (!activeConversation) {
      setError('No active conversation');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      
      const newMessage = await createMessage(activeConversation.id, {
        sender_type: 'user',
        message_text: text,
        tokens_used: tokensUsed,
      });
      
      // Add message to beginning (most recent)
      setMessages(prev => [newMessage, ...prev]);
      
      // Update conversation's last_message_at
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConversation.id
            ? { ...c, last_message_at: newMessage.created_at, updated_at: newMessage.created_at }
            : c
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [activeConversation]);

  // Delete a message (soft delete)
  const removeMessage = useCallback(async (messageId: string) => {
    if (!activeConversation) {
      setError('No active conversation');
      return;
    }

    try {
      setError(null);
      const deletedMessage = await deleteMessage(activeConversation.id, messageId);
      
      // Update message in list with deleted_at timestamp
      setMessages(prev =>
        prev.map(m => m.id === messageId ? deletedMessage : m)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [activeConversation]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const value: ChatContextType = {
    conversations,
    conversationsLoading,
    conversationsPagination,
    activeConversation,
    messages,
    messagesLoading,
    messagesPagination,
    loadConversations,
    createNewConversation,
    setActiveConversationById,
    updateConversationTitle,
    removeConversation,
    loadMessages,
    sendMessage,
    removeMessage,
    isSending,
    error,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
