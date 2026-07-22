import { NextResponse } from 'next/server';
import { getChatwootConversations } from '@/lib/chatwoot';
import { syncSingleConversationToSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Este endpoint é chamado pelo scheduler a cada 13 minutos
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  // Opcional: Adicionar uma camada simples de segurança se necessário
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    console.log('[Cron Sync] Iniciando sincronização agendada de 13 minutos (Últimas 30 conversas)');
    
    // 1. Busca as conversas mais recentes do Chatwoot (Páginas 1 e 2 para garantir 30)
    let allRecent: any[] = [];
    
    const page1 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 1 });
    if (Array.isArray(page1)) allRecent = [...page1];
    
    if (allRecent.length < 30) {
      const page2 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 2 });
      if (Array.isArray(page2)) allRecent = [...allRecent, ...page2];
    }

    if (allRecent.length > 0) {
      // Limitamos a 20 conforme solicitado pelo usuário
      const lastConversations = allRecent.slice(0, 20);
      
      console.log(`[Cron Sync] Sincronizando ${lastConversations.length} conversas...`);
      
      let successCount = 0;
      let errorCount = 0;

      // 2. Sincroniza cada uma para o Supabase
      for (const conv of lastConversations) {
        try {
          await syncSingleConversationToSupabase(conv.id, conv);
          successCount++;
          // Pequeno delay para evitar sobrecarga ou rate limit no Chatwoot/Supabase
          await new Promise(res => setTimeout(res, 50));
        } catch (err) {
          console.error(`[Cron Sync] Erro ao sincronizar conversa ${conv.id}:`, err);
          errorCount++;
        }
      }

      console.log(`[Cron Sync] Concluído. Sucesso: ${successCount}, Erros: ${errorCount}`);
      
      return NextResponse.json({
        message: 'Sincronização agendada concluída',
        success_count: successCount,
        error_count: errorCount,
        total: lastConversations.length
      });
    }

    return NextResponse.json({ message: 'Nenhuma conversa encontrada para sincronizar' });
  } catch (error: any) {
    console.error('[Cron Sync] Erro Crítico:', error);
    return NextResponse.json({ 
      error: 'Falha na sincronização agendada', 
      details: error.message 
    }, { status: 500 });
  }
}
