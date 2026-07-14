import { NextResponse } from 'next/server';
import { updateChatwootConversationStatus } from '@/lib/chatwoot';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const data = await updateChatwootConversationStatus(id, status);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
