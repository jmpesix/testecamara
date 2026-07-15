import { NextResponse } from 'next/server';
import { getChatwootConversations, getChatwootMessages } from '@/lib/chatwoot';
import { analyzeMessage } from '@/lib/gemini';

export async function GET() {
  try {
    // Busca todas as conversas sem filtro de inbox específico para trazer tudo
    // Forçamos assignee_type: 'all' para garantir que vemos conversas não atribuídas ou de outros agentes
    console.log('Iniciando sincronização global de conversas (assignee_type: all)...');
    
    // Busca múltiplas páginas de conversas para garantir que temos dados suficientes para contagens
    // Chatwoot retorna 25 por página por padrão
    console.log('Iniciando sincronização global de conversas (múltiplas páginas)...');
    
    const page1 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 1 });
    const page2 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 2 });
    const page3 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 3 });
    const page4 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 4 });
    const page5 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 5 });
    const page6 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 6 });
    const page7 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 7 });
    const page8 = await getChatwootConversations({ status: 'all', assignee_type: 'all', page: 8 });
    
    // Combina os resultados e remove duplicatas por ID
    const allConversations = [
      ...(Array.isArray(page1) ? page1 : []),
      ...(Array.isArray(page2) ? page2 : []),
      ...(Array.isArray(page3) ? page3 : []),
      ...(Array.isArray(page4) ? page4 : []),
      ...(Array.isArray(page5) ? page5 : []),
      ...(Array.isArray(page6) ? page6 : []),
      ...(Array.isArray(page7) ? page7 : []),
      ...(Array.isArray(page8) ? page8 : []),
    ];

    const uniqueConversations = Array.from(new Map(allConversations.map(c => [c.id, c])).values());
    
    console.log(`Encontradas ${uniqueConversations.length} conversas únicas no total`);

    const results = await Promise.all(uniqueConversations.map(async (conv) => {
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

        if (lastMessage && lastMessage.message_type === 'incoming' && !hasAnalysisLabel) {
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
    
    // Remove nulls de falhas individuais
    const filteredResults = results.filter(r => r !== null);
    
    return NextResponse.json({ 
      message: 'Sincronização concluída',
      messages: filteredResults
    });
  } catch (error: any) {
    console.error('Chatwoot Sync Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar com Chatwoot', details: error.message }, { status: 500 });
  }
}
