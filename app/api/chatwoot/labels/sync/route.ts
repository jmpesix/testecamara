import { NextResponse } from 'next/server';
import { getChatwootAccountLabels } from '@/lib/chatwoot';
import { upsertLabels, getLabelsFromSupabase } from '@/lib/supabase';
import { addAuditLog } from '@/lib/audit-logs';
import { insertAuditLog } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    // 1. Tenta carregar do Supabase primeiro (Cache)
    if (!force) {
      const cachedLabels = await getLabelsFromSupabase();
      if (Array.isArray(cachedLabels) && cachedLabels.length > 0) {
        return NextResponse.json({
          message: 'Etiquetas carregadas do Banco de Dados',
          labels: cachedLabels,
          count: cachedLabels.length
        });
      }
    }

    // 2. Busca do Chatwoot (Apenas se forçado ou se o banco estiver vazio)
    const chatwootLabels = await getChatwootAccountLabels();
    
    if (!Array.isArray(chatwootLabels)) {
      return NextResponse.json({ labels: [] });
    }

    // 3. Salva no Supabase
    const savedLabels = await upsertLabels(chatwootLabels);

    return NextResponse.json({
      message: 'Base de etiquetas atualizada',
      labels: savedLabels || [],
      count: (savedLabels || []).length
    });
  } catch (error: any) {
    console.error('Chatwoot Labels Sync Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar etiquetas', details: error.message }, { status: 500 });
  }
}
