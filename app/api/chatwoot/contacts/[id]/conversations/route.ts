import { NextResponse } from 'next/server';
import { getChatwootAccountDetails } from '@/lib/chatwoot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;
  const API_KEY = process.env.CHATWOOT_API_KEY;
  const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
  const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';

  if (!API_KEY || !ACCOUNT_ID) {
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
      {
        headers: {
          'api_access_token': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Chatwoot API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data.payload || data);
  } catch (error: any) {
    console.error('Erro ao buscar conversas do contato:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
