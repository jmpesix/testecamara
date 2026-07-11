import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Formato esperado do n8n/Chatwoot
    const { sender, content, phone } = body;

    if (!content) {
      return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 });
    }

    // 1. Análise de IA em tempo real
    const analysis = await analyzeMessage(content);

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem analisada com sucesso', 
      analysis 
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}
