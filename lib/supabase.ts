import { createClient } from '@supabase/supabase-js';
import { analyzeMessage } from './gemini';
import { getChatwootConversationDetails, getChatwootMessages } from './chatwoot';

let supabaseClient: any = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL ou ANON KEY não configurados. Sincronização local ativa.');
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

export interface AtendimentoCamara {
  account_id: number;
  conversation_id: number;
  protocol?: string | null;
  contact_id?: number | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  message: string;
  total_mensagens?: number;
  resumo?: string | null;
  suggested_response?: string | null;
  sentiment?: string | null;
  urgency?: string | null;
  priority?: string | null;
  theme?: string | null;
  vereador_assigned?: string | null;
  status?: string | null;
  labels?: any[];
  inbox_id?: number | null;
  team_id?: number | null;
  custom_attributes?: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Salva ou atualiza uma conversa (atendimento) no Supabase.
 */
// In-memory cache for sync status
const syncCache = new Map<number, { lastSync: string | null, status: string }>();

export async function upsertAtendimento(atendimento: AtendimentoCamara) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    console.log(`[Supabase] Iniciando upsertAtendimento para ConvID: ${atendimento.conversation_id}`);
    
    // Busca se já existe um atendimento com essa conta e conversa
    const { data: existing, error: fetchError } = await supabase
      .from('atendimentos_camara')
      .select('id, total_mensagens, resumo, suggested_response, sentiment, urgency, priority, theme, vereador_assigned, labels, inbox_id, team_id, custom_attributes, updated_at')
      .eq('account_id', Number(atendimento.account_id))
      .eq('conversation_id', Number(atendimento.conversation_id))
      .maybeSingle();

    if (fetchError) {
      console.error(`[Supabase] Erro ao buscar atendimento existente para conv ${atendimento.conversation_id}:`, fetchError.message);
    } else {
      console.log(`[Supabase] Atendimento existente encontrado: ${existing ? 'Sim (ID: ' + existing.id + ')' : 'Não'}`);
    }

    let sentiment = atendimento.sentiment || existing?.sentiment || 'neutro';
    let urgency = atendimento.urgency || existing?.urgency || 'baixa';
    let priority = atendimento.priority || existing?.priority || 'baixa';
    let theme = atendimento.theme || existing?.theme || 'Geral';
    let resumo = atendimento.resumo || existing?.resumo || null;

    if (!existing) {
      // Se for um novo atendimento, tenta analisar com a IA automaticamente para realizar a triagem!
      /*
      try {
        console.log(`[Supabase Auto-Triage] Analisando nova conversa ${atendimento.conversation_id} com Gemini...`);
        const aiAnalysis = await analyzeMessage(atendimento.message, 'triage');
        if (aiAnalysis && !aiAnalysis.error) {
          sentiment = aiAnalysis.sentiment || sentiment;
          priority = aiAnalysis.priority || priority;
          // Mapeia a prioridade para urgência ('urgente' e 'alta' -> 'alta', 'média' -> 'média', 'baixa' -> 'baixa')
          if (aiAnalysis.priority === 'urgente' || aiAnalysis.priority === 'alta') {
            urgency = 'alta';
          } else if (aiAnalysis.priority === 'média') {
            urgency = 'média';
          } else {
            urgency = 'baixa';
          }
          theme = aiAnalysis.category || theme;
          resumo = aiAnalysis.summary || resumo;
        }
      } catch (aiError) {
        console.error('[Supabase Auto-Triage] Erro na análise automática do Gemini:', aiError);
      }
      */
    }

    const payload: any = {
      account_id: Number(atendimento.account_id),
      conversation_id: Number(atendimento.conversation_id),
      protocol: atendimento.protocol || `PROT-${atendimento.conversation_id}`,
      contact_id: atendimento.contact_id ? Number(atendimento.contact_id) : null,
      contact_name: atendimento.contact_name || 'Protocolo Reservado',
      contact_phone: atendimento.contact_phone,
      contact_email: atendimento.contact_email,
      message: atendimento.message,
      status: atendimento.status || 'open',
      sentiment,
      urgency,
      priority,
      theme,
      vereador_assigned: atendimento.vereador_assigned || existing?.vereador_assigned || null,
      resumo,
      suggested_response: atendimento.suggested_response || existing?.suggested_response || null,
      total_mensagens: existing ? (existing.total_mensagens || 1) + 1 : 1,
      labels: atendimento.labels || existing?.labels || [],
      inbox_id: atendimento.inbox_id ? Number(atendimento.inbox_id) : (existing?.inbox_id ? Number(existing.inbox_id) : null),
      team_id: atendimento.team_id ? Number(atendimento.team_id) : (existing?.team_id ? Number(existing.team_id) : null),
      custom_attributes: atendimento.custom_attributes || existing?.custom_attributes || {},
      updated_at: atendimento.updated_at || new Date().toISOString()
    };

    console.log(`[Supabase] Upserting atendimento para conversa ${payload.conversation_id} (Status: ${payload.status})...`);
    
    // Tenta encontrar por (account_id, conversation_id) primeiro
    const { data: searchData, error: searchError } = await supabase
      .from('atendimentos_camara')
      .select('id')
      .eq('account_id', payload.account_id)
      .eq('conversation_id', payload.conversation_id)
      .maybeSingle();

    if (searchError) {
      console.error(`[Supabase] Erro na busca pré-upsert:`, searchError.message);
    }

    const finalId = existing?.id || searchData?.id;

    if (finalId) {
      // Verifica se o status mudou para logar na auditoria
      if (existing && existing.status !== payload.status) {
        try {
          await supabase.from('audit_logs').insert({
            tipo: 'status',
            acao: `Status alterado: ${existing.status?.toUpperCase() || 'N/A'} -> ${payload.status?.toUpperCase()}`,
            usuario: 'Sistema (Sincronização)',
            alvo: `Protocolo ${payload.protocol || payload.conversation_id}`,
            detalhes: { 
              previous_status: existing.status, 
              new_status: payload.status,
              source: 'chatwoot_sync'
            },
            created_at: new Date().toISOString()
          });
        } catch (logErr) {
          console.error('[Supabase] Erro ao gravar log de status na sincronização:', logErr);
        }
      }

      // Faz o update usando o ID surrogate do banco
      const { data, error } = await supabase
        .from('atendimentos_camara')
        .update(payload)
        .eq('id', finalId)
        .select();

      if (error) {
        console.error(`[Supabase] Erro ao atualizar atendimento ${finalId}:`, error.message);
        throw error;
      }
      console.log(`[Supabase] Atendimento ${payload.conversation_id} atualizado com sucesso.`);
      return data?.[0] || null;
    } else {
      // Insere novo registro
      const { data, error } = await supabase
        .from('atendimentos_camara')
        .insert({
          ...payload,
          created_at: atendimento.created_at || new Date().toISOString()
        })
        .select();

      if (error) {
        console.error(`[Supabase] Erro ao inserir novo atendimento:`, error.message);
        throw error;
      }
      console.log(`[Supabase] Novo atendimento ${payload.conversation_id} inserido com sucesso.`);
      return data?.[0] || null;
    }
  } catch (error: any) {
    console.error(`Erro ao fazer upsert do atendimento no Supabase para conv ${atendimento.conversation_id}:`, error.message);
    return null;
  }
}

/**
 * Obtém todos os atendimentos salvos no Supabase.
 */
export async function getAtendimentosFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('atendimentos_camara')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erro ao buscar atendimentos do Supabase:', error.message);
    return [];
  }
}

/**
 * Salva um log de auditoria no Supabase.
 */
export async function insertAuditLog(log: {
  tipo: string;
  acao: string;
  usuario: string;
  alvo: string;
  detalhes?: any;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        tipo: log.tipo,
        acao: log.acao,
        usuario: log.usuario,
        alvo: log.alvo,
        detalhes: log.detalhes || null,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      // Se der erro porque a tabela de logs ainda não existe, apenas registra no console
      if (error.code === 'P0001' || error.message?.includes('relation "audit_logs" does not exist')) {
        console.warn('Tabela audit_logs não existe no Supabase. Log registrado localmente.');
      } else {
        throw error;
      }
    }
    return data?.[0] || null;
  } catch (error: any) {
    console.error('Erro ao inserir log de auditoria no Supabase:', error.message);
    return null;
  }
}

/**
 * Busca logs de auditoria do Supabase.
 */
export async function getAuditLogsFromSupabase(limit = 50) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erro ao buscar logs de auditoria do Supabase:', error.message);
    return [];
  }
}

/**
 * Salva ou atualiza uma mensagem individual no Supabase.
 */
export async function upsertMensagemCamara(msg: any) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Chatwoot costuma enviar timestamps em segundos
    const createdAt = typeof msg.created_at === 'number'
      ? new Date(msg.created_at * 1000).toISOString()
      : msg.created_at || new Date().toISOString();

    const payload = {
      id: Number(msg.id),
      account_id: Number(msg.account_id || msg.account?.id || process.env.CHATWOOT_ACCOUNT_ID || 0),
      conversation_id: Number(msg.conversation_id || msg.conversation?.id),
      content: msg.content,
      message_type: typeof msg.message_type === 'string' 
        ? (msg.message_type === 'incoming' ? 0 : 1) 
        : msg.message_type,
      private: msg.private || false,
      sender_id: msg.sender?.id ? Number(msg.sender.id) : (msg.sender_id ? Number(msg.sender_id) : null),
      sender_type: msg.sender?.type || msg.sender_type,
      sender_name: msg.sender?.name || msg.sender_name,
      created_at: createdAt,
      updated_at: new Date().toISOString()
    };

    if (!payload.id || !payload.conversation_id) {
      console.warn(`[Supabase] Mensagem ignorada por falta de IDs essenciais:`, { id: payload.id, conv: payload.conversation_id });
      return null;
    }

    console.log(`[Supabase] Upserting mensagem ${payload.id} para conversa ${payload.conversation_id}...`);
    const { data, error } = await supabase
      .from('mensagens_camara')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`[Supabase] Erro ao salvar mensagem ${payload.id}:`, error.message);
      throw error;
    }
    console.log(`[Supabase] Mensagem ${payload.id} salva com sucesso.`);
    return data?.[0] || null;
  } catch (error: any) {
    console.error(`Erro ao fazer upsert da mensagem no Supabase (ID: ${msg.id}):`, error.message);
    return null;
  }
}

/**
 * Busca mensagens de uma conversa diretamente do Supabase.
 */
export async function getMensagensFromSupabase(conversationId: number) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('mensagens_camara')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error(`Erro ao buscar mensagens do Supabase para conv ${conversationId}:`, error.message);
    return [];
  }
}

/**
 * Sincroniza uma conversa específica do Chatwoot no Supabase sob demanda.
 */
export async function syncSingleConversationToSupabase(conversationId: number, webhookPayload?: any) {
  console.log(`[Sync] Iniciando syncSingleConversationToSupabase para ConvID: ${conversationId}`);
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    // Se o webhookPayload já for um objeto de conversa completo (como o vindo da lista do sync), usamos ele direto
    let conv = (webhookPayload && webhookPayload.id && (webhookPayload.meta || webhookPayload.status)) 
      ? webhookPayload 
      : await getChatwootConversationDetails(conversationId);
    
    if (!conv || conv.error) {
      console.warn(`[Sync] Aviso: Não foi possível obter detalhes da API do Chatwoot para conversa ${conversationId}.`);
      
      // Se tivermos o payload do webhook, usamos ele como fallback para não perder o evento
      if (webhookPayload) {
        console.log(`[Sync] Usando payload do webhook como fallback para conversa ${conversationId}.`);
        conv = webhookPayload.conversation || webhookPayload;
        // Garante que o ID está correto
        if (!conv.id) conv.id = conversationId;
        if (!conv.account_id && webhookPayload.account_id) conv.account_id = webhookPayload.account_id;
      } else {
        console.error(`[Sync] Falha crítica: Sem detalhes da API e sem payload de fallback.`);
        return null;
      }
    }

    const statusParaOBanco = conv.status || 'open';

    const chatwootUpdatedAtRaw = conv.updated_at || webhookPayload?.updated_at;
    let chatwootUpdatedAt: string | null = null;
    
    if (chatwootUpdatedAtRaw) {
      let numericVal = (typeof chatwootUpdatedAtRaw === 'string' && /^\d+$/.test(chatwootUpdatedAtRaw))
        ? parseInt(chatwootUpdatedAtRaw, 10)
        : chatwootUpdatedAtRaw;

      if (typeof numericVal === 'number' && numericVal < 10000000000) {
        numericVal = numericVal * 1000;
      }
      
      try {
        const dateObj = new Date(numericVal);
        if (!isNaN(dateObj.getTime())) {
          chatwootUpdatedAt = dateObj.toISOString();
        }
      } catch (e) {
        console.error(`[Sync] Date parsing error for Conv ${conversationId}: ${chatwootUpdatedAtRaw}`);
      }
    }

    // Check cache
    const cached = syncCache.get(conversationId);
    if (cached && chatwootUpdatedAt && cached.lastSync === chatwootUpdatedAt && cached.status === statusParaOBanco) {
      console.log(`[Sync] Cache hit para conv ${conversationId}`);
      return null;
    }

    // OTIMIZAÇÃO: Verifica se o registro no Supabase já está atualizado
    const accountId = conv.account_id || webhookPayload?.account_id || parseInt(process.env.CHATWOOT_ACCOUNT_ID || '0');
    const { data: existing } = await supabase
      .from('atendimentos_camara')
      .select('updated_at, status, custom_attributes')
      .eq('account_id', accountId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    // Compara usando o timestamp original guardado nos custom_attributes para evitar o loop causado pelo updated_at do banco
    const lastStoredSync = existing?.custom_attributes?.chatwoot_last_sync_at;
    
    if (existing && chatwootUpdatedAt && lastStoredSync === chatwootUpdatedAt && existing.status === statusParaOBanco) {
      console.log(`[Sync] Conversa ${conversationId} já está atualizada no Supabase (via custom_attr). Pulando.`);
      syncCache.set(conversationId, { lastSync: chatwootUpdatedAt, status: statusParaOBanco });
      return existing;
    }

    if (chatwootUpdatedAt) {
      // Confirmed update
    } else {
      console.log(`[Sync] Conv ${conversationId} updated_at not found in Chatwoot data, forcing update.`);
    }

    const inboxId = conv.inbox_id || (webhookPayload?.inbox_id || webhookPayload?.inbox?.id);
    
    console.log(`[Sync] Dados da conversa processados. InboxID: ${inboxId}, Status Chatwoot: ${conv.status}, Status Supabase: ${statusParaOBanco}`);

    const messagesData = await getChatwootMessages(conv.id);
    const messages = messagesData?.payload || (Array.isArray(messagesData) ? messagesData : []);
    
    if (Array.isArray(messages) && messages.length > 0) {
      console.log(`[Sync] Sincronizando ${messages.length} mensagens para conversa ${conversationId}...`);
      for (const msg of messages) {
        await upsertMensagemCamara(msg);
      }
    } else {
      console.log(`[Sync] Nenhuma mensagem encontrada na API para conversa ${conversationId}. Tentando salvar mensagem do webhook se disponível.`);
      if (webhookPayload?.content || webhookPayload?.message?.content) {
        await upsertMensagemCamara(webhookPayload.message || webhookPayload);
      }
    }

    let lastMessage = conv.last_non_activity_message;
    if (!lastMessage && Array.isArray(messages) && messages.length > 0) {
      lastMessage = messages[messages.length - 1];
    }

    // Tenta extrair informações de contato do payload do webhook se não estiverem na conversa
    const contactName = conv.meta?.sender?.name || webhookPayload?.sender?.name || webhookPayload?.meta?.sender?.name || 'Protocolo Reservado';
    const contactPhone = conv.meta?.sender?.phone_number || webhookPayload?.sender?.phone_number || webhookPayload?.meta?.sender?.phone_number || null;
    const contactEmail = conv.meta?.sender?.email || webhookPayload?.sender?.email || webhookPayload?.meta?.sender?.email || null;

    const content = lastMessage?.content || (webhookPayload?.content || webhookPayload?.message?.content) || 'Nova conversa iniciada';
    const assignee = conv.meta?.assignee?.name || null;

    let createdAt = new Date().toISOString();
    const dateToUse = lastMessage?.created_at || conv.timestamp || conv.created_at || webhookPayload?.created_at;
    if (dateToUse) {
      const timestamp = typeof dateToUse === 'number'
        ? (dateToUse < 10000000000 ? dateToUse * 1000 : dateToUse)
        : dateToUse;
      createdAt = new Date(timestamp).toISOString();
    }

    // Prepara dados para o Supabase incluindo o marcador de sync
    const chatwootUpdatedAtValue = chatwootUpdatedAt || new Date().toISOString();

    const customAttributes = {
      ...(conv.custom_attributes || webhookPayload?.custom_attributes || {}),
      chatwoot_last_sync_at: chatwootUpdatedAtValue
    };

    const syncData = {
      id: conv.id,
      account_id: conv.account_id || webhookPayload?.account_id,
      conversation_id: conv.id,
      message: content,
      contact_id: conv.meta?.sender?.id || webhookPayload?.sender?.id || webhookPayload?.contact_id || null,
      contact_name: contactName,
      contact_avatar: conv.meta?.sender?.avatar_url || webhookPayload?.sender?.avatar_url || null,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      status: statusParaOBanco,
      assignee: assignee,
      vereador_assigned: conv.custom_attributes?.vereador_assigned || assignee || null,
      labels: conv.labels || [],
      inbox_id: inboxId,
      team_id: conv.meta?.team?.id || webhookPayload?.team_id || null,
      custom_attributes: customAttributes,
      created_at: createdAt,
      updated_at: chatwootUpdatedAtValue || new Date().toISOString(),
    };

    const saved = await upsertAtendimento(syncData);
    if (saved) {
      syncCache.set(conversationId, { lastSync: chatwootUpdatedAt || null, status: statusParaOBanco });
    }
    return saved;
  } catch (error: any) {
    console.error(`Erro ao sincronizar conversa única ${conversationId}:`, error.message);
    return null;
  }
}

/**
 * Calcula as contagens de atendimentos diretamente do Supabase.
 */
export async function getAtendimentosCountsFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return { mine_count: 0, unassigned_count: 0, all_count: 0 };

  try {
    const { data, error } = await supabase
      .from('atendimentos_camara')
      .select('status, vereador_assigned, labels');

    if (error) throw error;

    const activeAtendimentos = (data || []).filter((item: any) => {
      const isArchived = item.labels && Array.isArray(item.labels) && item.labels.some((l: any) => l.toLowerCase() === 'resolvido');
      return !isArchived && item.status !== 'resolved' && item.status !== 'resolvido';
    });
    const mine_count = activeAtendimentos.filter((item: any) => item.vereador_assigned !== null && item.vereador_assigned !== '').length;
    const unassigned_count = activeAtendimentos.filter((item: any) => item.vereador_assigned === null || item.vereador_assigned === '').length;
    const all_count = activeAtendimentos.length;

    return {
      mine_count,
      unassigned_count,
      all_count
    };
  } catch (error: any) {
    console.error('Erro ao calcular contagens do Supabase:', error.message);
    return { mine_count: 0, unassigned_count: 0, all_count: 0 };
  }
}

/**
 * Sincroniza etiquetas (labels) no Supabase.
 */
export async function upsertLabels(labels: any[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const accountId = parseInt(process.env.CHATWOOT_ACCOUNT_ID || '0');

  try {
    const { data, error } = await supabase
      .from('labels')
      .upsert(
        labels.map(l => ({
          account_id: accountId,
          name: l.name || l.title || 'unnamed',
          title: l.title || l.name || 'Sem título',
          description: l.description || null,
          color: l.color || '#000000',
          show_on_sidebar: l.show_on_sidebar !== undefined ? l.show_on_sidebar : true
        })),
        { onConflict: 'account_id, name' }
      )
      .select();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao sincronizar etiquetas no Supabase:', error.message);
    return null;
  }
}

/**
 * Busca etiquetas diretamente do Supabase.
 */
export async function getLabelsFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erro ao buscar etiquetas do Supabase:', error.message);
    return [];
  }
}
