import { NextResponse } from 'next/server';
import { updateChatwootConversationPriority } from '@/lib/chatwoot';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { priority } = await request.json();

    const data = await updateChatwootConversationPriority(id, priority);
    
    // Notifica outros clientes que a prioridade mudou
    chatwootBroadcast.notifyUpdate("priority_updated", { conversationId: id, priority });
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating conversation priority:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
