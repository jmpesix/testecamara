import { NextResponse } from 'next/server';
import { getChatwootMessages } from '@/lib/chatwoot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getChatwootMessages(id);
    const messages = data.payload || data;
    
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Chatwoot Messages History Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
