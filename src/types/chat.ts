export interface ConversationParticipant {
  employee_id: number;
  full_name: string;
  employee_code: string;
}

export interface Conversation {
  id: number;
  is_group: 0 | 1;
  name: string | null;
  created_by: number;
  created_at: string;
  last_message_id: number | null;
  last_message_content: string | null;
  last_message_attachment_path: string | null;
  last_message_sent_at: string | null;
  last_message_sender_id: number | null;
  unread_count: number;
  participants: ConversationParticipant[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string | null;
  attachment_path: string | null;
  sent_at: string;
  is_deleted: 0 | 1;
}

export interface CreateConversationInput {
  participantIds: number[];
  isGroup?: boolean;
  name?: string;
}

export interface DirectoryEntry {
  id: number;
  full_name: string;
  employee_code: string;
  role_name: string;
}
