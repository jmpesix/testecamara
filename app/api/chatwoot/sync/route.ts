import { NextResponse } from 'next/server';
import { getChatwootConversations, getChatwootMessages } from '@/lib/chatwoot';
import { analyzeMessage } from '@/lib/gemini';
import { chatwootBroadcast } from '@/lib/chatwoot-broadcast';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isQuick = searchParams.get('quick') === 'true';

    // Busca apenas as primeiras páginas para sincronização rápida (mais eficiente)
    console.log(`Iniciando sincronização ${isQuick ? 'MUITO ' : ''}rápida de conversas...`);
    
    // Busca 2 páginas em paralelo (50 conversas mais recentes)
    const [page1, page2] = await Promise.all([
      getChatwootConversations({ status: 'all', assignee_type: 'all', page: 1 }),
      getChatwootConversations({ status: 'all', assignee_type: 'all', page: 2 })
    ]);
    
    // Combina os resultados e remove duplicatas por ID
    const allConversations = [
      ...(Array.isArray(page1) ? page1 : []),
      ...(Array.isArray(page2) ? page2 : [])
    ];

    const uniqueConversations = Array.from(new Map(allConversations.map(c => [c.id, c])).values());
    const startTime = Date.now();
    console.log(`Encontradas ${uniqueConversations.length} conversas únicas. Iniciando processamento...`);

    const results: any[] = [];
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < uniqueConversations.length; i += BATCH_SIZE) {
      const batch = uniqueConversations.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (conv) => {
        try {
          let lastMessage = conv.last_non_activity_message;
          
          if (!lastMessage) {
            const messagesData = await getChatwootMessages(conv.id);
            const messages = messagesData.payload || messagesData;
            if (Array.isArray(messages) && messages.length > 0) {
              lastMessage = messages[messages.length - 1];
            }
          }
          
          const content = lastMessage?.content || 'Conversa sem mensagens';
          
          let analysis: any = { sentiment: 'neutro', priority: 'média', category: 'Geral', summary: 'Sem análise', suggested_response: '' };
          
          // Só analisamos com IA se for uma mensagem nova de entrada e ainda não tiver etiquetas de categoria (theme)
          // Isso economiza chamadas de API e tempo
          const hasAnalysisLabel = conv.labels && conv.labels.some((l: string) => 
            ['Geral', 'Infraestrutura', 'Saúde', 'Educação', 'Segurança', 'Outros'].includes(l)
          );
  
          if (!isQuick && lastMessage && lastMessage.message_type === 'incoming' && !hasAnalysisLabel) {
            try {
              const aiAnalysis = await analyzeMessage(lastMessage.content);
              analysis = { ...analysis, ...aiAnalysis };
            } catch (aiError) {
              console.error('Erro na análise da IA:', aiError);
            }
          }
          
          const teamName = conv.meta?.team?.name || 'Inbox #' + conv.inbox_id;
          const assignee = conv.meta?.assignee?.name || null;
  
          let createdAt = new Date().toISOString();
          const dateToUse = lastMessage?.created_at || conv.timestamp || conv.created_at;
          if (dateToUse) {
            const timestamp = typeof dateToUse === 'number' 
              ? (dateToUse < 10000000000 ? dateToUse * 1000 : dateToUse) 
              : dateToUse;
            createdAt = new Date(timestamp).toISOString();
          }
  
          return { 
            id: conv.id,
            conversation_id: conv.id,
            source: teamName, 
            status: conv.status,
            assignee: assignee,
            labels: conv.labels || [],
            inbox_id: conv.inbox_id,
            team_id: conv.meta?.team?.id,
            custom_attributes: conv.custom_attributes || {},
            contact_name: conv.meta?.sender?.name || 'Cidadão',
            contact_id: conv.meta?.sender?.id,
            message: content,
            sentiment: analysis.sentiment || 'neutro',
            priority: analysis.priority || 'média',
            theme: analysis.category || 'Outros',
            resumo: analysis.summary || 'Resumo automático',
            suggested_response: analysis.suggested_response || '',
            created_at: createdAt,
            updated_at: new Date().toISOString()
          };
        } catch (convError) {
          console.error(`Erro ao processar conversa ${conv.id}:`, convError);
          return null;
        }
      }));
      results.push(...batchResults);
      // Pequeno delay entre lotes para evitar rate limit agressivo, mas rápido o suficiente para UX
      if (i + BATCH_SIZE < uniqueConversations.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Remove nulls de falhas individuais
    const filteredResults = results.filter(r => r !== null);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Sincronização concluída em ${duration}s. ${filteredResults.length} mensagens processadas.`);
    
    // Notifica todos os clientes conectados via SSE que houve uma sincronização
    chatwootBroadcast.notifyUpdate("sync_completed", { count: filteredResults.length });
    
    return NextResponse.json({ 
      message: 'Sincronização concluída',
      messages: filteredResults
    });
  } catch (error: any) {
    console.error('Chatwoot Sync Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar com Chatwoot', details: error.message }, { status: 500 });
  }
}
