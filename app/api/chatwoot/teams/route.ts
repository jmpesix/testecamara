import { NextResponse } from 'next/server';
import { getChatwootTeams } from '@/lib/chatwoot';

export async function GET() {
  try {
    const data = await getChatwootTeams();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Teams Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
