import { EventEmitter } from "events";

// Singleton EventEmitter para broadcast em memória
// Nota: Isso só funciona em uma única instância do servidor.
// Para múltiplas instâncias, será necessário usar Redis Pub/Sub futuramente.
class ChatwootBroadcast extends EventEmitter {
  private static instance: ChatwootBroadcast;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): ChatwootBroadcast {
    if (!ChatwootBroadcast.instance) {
      ChatwootBroadcast.instance = new ChatwootBroadcast();
    }
    return ChatwootBroadcast.instance;
  }

  public notifyUpdate(type: string, data?: any) {
    this.emit("update", { type, data, timestamp: new Date().toISOString() });
  }
}

export const chatwootBroadcast = ChatwootBroadcast.getInstance();
