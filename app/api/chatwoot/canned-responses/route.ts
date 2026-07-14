import { NextResponse } from 'next/server';
import { getChatwootCannedResponses } from '@/lib/chatwoot';

export async function GET() {
  try {
    const data = await getChatwootCannedResponses();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Canned Responses Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
