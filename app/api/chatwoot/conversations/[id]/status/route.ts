import { NextResponse } from 'next/server';
import { updateChatwootConversationStatus } from '@/lib/chatwoot';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';
import { addAuditLog } from '@/lib/audit-logs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const data = await updateChatwootConversationStatus(id, status);
    
    // Adiciona log de auditoria
    try {
      const statusLabels: Record<string, string> = {
        open: 'Aberto',
        resolved: 'Arquivado',
        pending: 'Pendente',
        snoozed: 'Adiado'
      };
      addAuditLog({
        tipo: 'status',
        acao: `Status alterado para ${statusLabels[status] || status}`,
        usuario: 'Assessor do Gabinete',
        alvo: `Protocolo #${id}`,
        detalhes: { status }
      });
    } catch (e) {
      console.error('Erro ao adicionar log de auditoria:', e);
    }
    
    // Notifica outros clientes que o status mudou
    chatwootBroadcast.notifyUpdate("status_updated", { conversationId: id, status });
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
