export interface Message {
  id: number;
  conversation_id?: number;
  contact_id?: number;
  contact_name: string;
  contact_avatar?: string;
  last_message?: string;
  message: string;
  time?: string;
  created_at?: string;
  status: 'open' | 'resolved' | 'pending' | 'snoozed' | 'active';
  type?: 'duvida' | 'reclamacao' | 'sugestao' | 'elogio';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | '';
  unread_count?: number;
  tags?: string[];
  labels?: string[];
  department?: string;
  assignee?: string;
  source?: string;
  inbox_id?: number;
  team_id?: number;
}
