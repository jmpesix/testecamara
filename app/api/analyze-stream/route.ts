import { NextRequest } from 'next/server';
import { getGeminiStream } from '@/lib/ai-services/gemini-stream';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, mode } = await req.json();

    if (!message || (mode !== 'suggest' && mode !== 'info')) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros "message" e "mode" ("suggest" ou "info") são obrigatórios' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          const stream = getGeminiStream(message, mode);
          for await (const chunk of stream) {
            // Envia o chunk no formato padrão de Server-Sent Events (SSE)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          // Sinaliza a conclusão do stream
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Erro no processamento do stream:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro durante o streaming' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Erro ao processar requisição de stream:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
