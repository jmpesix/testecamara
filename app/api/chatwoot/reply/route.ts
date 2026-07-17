import { NextRequest, NextResponse } from 'next/server';
import { sendChatwootMessage, resolveChatwootConversation } from '@/lib/chatwoot';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content, resolve } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
    }

    // Envia a mensagem
    const messageResult = await sendChatwootMessage(conversationId, content);

    // Se solicitado, resolve a conversa
    if (resolve) {
      await resolveChatwootConversation(conversationId);
    }

    // Notifica outros clientes que houve uma nova mensagem/resposta
    chatwootBroadcast.notifyUpdate("message_sent", { conversationId });

    return NextResponse.json({ success: true, messageResult });
  } catch (error: any) {
    console.error('Error sending Chatwoot reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
