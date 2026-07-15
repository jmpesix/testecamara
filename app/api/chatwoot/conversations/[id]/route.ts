import { NextResponse } from 'next/server';
import { getChatwootConversationDetails } from '@/lib/chatwoot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getChatwootConversationDetails(id);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('Chatwoot Conversation Details Error:', error);
    return NextResponse.json({ error: 'Falha ao buscar detalhes da conversa', details: error.message }, { status: 500 });
  }
}
