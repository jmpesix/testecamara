import { NextResponse } from 'next/server';
import { updateChatwootConversationPriority } from '@/lib/chatwoot';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';
import { addAuditLog } from '@/lib/audit-logs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { priority } = await request.json();

    const data = await updateChatwootConversationPriority(id, priority);
    
    // Adiciona log de auditoria
    try {
      const priorityLabels: Record<string, string> = {
        urgent: 'Urgente',
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa',
      };
      addAuditLog({
        tipo: 'status', // ou 'priority'
        acao: `Prioridade alterada para ${priorityLabels[priority] || priority || 'Nenhuma'}`,
        usuario: 'Assessor do Gabinete',
        alvo: `Protocolo #${id}`,
        detalhes: { priority }
      });
    } catch (e) {
      console.error('Erro ao adicionar log de auditoria:', e);
    }
    
    // Notifica outros clientes que a prioridade mudou
    chatwootBroadcast.notifyUpdate("priority_updated", { conversationId: id, priority });
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating conversation priority:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
