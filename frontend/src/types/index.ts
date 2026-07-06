export interface User {
  id: string;
  email: string;
  phone?: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan: string;
  monthly_message_limit: number;
  messages_used_this_month: number;
}

export interface Bot {
  id: string;
  workspace_id: string;
  name: string;
  language: string;
  channel: string;
  wa_phone_number_id?: string;
  wa_access_token?: string;
  system_prompt?: string;
  fallback_message?: string;
  human_handoff_enabled: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BotCreate {
  name: string;
  channel: string;
  wa_phone_number_id?: string;
  wa_access_token?: string;
  system_prompt?: string;
  fallback_message?: string;
  human_handoff_enabled?: boolean;
}

export interface Conversation {
  id: string;
  bot_id: string;
  channel: string;
  channel_user_id: string;
  user_display_name?: string;
  status: string;
  started_at: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  intent_detected?: string;
  confidence?: number;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  bot_id: string;
  type: string;
  question?: string;
  answer: string;
  item_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeItemCreate {
  type?: string;
  question?: string;
  answer: string;
  item_metadata?: Record<string, unknown>;
}

export interface Handoff {
  id: string;
  conversation_id: string;
  reason?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
}

export interface Analytics {
  total_bots?: number;
  active_bots?: number;
  total_conversations: number;
  total_messages?: number;
  messages_this_month?: number;
  messages_limit?: number;
  intent_breakdown: Record<string, number>;
  avg_response_time_ms?: number;
  bot_id?: string;
  bot_name?: string;
}
