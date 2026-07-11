import { NextResponse } from 'next/server';
import { getChatwootPublicMessages } from '@/lib/chatwoot';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inboxIdentifier = searchParams.get('inbox_identifier');
  const contactIdentifier = searchParams.get('contact_identifier');
  const conversationId = searchParams.get('conversation_id');

  if (!inboxIdentifier || !contactIdentifier || !conversationId) {
    return NextResponse.json({ error: 'Missing inbox_identifier, contact_identifier, or conversation_id' }, { status: 400 });
  }

  try {
    const data = await getChatwootPublicMessages(inboxIdentifier, contactIdentifier, conversationId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Public Messages Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
