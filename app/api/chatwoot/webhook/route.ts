import { NextResponse } from 'next/server';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';
import { syncSingleConversationToSupabase, upsertMensagemCamara } from '@/lib/supabase';

/**
 * Endpoint de Webhook para receber eventos do Chatwoot em tempo real.
 * Você deve configurar a URL deste webhook no painel do Chatwoot:
 * URL: https://seu-dominio.com/api/chatwoot/webhook
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = payload.event;
    
    // Log para depuração profunda - REMOVER EM PRODUÇÃO se o tráfego for alto
    console.log(`[DEBUG Webhook Raw] Event: ${event} Payload:`, JSON.stringify(payload, null, 2));
    
    // Extração precisa do conversationId baseado no tipo de evento do Chatwoot
    let conversationId: number | undefined;

    if (event && event.startsWith('message')) {
      // Em eventos de mensagem, o ID da conversa está dentro do objeto conversation
      conversationId = payload.conversation?.id || payload.conversation_id;
    } else if (event && event.startsWith('conversation')) {
      // Em eventos de conversa, o ID pode estar no root ou dentro de conversation
      conversationId = payload.id || payload.conversation?.id || payload.conversation_id;
    }

    console.log(`>>> Webhook Chatwoot: [${event}] ConvID: ${conversationId} PayloadID: ${payload.id} Inbox: ${payload.inbox_id || payload.inbox?.id} Account: ${payload.account_id || payload.account?.id}`);

    // Se temos o ID da conversa, sincroniza o atendimento correspondente no Supabase de forma imediata
    if (conversationId) {
      try {
        console.log(`[Webhook] Processando evento ${event} for conversa ${conversationId}...`);
        // Sincroniza os detalhes da conversa e mensagens, passando o payload como fallback
        const result = await syncSingleConversationToSupabase(Number(conversationId), payload);
        if (result) {
          console.log(`[Webhook] Sucesso: Conversa ${conversationId} sincronizada. Status: ${result.status}`);
        } else {
          console.warn(`[Webhook] Aviso: Sincronização da conversa ${conversationId} não retornou dados.`);
        }
      } catch (dbError: any) {
        console.error(`[Webhook] Erro fatal na sincronização:`, dbError.message);
      }
    }

    // Se for um evento de mensagem, salva a mensagem individualmente para histórico local
    if (event === 'message_created' || event === 'message_updated') {
      try {
        console.log(`Salvando mensagem ${payload.id} da conversa ${conversationId} no Supabase...`);
        await upsertMensagemCamara(payload);
      } catch (msgError: any) {
        console.error(`Erro ao salvar mensagem no Supabase via webhook:`, msgError.message);
      }
    }

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
