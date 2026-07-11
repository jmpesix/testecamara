export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Priority = 'low' | 'medium' | 'high';
export type Category = 'Saúde' | 'Infraestrutura' | 'Educação' | 'Segurança' | 'Outros';

export interface Message {
  id: number;
  account_id: number;
  conversation_id: number;
  protocol?: string;
  contact_id?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  message: string;
  total_mensagens?: number;
  resumo?: string;
  sentiment?: string;
  urgency?: string;
  priority?: string;
  theme?: string;
  vereador_assigned?: string;
  suggested_response?: string;
  source?: string;
  status?: string;
  assignee?: string | null;
  labels?: string[];
  inbox_id?: number;
  custom_attributes?: Record<string, any>;
  data_processamento?: string;
  created_at: string;
  updated_at: string;
}
