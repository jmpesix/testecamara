import { getChatwootAuditLogs } from "@/lib/chatwoot";
import { getLocalAuditLogs } from "@/lib/audit-logs";
import { getAuditLogsFromSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Cache para auditoria
const auditCache: Record<string, { data: any, expires: number }> = {};
const CACHE_TTL = 30 * 1000; // 30 segundos (mais rápido para ver ações em tempo real)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const cacheKey = `audit-${page}`;

    if (auditCache[cacheKey] && auditCache[cacheKey].expires > Date.now()) {
      return NextResponse.json(auditCache[cacheKey].data);
    }

    let rawLogs: any[] = [];
    // Ignora a chamada ao Chatwoot audit_logs visto que não é suportada ou disponível por padrão nesta instância,
    // evitando spam de erros 404. Nosso sistema utiliza logs locais e tabela Supabase.
    
    // Mapeia os logs do Chatwoot para o formato do nosso Portal
    const mappedLogs = Array.isArray(rawLogs) && rawLogs.length > 0 ? rawLogs.map((log: any) => {
      let tipo = 'system';
      let acao = log.action || 'Ação do Sistema';
      let alvo = log.auditable_type || 'Geral';
      
      if (log.auditable_type === 'Conversation') {
        alvo = `Protocolo #${log.auditable_id}`;
      }

      // Tenta inferir o tipo pela ação ou pelas mudanças
      const changes = log.audited_changes || {};
      if (changes.status) {
        tipo = 'status';
        acao = 'Status Alterado';
      } else if (changes.team_id || changes.assignee_id) {
        tipo = 'assignment';
        acao = 'Atribuição Alterada';
      } else if (log.auditable_type === 'Message') {
        tipo = 'note';
        acao = 'Nova Mensagem/Nota';
      }

      return {
        id: log.id,
        tipo,
        acao,
        usuario: log.user?.name || log.user?.email || 'Sistema',
        alvo,
        created_at: log.created_at,
        detalhes: log.audited_changes
      };
    }) : [];

    // Mescla os logs mapeados do Chatwoot com os nossos logs locais do Portal e Supabase
    let supabaseLogs: any[] = [];
    try {
      supabaseLogs = await getAuditLogsFromSupabase();
    } catch (e) {
      console.error('Erro ao buscar logs do Supabase:', e);
    }

    const localLogs = getLocalAuditLogs();
    
    // Une as listas e ordena por data decrescente (mais recentes primeiro)
    const combinedLogs = [...mappedLogs, ...supabaseLogs, ...localLogs].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    auditCache[cacheKey] = {
      data: combinedLogs,
      expires: Date.now() + CACHE_TTL
    };

    return NextResponse.json(combinedLogs);
  } catch (error: any) {
    console.error('Erro na API de auditoria:', error);
    // Em caso de erro geral catastrófico, retorna pelo menos os logs locais para manter a interface funcionando perfeitamente!
    try {
      return NextResponse.json(getLocalAuditLogs());
    } catch (fallbackError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
