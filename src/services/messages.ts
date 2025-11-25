/**
 * Service for Conversation Messages API operations
 */

import { API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from './auth';
import { fetchWithAuth } from './fetchWithAuth';
import type {
  ConversationMessage,
  MessageResponse,
  MessagesListResponse,
  CreateMessageRequest,
  GetMessagesParams,
} from '../types/conversation';

/**
 * Create a new message in a conversation
 */
export const createMessage = async (
  conversationId: string,
  request: CreateMessageRequest
): Promise<ConversationMessage> => {
  const response = await fetchWithAuth(API_ENDPOINTS.conversationMessages(conversationId), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  const data: MessageResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to create message');
  }

  return data.data;
};

/**
 * List messages in a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  params?: GetMessagesParams
): Promise<MessagesListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${API_ENDPOINTS.conversationMessages(conversationId)}?${queryParams.toString()}`;

  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: MessagesListResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error('Failed to fetch messages');
  }

  return data;
};

/**
 * Get a specific message by ID
 */
export const getMessage = async (
  conversationId: string,
  messageId: string
): Promise<ConversationMessage> => {
  const response = await fetch(
    API_ENDPOINTS.conversationMessage(conversationId, messageId),
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const data: MessageResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch message');
  }

  return data.data;
};

/**
 * Delete a message (soft delete - sets deleted_at timestamp)
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<ConversationMessage> => {
  const response = await fetch(
    API_ENDPOINTS.conversationMessage(conversationId, messageId),
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  );

  const data: MessageResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete message');
  }

  return data.data;
};
