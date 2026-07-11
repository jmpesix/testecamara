import { NextResponse } from 'next/server';
import { getChatwootPublicConversations } from '@/lib/chatwoot';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inboxIdentifier = searchParams.get('inbox_identifier');
  const contactIdentifier = searchParams.get('contact_identifier');

  if (!inboxIdentifier || !contactIdentifier) {
    return NextResponse.json({ error: 'Missing inbox_identifier or contact_identifier' }, { status: 400 });
  }

  try {
    const data = await getChatwootPublicConversations(inboxIdentifier, contactIdentifier);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Public Conversations Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
