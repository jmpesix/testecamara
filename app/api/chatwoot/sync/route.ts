import { NextResponse } from 'next/server';
import { getChatwootConversations, getChatwootMessages } from '@/lib/chatwoot';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';
import { addAuditLog } from '@/lib/audit-logs';
import { upsertAtendimento, insertAuditLog, getAtendimentosFromSupabase, syncSingleConversationToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isQuick = searchParams.get('quick') === 'true';
    const force = searchParams.get('force') === 'true';
    const accountId = parseInt(process.env.CHATWOOT_ACCOUNT_ID || '0');

    console.log(`[Sync] Iniciando sincronização (Force: ${force}, Quick: ${isQuick})`);

    // 1. Fallback Mandatório: Verifica as conversas mais recentes no Chatwoot
    try {
      const recentConversations = await getChatwootConversations({ 
        status: 'all', 
        assignee_type: 'all', 
        page: 1 
      });

      if (Array.isArray(recentConversations)) {
        const limit = isQuick ? 5 : 10;
        const lastConversations = recentConversations.slice(0, limit);

        if (isQuick) {
          // Execução simultânea (paralela) para responder em ~200ms
          await Promise.all(
            lastConversations.map((conv) => syncSingleConversationToSupabase(conv.id, conv))
          );
        } else {
          // Modo Full: Execução sequencial
          for (const conv of lastConversations) {
            await syncSingleConversationToSupabase(conv.id, conv);
            await new Promise((res) => setTimeout(res, 100));
          }
        }
      }
    } catch (e: any) {
      console.warn('[Sync API] Aviso no check das últimas conversas:', e.message);
    }

    // 2. Retorna a lista atual do banco (já atualizada pelo fallback acima)
    const currentAtendimentos = await getAtendimentosFromSupabase();
    
    return NextResponse.json({
      message: 'Sincronização de segurança concluída',
      messages: currentAtendimentos || [],
      count: currentAtendimentos?.length || 0
    });
  } catch (error: any) {
    console.error('Chatwoot Sync Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar com Chatwoot', details: error.message }, { status: 500 });
  }
}
