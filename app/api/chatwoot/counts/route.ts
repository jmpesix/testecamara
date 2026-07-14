import { NextResponse } from 'next/server';
import { getChatwootConversationCounts } from '@/lib/chatwoot';

export async function GET() {
  try {
    const data = await getChatwootConversationCounts({ inboxId: 3 });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Conversation Counts Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
