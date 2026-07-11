import { NextResponse } from 'next/server';
import { getChatwootInbox } from '@/lib/chatwoot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getChatwootInbox(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Inbox Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
