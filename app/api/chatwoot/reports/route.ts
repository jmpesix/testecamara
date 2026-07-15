import { 
  getChatwootReports, 
  getChatwootReportsSummary,
  getChatwootTeamSummary,
  getChatwootChannelSummary,
  getChatwootFirstResponseDistribution
} from "@/lib/chatwoot";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric');
    const type = searchParams.get('type') || 'account';
    
    // Se não houver métrica, retorna o sumário completo com dados reais
    if (!metric) {
      const since = searchParams.get('since');
      const until = searchParams.get('until');
      const params = since && until ? { since, until } : {};

      const [summary, teams, channels, distribution] = await Promise.all([
        getChatwootReportsSummary(params),
        getChatwootTeamSummary(params),
        getChatwootChannelSummary(params),
        getChatwootFirstResponseDistribution(params)
      ]);

      return NextResponse.json({
        summary,
        teams,
        channels,
        distribution
      });
    }

    // Se houver métrica, retorna os dados da métrica
    const params: any = {};
    searchParams.forEach((value, key) => {
      if (key !== 'metric' && key !== 'type') {
        params[key] = value;
      }
    });

    const reports = await getChatwootReports(metric, type, params);
    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
