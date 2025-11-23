/**
 * Service for Conversations API operations
 */

import { API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from './auth';
import type {
  Conversation,
  ConversationResponse,
  ConversationsListResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  GetConversationsParams,
  ConversationTokensResponse,
  DeleteResponse,
  GetMessagesParams,
  MessagesListResponse,
} from '../types/conversation';

/**
 * Create a new conversation
 */
export const createConversation = async (
  request?: CreateConversationRequest
): Promise<Conversation> => {
  const response = await fetch(API_ENDPOINTS.conversations, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request || {}),
  });

  const data: ConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to create conversation');
  }

  return data.data;
};

/**
 * List conversations with pagination
 */
export const getConversations = async (
  params?: GetConversationsParams
): Promise<ConversationsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${API_ENDPOINTS.conversations}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: ConversationsListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error('Failed to fetch conversations');
  }

  return data;
};

/**
 * Get a specific conversation by ID
 */
export const getConversation = async (id: string): Promise<Conversation> => {
  const response = await fetch(API_ENDPOINTS.conversation(id), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: ConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch conversation');
  }

  return data.data;
};

/**
 * Update a conversation's title
 */
export const updateConversation = async (
  id: string,
  request: UpdateConversationRequest
): Promise<Conversation> => {
  const response = await fetch(API_ENDPOINTS.conversation(id), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  const data: ConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update conversation');
  }

  return data.data;
};

/**
 * Delete a conversation (cascade deletes all messages)
 */
export const deleteConversation = async (id: string): Promise<void> => {
  const response = await fetch(API_ENDPOINTS.conversation(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data: DeleteResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete conversation');
  }
};

/**
 * Get total tokens used in a conversation (includes deleted messages)
 */
export const getConversationTokens = async (id: string): Promise<number> => {
  const response = await fetch(API_ENDPOINTS.conversationTokens(id), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: ConversationTokensResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error('Failed to fetch conversation tokens');
  }

  return data.data.total_tokens;
};

/**
 * Get messages for a conversation (history)
 * GET /api/conversations/:id/messages
 */
export const getConversationMessages = async (
  id: string,
  params?: GetMessagesParams
): Promise<MessagesListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${API_ENDPOINTS.conversationMessages(id)}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: MessagesListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error('Failed to fetch conversation messages');
  }

  return data;
};