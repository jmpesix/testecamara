import { NextResponse } from 'next/server';
import { updateChatwootCustomAttributes } from '@/lib/chatwoot';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { custom_attributes } = await request.json();

    if (!custom_attributes) {
      return NextResponse.json({ error: 'Custom attributes are required' }, { status: 400 });
    }

    const data = await updateChatwootCustomAttributes(id, custom_attributes);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating custom attributes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
