import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  Conversation,
  CreateConversationInput,
  Message,
  Paginated,
  PageParams,
} from "@/types";

export async function fetchConversations(params: PageParams = {}) {
  const res = await apiClient.get<ApiResponse<Paginated<Conversation>>>("/conversations", {
    params,
  });
  return res.data.data;
}

export async function createConversation(input: CreateConversationInput) {
  const res = await apiClient.post<ApiResponse<Conversation>>("/conversations", input);
  return res.data.data;
}

export async function fetchMessages(conversationId: number, params: PageParams = {}) {
  const res = await apiClient.get<ApiResponse<Paginated<Message>>>(
    `/conversations/${conversationId}/messages`,
    { params },
  );
  return res.data.data;
}

export async function sendMessage(
  conversationId: number,
  input: { content?: string; attachment?: File },
  onUploadProgress?: (percent: number) => void,
) {
  const form = new FormData();
  if (input.content) form.append("content", input.content);
  if (input.attachment) form.append("attachment", input.attachment);

  const res = await apiClient.post<ApiResponse<Message>>(
    `/conversations/${conversationId}/messages`,
    form,
    {
      onUploadProgress: onUploadProgress
        ? (event) => {
            const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            onUploadProgress(percent);
          }
        : undefined,
    },
  );
  return res.data.data;
}
