import { NextResponse } from 'next/server';
import { addChatwootLabels, getChatwootLabels } from '@/lib/chatwoot';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getChatwootLabels(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { labels } = await request.json();

    if (!Array.isArray(labels)) {
      return NextResponse.json({ error: 'Labels must be an array' }, { status: 400 });
    }

    const data = await addChatwootLabels(id, labels);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error adding labels:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
