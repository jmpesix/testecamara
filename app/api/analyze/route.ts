import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const result = await analyzeMessage(message);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha na análise' }, { status: 500 });
  }
}
