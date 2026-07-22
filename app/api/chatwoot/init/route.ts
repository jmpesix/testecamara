import { NextResponse } from 'next/server';
import { 
  getChatwootProfile, 
  getChatwootCannedResponses, 
  getChatwootTeams, 
  getChatwootInbox 
} from '@/lib/chatwoot';

export async function GET() {
  try {
    const [profile, canned] = await Promise.all([
      getChatwootProfile(),
      getChatwootCannedResponses()
    ]);
    return NextResponse.json({ profile, canned });
  } catch (error) {
    console.error('Erro ao inicializar dados do Chatwoot:', error);
    return NextResponse.json({ error: 'Failed to init' }, { status: 500 });
  }
}
