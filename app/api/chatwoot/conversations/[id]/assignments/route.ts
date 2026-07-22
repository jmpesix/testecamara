import { NextResponse } from 'next/server';
import { assignChatwootTeam } from '@/lib/chatwoot';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { team_id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID da conversa é obrigatório' }, { status: 400 });
    }

    const result = await assignChatwootTeam(id, team_id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Chatwoot Assignment Error:', error);
    return NextResponse.json({ error: 'Falha ao atribuir gabinete', details: error.message }, { status: 500 });
  }
}
