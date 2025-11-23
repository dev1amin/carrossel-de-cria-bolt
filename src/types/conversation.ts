/**
 * Types for Conversations and Messages API
 * Based on API documentation
 */

export type SenderType = 'user' | 'bot';

export interface Conversation {
  id: string;
  business_id: string;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  message_text: string;
  tokens_used: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// API Request Types
export interface CreateConversationRequest {
  title?: string;
}

export interface UpdateConversationRequest {
  title?: string | null;
}

export interface CreateMessageRequest {
  sender_type: SenderType;
  message_text: string;
  tokens_used?: number;
}

export interface GetConversationsParams {
  limit?: number;
  offset?: number;
}

export interface GetMessagesParams {
  limit?: number;
  offset?: number;
}

// API Response Types
export interface ConversationResponse {
  success: boolean;
  message?: string;
  data: Conversation;
}

export interface ConversationsListResponse {
  success: boolean;
  data: Conversation[];
  pagination: PaginationInfo;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  data: ConversationMessage;
}

export interface MessagesListResponse {
  success: boolean;
  data: ConversationMessage[];
  pagination: PaginationInfo;
}

export interface ConversationTokensResponse {
  success: boolean;
  data: {
    conversation_id: string;
    total_tokens: number;
  };
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  needs_business_setup?: boolean;
}
