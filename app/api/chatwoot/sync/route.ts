import { NextResponse } from 'next/server';
import { getChatwootConversations, getChatwootMessages } from '@/lib/chatwoot';
import { analyzeMessage } from '@/lib/gemini';

export async function GET() {
  try {
    // Busca todas as conversas sem filtro de inbox específico para trazer tudo
    // Forçamos assignee_type: 'all' para garantir que vemos conversas não atribuídas ou de outros agentes
    console.log('Iniciando sincronização global de conversas (assignee_type: all)...');
    
    const conversations = await getChatwootConversations({ status: 'all', assignee_type: 'all' });
    
    if (!Array.isArray(conversations)) {
      console.error(`Resposta de conversas não é um array:`, conversations);
      return NextResponse.json({ error: 'Resposta inválida do Chatwoot' }, { status: 500 });
    }

    console.log(`Encontradas ${conversations.length} conversas no total`);

    const results = [];
    for (const conv of conversations) {
      try {
        const messagesData = await getChatwootMessages(conv.id);
        const messages = messagesData.payload || messagesData;
        
        let lastMessage = null;
        if (Array.isArray(messages) && messages.length > 0) {
          lastMessage = messages[messages.length - 1];
        }

        const content = lastMessage?.content || 'Conversa sem mensagens';
        
        let analysis: any = { sentiment: 'neutro', priority: 'média', category: 'Geral', summary: 'Sem análise', suggested_response: '' };
        if (lastMessage && lastMessage.message_type === 'incoming') {
          try {
            const aiAnalysis = await analyzeMessage(lastMessage.content);
            analysis = { ...analysis, ...aiAnalysis };
          } catch (aiError) {
            console.error('Erro na análise da IA:', aiError);
          }
        }
        
        const sourceName = conv.meta?.sender?.name || 'Chatwoot';
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

        results.push({ 
          id: conv.id,
          conversation_id: conv.id,
          source: teamName, 
          status: conv.status,
          assignee: assignee,
          labels: conv.labels || [],
          inbox_id: conv.inbox_id,
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
        });
      } catch (convError) {
        console.error(`Erro ao processar conversa ${conv.id}:`, convError);
      }
    }
    
    return NextResponse.json({ 
      message: 'Sincronização concluída',
      messages: results
    });
  } catch (error: any) {
    console.error('Chatwoot Sync Error:', error);
    return NextResponse.json({ error: 'Falha ao sincronizar com Chatwoot', details: error.message }, { status: 500 });
  }
}
