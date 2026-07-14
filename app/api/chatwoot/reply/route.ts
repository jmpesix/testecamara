import { NextRequest, NextResponse } from 'next/server';
import { sendChatwootMessage, resolveChatwootConversation } from '@/lib/chatwoot';

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

    return NextResponse.json({ success: true, messageResult });
  } catch (error: any) {
    console.error('Error sending Chatwoot reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
