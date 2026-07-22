import { NextResponse } from 'next/server';
import { getChatwootConversationCounts } from '@/lib/chatwoot';
import { getAtendimentosCountsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Tenta carregar do Supabase
    const counts = await getAtendimentosCountsFromSupabase();
    return NextResponse.json({
      meta: {
        mine_count: counts.mine_count,
        assigned_count: counts.mine_count, // Compatibilidade com nomes alternativos
        unassigned_count: counts.unassigned_count,
        all_count: counts.all_count
      }
    });
  } catch (dbError: any) {
    console.warn('Falha ao obter contadores do Supabase, tentando fallback do Chatwoot:', dbError.message || dbError);
    
    try {
      const data = await getChatwootConversationCounts({ inboxId: 3 });
      return NextResponse.json(data);
    } catch (chatwootError: any) {
      console.error('Falha geral ao obter contadores do Chatwoot e Supabase:', chatwootError);
      return NextResponse.json({
        meta: {
          mine_count: 0,
          assigned_count: 0,
          unassigned_count: 0,
          all_count: 0
        }
      });
    }
  }
}
