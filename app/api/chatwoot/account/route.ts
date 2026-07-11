import { NextResponse } from 'next/server';
import { getChatwootAccountDetails } from '@/lib/chatwoot';

export async function GET() {
  try {
    const data = await getChatwootAccountDetails();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chatwoot Account Details Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
