import { NextResponse } from 'next/server';
import { getChatwootProfile, updateChatwootProfile } from '@/lib/chatwoot';

export async function GET() {
  try {
    const data = await getChatwootProfile();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await updateChatwootProfile(body);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
