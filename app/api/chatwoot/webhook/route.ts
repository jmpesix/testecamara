import { NextResponse } from 'next/server';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';

/**
 * Endpoint de Webhook para receber eventos do Chatwoot em tempo real.
 * Você deve configurar a URL deste webhook no painel do Chatwoot:
 * URL: https://seu-dominio.com/api/chatwoot/webhook
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = payload.event;
    
    // Tenta extrair o ID da conversa de todas as formas possíveis que o Chatwoot envia
    const conversationId = 
      payload.conversation?.id || 
      payload.conversation_id || 
      (event && (event.startsWith('conversation') || event.startsWith('message')) ? (payload.conversation_id || payload.conversation?.id || payload.id) : undefined);

    console.log(`Webhook Chatwoot: [${event}] ConvID: ${conversationId}`);

    // Notifica todos os clientes conectados via SSE sobre o evento
    chatwootBroadcast.notifyUpdate(event, {
      ...payload,
      conversationId: conversationId ? Number(conversationId) : undefined
    });

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Erro ao processar webhook do Chatwoot:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
