import { Message } from '@/types';

export const mockMessages: Message[] = [
  {
    id: 1,
    account_id: 1,
    conversation_id: 123,
    contact_name: 'João Silva',
    message: 'Olá, gostaria de solicitar a manutenção da iluminação pública na Rua das Flores. Está muito escuro à noite.',
    resumo: 'Pedido de manutenção de iluminação pública.',
    sentiment: 'neutro',
    priority: 'média',
    theme: 'Infraestrutura',
    source: 'Caixa #3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'aberto'
  },
  {
    id: 2,
    account_id: 1,
    conversation_id: 124,
    contact_name: 'Maria Oliveira',
    message: 'Estou muito satisfeita com a nova creche inaugurada no bairro. Meus filhos estão sendo muito bem atendidos.',
    resumo: 'Elogio à nova creche do bairro.',
    sentiment: 'positivo',
    priority: 'baixa',
    theme: 'Educação',
    source: 'Equipe #1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'aberto'
  },
  {
    id: 3,
    account_id: 1,
    conversation_id: 125,
    contact_name: 'Carlos Santos',
    message: 'O posto de saúde aqui perto está sem médicos faz duas semanas. Isso é um absurdo!',
    resumo: 'Falta de médicos em posto de saúde.',
    sentiment: 'negativo',
    priority: 'alta',
    theme: 'Saúde',
    source: 'Equipe #2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'aberto'
  }
];
