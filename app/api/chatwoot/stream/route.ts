import { NextRequest } from "next/server";
import { chatwootBroadcast } from "@/lib/chatwoot-broadcast";

export const dynamic = "force-dynamic";

/**
 * Endpoint de Server-Sent Events (SSE) para atualizações em tempo real do Chatwoot.
 * Isso evita que o cliente precise fazer polling constante (múltiplos GETs).
 */
export async function GET(req: NextRequest) {
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendUpdate = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Conexão pode ter sido fechada
        }
      };

      // Handler para o evento de update
      const updateHandler = (payload: any) => {
        sendUpdate(payload);
      };

      // Se inscrever no broadcast
      chatwootBroadcast.on("update", updateHandler);

      // Heartbeat inicial para confirmar conexão
      sendUpdate({ 
        type: "system", 
        status: "connected", 
        message: "Conectado ao stream de sincronização",
        timestamp: new Date().toISOString() 
      });

      // Intervalo de verificação (Heartbeat/Keep-alive) para manter a conexão ativa
      const interval = setInterval(() => {
        sendUpdate({ 
          type: "heartbeat", 
          timestamp: new Date().toISOString() 
        });
      }, 10000);

      // Limpeza quando a conexão é fechada
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        chatwootBroadcast.off("update", updateHandler);
        try {
          controller.close();
        } catch (e) {
          // Já fechado
        }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
