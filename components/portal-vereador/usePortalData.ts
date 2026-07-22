'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, subDays, startOfWeek, startOfMonth, subMonths, subYears, endOfDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Message } from '@/types';
import { useAiStream } from '@/lib/ai-services/useAiStream';
import { VEREADORES } from './constants';
import { getSupabaseClient } from '@/lib/supabase';

export function usePortalData() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inboxSubFilter, setInboxSubFilter] = useState<'mine' | 'unassigned' | 'all' | 'resolved'>('all');
  const [mainView, setMainView] = useState<'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports'>('all');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [inboxFilter, setInboxFilter] = useState<number | null>(null);
  const [contactConversations, setContactConversations] = useState<any[]>([]);
  const [loadingContactHistory, setLoadingContactHistory] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { streamAnalyze } = useAiStream();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [fullConversationData, setFullConversationData] = useState<any>(null);
  const [sidebarOpenSections, setSidebarOpenSections] = useState<string[]>(['Ações da conversa']);
  const [pollingInterval, setPollingInterval] = useState(3000);
  const stabilityCounter = useRef(0);
  const lastDataSignature = useRef<string>('');
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const lastBackgroundSync = useRef(0);
  
  const [cannedResponses, setCannedResponses] = useState<any[]>([]);
  const [showCanned, setShowCanned] = useState(false);
  const [counts, setCounts] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>({ conversations_count: 0, resolutions_count: 0, incoming_messages_count: 0, outgoing_messages_count: 0, avg_first_response_time: 0, avg_resolution_time: 0 });
  const [reportDaily, setReportDaily] = useState<any[]>([]);
  const [reportTeams, setReportTeams] = useState<any[]>([]);
  const [reportChannels, setReportChannels] = useState<any[]>([]);
  const [reportDistribution, setReportDistribution] = useState<any>(null);
  const [reportConversations, setReportConversations] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [inboxInfo, setInboxInfo] = useState<any>(null);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [reportTab, setReportTab] = useState<'visao-geral' | 'conversas' | 'assuntos-recorrentes' | 'inbox' | 'time' | 'sla' | 'robos' | 'auditoria'>('visao-geral');
  const [reportRange, setReportRange] = useState<string>('7days');
  const [customDateRange, setCustomDateRange] = useState<{from: Date; to: Date}>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [gabinetesExpanded, setGabinetesExpanded] = useState(false);
  const [selectedVereador, setSelectedVereador] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const lastSelectedId = useRef<number | null>(null);
  const selectedMessageRef = useRef<Message | null>(null);
  const mainViewRef = useRef(mainView);

  useEffect(() => {
    mainViewRef.current = mainView;
  }, [mainView]);

  useEffect(() => {
    selectedMessageRef.current = selectedMessage;
  }, [selectedMessage]);

  const lastFetchedCanned = useRef(0);
  const fetchCanned = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchedCanned.current < 600000) return; // 10 minutes
    try {
      const response = await fetch('/api/chatwoot/canned-responses');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCannedResponses(data);
        lastFetchedCanned.current = Date.now();
      }
    } catch (e) {
      console.error('Erro ao buscar respostas rápidas:', e);
    }
  }, []);

  const lastFetchedCounts = useRef(0);
  const fetchCounts = useCallback(async () => {
    if (Date.now() - lastFetchedCounts.current < 1000) return; // 1s cooldown
    lastFetchedCounts.current = Date.now();
    try {
      const response = await fetch('/api/chatwoot/counts');
      const data = await response.json();
      setCounts(data);
    } catch (e) {
      console.error('Erro ao buscar contagens:', e);
    }
  }, []);

  const lastFetchedTeams = useRef(0);
  const fetchTeams = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchedTeams.current < 600000) return; // 10 minutes
    try {
      const response = await fetch('/api/chatwoot/teams');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeams(data);
        lastFetchedTeams.current = Date.now();
      }
    } catch (e) {
      console.error('Erro ao buscar times:', e);
    }
  }, []);

  const lastFetchedInboxInfo = useRef(0);
  const fetchInboxInfo = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchedInboxInfo.current < 600000) return; // 10 minutes
    try {
      const response = await fetch('/api/chatwoot/inbox/3');
      const data = await response.json();
      setInboxInfo(data);
      lastFetchedInboxInfo.current = Date.now();
    } catch (e) {
      console.error('Erro ao buscar info da inbox:', e);
    }
  }, []);

  const lastFetchedProfile = useRef(0);
  const fetchProfile = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchedProfile.current < 600000) return; // 10 minutes
    try {
      const response = await fetch('/api/chatwoot/profile');
      const data = await response.json();
      setUserProfile(data);
      lastFetchedProfile.current = Date.now();
    } catch (e) {
      console.error('Erro ao buscar perfil:', e);
    }
  }, []);

  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleSync = useCallback(async (silent = false, quick = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    // Só mostra loading se for a primeira carga real ou se for forçado (não silent)
    if (!silent && messagesRef.current.length === 0) setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // 1. Sincronização Prioritária (Modo Rápido)
      const currentId = selectedMessageRef.current?.conversation_id || selectedMessageRef.current?.id;
      const syncUrl = currentId 
        ? `/api/chatwoot/sync?quick=true&conversation_id=${currentId}`
        : '/api/chatwoot/sync?quick=true';

      try {
        const syncRes = await fetch(syncUrl);
        if (!syncRes.ok) console.warn('[Sync] API retornou erro');
      } catch (e) {
        console.warn('[Sync] Falha na chamada da API:', e);
      }

      // 2. Busca direta do Supabase
      const { data: messagesData, error } = await supabase
        .from('atendimentos_camara')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      
      if (messagesData) {
        const formattedMessages = messagesData.map((m: any) => ({
          ...m,
          id: m.conversation_id || m.id,
          conversation_id: m.conversation_id || m.id
        }));

        setMessages(formattedMessages);
        setLastSync(new Date());

        const currentSignature = JSON.stringify(formattedMessages.map((m: any) => ({
          id: m.id,
          status: m.status,
          updated_at: m.updated_at,
          last_message_id: m.last_message_id || m.id
        })));

        if (lastDataSignature.current && currentSignature !== lastDataSignature.current) {
          console.log('[Polling] ⚡ Mudança detectada! Resetando para Patamar 1 (2s).');
          stabilityCounter.current = 0;
          setPollingInterval(2000);
        } else if (lastDataSignature.current === currentSignature) {
          stabilityCounter.current += 1;
          const count = stabilityCounter.current;
          
          setPollingInterval(prev => {
            if (count >= 10) return 12000;
            if (count >= 8)  return 9000;
            if (count >= 6)  return 6500;
            if (count >= 4)  return 4500;
            if (count >= 2)  return 3000;
            return 2000;
          });

          if (count % 3 === 0) {
             console.log(`[Polling] Ciclos sem mudança: ${count}x`);
          }
        }
        lastDataSignature.current = currentSignature;
      }
    } catch (error: any) {
      if (!silent) console.error('Erro ao sincronizar:', error);
      setPollingInterval(12000);
    } finally {
      isSyncingRef.current = false;
      setLoading(false);
    }
  }, []);

  const forceImmediateSync = useCallback(() => {
    console.log('[Polling] 🎯 Ação detectada! Forçando sync e reativando modo 3s.');
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    
    stabilityCounter.current = 0;
    setPollingInterval(3000);
    handleSync(true, true);
  }, [handleSync]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (e) {
      console.error('Erro ao buscar auditoria do Supabase:', e);
    }
  }, []);

  const fetchLabels = useCallback(async (force: boolean = false) => {
    setLoadingLabels(true);
    try {
      if (force) {
        const response = await fetch(`/api/chatwoot/labels/sync?force=true`);
        if (response.ok) {
          const data = await response.json();
          setLabels(data.labels || []);
        }
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (e) {
      console.error('Erro ao buscar/sincronizar etiquetas:', e);
    } finally {
      setLoadingLabels(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    // Só mostra spinner se for a carga inicial e não tivermos dados (total de conversas 0)
    if (!reportSummary || reportSummary.conversations_count === 0) {
      setLoadingReports(true);
    }
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      let sinceDate: Date;
      let untilDate: Date = endOfDay(new Date());

      if (reportRange === 'custom') {
        sinceDate = startOfDay(customDateRange.from);
        untilDate = endOfDay(customDateRange.to);
      } else {
        const now = new Date();
        switch (reportRange) {
          case '7days': sinceDate = subDays(now, 7); break;
          case '30days': sinceDate = subDays(now, 30); break;
          case '3months': sinceDate = subMonths(now, 3); break;
          case '6months': sinceDate = subMonths(now, 6); break;
          case 'lastYear': sinceDate = subYears(now, 1); break;
          case 'thisWeek': sinceDate = startOfWeek(now, { weekStartsOn: 1 }); break;
          case 'thisMonth': sinceDate = startOfMonth(now); break;
          default: sinceDate = subDays(now, 7);
        }
        sinceDate = startOfDay(sinceDate);
      }

      // Consulta direta ao Supabase (Cache de Atendimentos)
      const { data: records, error } = await supabase
        .from('atendimentos_camara')
        .select('*')
        .gte('created_at', sinceDate.toISOString())
        .lte('created_at', untilDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar mensagens relevantes para cálculos de SLA (apenas as primeiras mensagens enviadas pelo gabinete, message_type: 1)
      let messages: any[] = [];
      if (records && records.length > 0) {
        const { data: msgs, error: msgError } = await supabase
          .from('mensagens_camara')
          .select('conversation_id, message_type, created_at')
          .eq('message_type', 1)
          .in('conversation_id', records.map((r: any) => r.conversation_id))
          .order('created_at', { ascending: true });
        
        if (msgError) console.error('Erro ao buscar mensagens para SLA:', msgError);
        else messages = msgs || [];
      }

      if (records) {
        // 1. Cálculo do Resumo (Summary)
        const total = records.length;
        
        // Calcular médias globais baseadas em mensagens
        let totalResponseTime = 0;
        let responseCount = 0;
        let totalResolutionTime = 0;
        let resolutionCount = 0;

        records.forEach((r: any) => {
          const convMsgs = messages.filter(m => m.conversation_id === r.conversation_id);
          
          // Média de Resposta: Tempo entre created_at da conversa e created_at da primeira mensagem message_type: 1
          const firstOutgoing = convMsgs.find(m => m.message_type === 1);
          if (firstOutgoing) {
            const diff = new Date(firstOutgoing.created_at).getTime() - new Date(r.created_at).getTime();
            if (diff > 0) {
              totalResponseTime += diff / 1000;
              responseCount++;
            }
          }

          // Média de Resolução: Se resolvido, tempo até r.updated_at
          const isResolved = r.status === 'resolved' || (r.labels && Array.isArray(r.labels) && r.labels.some((l: any) => l.toLowerCase() === 'resolvido'));
          if (isResolved) {
            const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
            if (diff > 0) {
              totalResolutionTime += diff / 1000;
              resolutionCount++;
            }
          }
        });

        const avgFirstResponse = responseCount > 0 ? totalResponseTime / responseCount : 0;
        const avgResolution = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;

        const resolved = records.filter((r: any) => r.status === 'resolved' || (r.labels && Array.isArray(r.labels) && r.labels.some((l: any) => l.toLowerCase() === 'resolvido'))).length;
        const incoming = records.reduce((acc: number, r: any) => acc + (Number(r.total_mensagens) || 1), 0);
        const outgoing = Math.floor(incoming * 0.7); // Estimativa baseada em volume
        
        setReportSummary({
          conversations_count: total || 1, // Evita divisão por zero no UI
          resolutions_count: resolved,
          incoming_messages_count: incoming,
          outgoing_messages_count: outgoing,
          avg_first_response_time: avgFirstResponse,
          avg_resolution_time: avgResolution,
        });

        // 2. Cálculo dos Dados Diários (Gráfico)
        const dailyMap: Record<string, number> = {};
        records.forEach((r: any) => {
          const dayKey = format(new Date(r.created_at), 'dd/MM');
          dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;
        });

        const sortedDaily = [];
        let curr = new Date(sinceDate);
        while (curr <= untilDate) {
          const dayKey = format(curr, 'dd/MM');
          sortedDaily.push({
            name: dayKey,
            value: dailyMap[dayKey] || 0
          });
          curr.setDate(curr.getDate() + 1);
        }
        setReportDaily(sortedDaily);

        const teamStats: Record<number, any> = {};
        records.forEach((r: any) => {
          // Usa o team_id se existir
          let tId = r.team_id;

          // Fallback para team_id se for nulo, tenta usar vereador_assigned
          if (!tId) {
            if (r.vereador_assigned) {
              const v = VEREADORES.find(v => v.name.trim().toLowerCase() === r.vereador_assigned.trim().toLowerCase());
              tId = v ? v.id : 1;
            } else {
              // Se não tiver team nem vereador, assumimos a caixa principal (Portal Geral)
              tId = 1; 
            }
          }

          if (!teamStats[tId]) {
            teamStats[tId] = {
              id: tId,
              conversations_count: 0,
              resolutions_count: 0,
              total_response_time: 0,
              response_count: 0,
              total_resolution_time: 0,
              resolution_count: 0
            };
          }
          
          teamStats[tId].conversations_count++;
          
          const convMsgs = messages.filter(m => m.conversation_id === r.conversation_id);
          
          // Média de Resposta
          const firstOutgoing = convMsgs.find(m => m.message_type === 1);
          if (firstOutgoing) {
            const diff = new Date(firstOutgoing.created_at).getTime() - new Date(r.created_at).getTime();
            if (diff > 0) {
              teamStats[tId].total_response_time += diff / 1000;
              teamStats[tId].response_count++;
            }
          }

          // Média de Resolução
          const isResolved = r.status === 'resolved' || (r.labels && Array.isArray(r.labels) && r.labels.some((l: any) => l.toLowerCase() === 'resolvido'));
          if (isResolved) {
            teamStats[tId].resolutions_count++;
            const diff = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime();
            if (diff > 0) {
              teamStats[tId].total_resolution_time += diff / 1000;
              teamStats[tId].resolution_count++;
            }
          }
        });

        // Formatar resultados finais para o dashboard
        setReportTeams(Object.values(teamStats).map(t => ({
          ...t,
          avg_first_response_time: t.response_count > 0 ? t.total_response_time / t.response_count : 0,
          avg_resolution_time: t.resolution_count > 0 ? t.total_resolution_time / t.resolution_count : 0
        })));

        // 4. Distribuição por Temas e Etiquetas (Canais/Distribuição)
        const themeMap: Record<string, { count: number; total_response: number; response_count: number }> = {};
        const labelCounts: Record<string, number> = {};

        records.forEach((r: any) => {
          const theme = r.theme || 'Geral';
          if (!themeMap[theme]) {
            themeMap[theme] = { count: 0, total_response: 0, response_count: 0 };
          }
          themeMap[theme].count++;

          // Contabilizar todas as etiquetas
          let hasInAtendimentoLabel = false;
          if (r.labels && Array.isArray(r.labels)) {
            r.labels.forEach((l: string) => {
              const normalized = l.toUpperCase().trim();
              if (normalized === 'EM ATENDIMENTO') hasInAtendimentoLabel = true;
              labelCounts[normalized] = (labelCounts[normalized] || 0) + 1;
            });
          }

          // Se for status 'open' ou 'pending' e não tiver a etiqueta, contabiliza como 'EM ATENDIMENTO' virtualmente
          if (!hasInAtendimentoLabel && (r.status === 'open' || r.status === 'pending')) {
            labelCounts['EM ATENDIMENTO'] = (labelCounts['EM ATENDIMENTO'] || 0) + 1;
          }

          if (theme !== 'Geral') {
            // Se não tiver labels mas tiver theme, usa o theme como label fallback
            const normalizedTheme = theme.toUpperCase().trim();
            if (!labelCounts[normalizedTheme]) {
              labelCounts[normalizedTheme] = 1;
            }
          }

          const convMsgs = messages.filter(m => m.conversation_id === r.conversation_id);
          const firstOutgoing = convMsgs.find(m => m.message_type === 1);
          if (firstOutgoing) {
            const diff = new Date(firstOutgoing.created_at).getTime() - new Date(r.created_at).getTime();
            if (diff > 0) {
              themeMap[theme].total_response += diff / 1000;
              themeMap[theme].response_count++;
            }
          }
        });
        
        setReportChannels(Object.entries(themeMap).map(([name, data]) => ({
          name,
          conversations_count: data.count,
          avg_first_response_time: data.response_count > 0 ? data.total_response / data.response_count : 0
        })));
        
        // Unificar themeMap e labelCounts para a distribuição
        const distributionPayload: Record<string, number> = { ...labelCounts };
        Object.entries(themeMap).forEach(([name, data]) => {
          if (!distributionPayload[name]) {
            distributionPayload[name] = data.count;
          } else {
            // Se já existe, garantimos que pegamos o maior valor ou somamos? 
            // Geralmente labels são mais específicos.
            distributionPayload[name] = Math.max(distributionPayload[name], data.count);
          }
        });

        setReportDistribution({
          payload: Object.entries(distributionPayload).map(([name, count]) => ({
            name,
            conversations_count: count
          }))
        });

        // 5. Agregação diária para reportConversations (Tabela do Dashboard)
        const dailyAgg: Record<string, any> = {};
        records.forEach((r: any) => {
          const dateKey = startOfDay(new Date(r.created_at)).getTime() / 1000;
          if (!dailyAgg[dateKey]) {
            dailyAgg[dateKey] = {
              timestamp: dateKey,
              open_count: 0,
              resolved_count: 0,
              pending_count: 0
            };
          }
          if (r.status === 'resolved' || (r.labels && Array.isArray(r.labels) && r.labels.some((l: any) => l.toLowerCase() === 'resolvido'))) {
            dailyAgg[dateKey].resolved_count++;
          } else if (r.status === 'pending') {
            dailyAgg[dateKey].pending_count++;
          } else {
            dailyAgg[dateKey].open_count++;
          }
        });
        setReportConversations(Object.values(dailyAgg).sort((a, b) => b.timestamp - a.timestamp));
      }

      if (reportTab === 'auditoria') {
        await fetchAuditLogs();
      }

      if (reportTab === 'assuntos-recorrentes' || reportTab === 'visao-geral') {
        await fetchLabels();
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios do Supabase:', error);
    } finally {
      setLoadingReports(false);
    }
  }, [reportRange, reportTab, customDateRange.from, customDateRange.to, fetchAuditLogs, fetchLabels, reportSummary]);

  const handleUpdateStatus = useCallback(async (status: 'open' | 'resolved' | 'pending' | 'snoozed') => {
    if (!selectedMessage) return;
    
    // Backup para possível rollback
    const previousMessage = { ...selectedMessage };
    
    setIsUpdatingStatus(true);
    
    // 1. Atualização Otimista
    let updatedLabels = [...(selectedMessage.labels || [])];
    if (status === 'resolved') {
      if (!updatedLabels.some(l => l.toLowerCase() === 'resolvido')) updatedLabels.push('resolvido');
      updatedLabels = updatedLabels.filter(l => !['em atendimento', 'em-atendimento', 'em_atendimento', 'em andamento', 'em-andamento', 'em_atendimento'].includes(l.toLowerCase()));
    } else if (status === 'open') {
      updatedLabels = updatedLabels.filter(l => l.toLowerCase() !== 'resolvido');
    }
    
    setSelectedMessage(prev => prev ? { ...prev, status, labels: updatedLabels } : null);

    try {
      // 2. Chamadas de API (Chatwoot)
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        // 2. Lógica customizada de arquivamento do Portal
        let updatedLabels = [...(selectedMessage.labels || [])];
        let labelsChanged = false;

        if (status === 'resolved') {
          // Se estamos resolvendo/arquivando no portal, adicionamos a label
          if (!updatedLabels.some(l => l.toLowerCase() === 'resolvido')) {
            updatedLabels.push('resolvido');
            labelsChanged = true;
          }
          // Remove variações de "Em Atendimento" ou "Em Andamento" se existirem
          const labelsToRemove = [
            'em atendimento', 'em-atendimento', 'em_atendimento',
            'em andamento', 'em-andamento', 'em_andamento'
          ];
          const initialLength = updatedLabels.length;
          updatedLabels = updatedLabels.filter(l => !labelsToRemove.includes(l.toLowerCase()));
          if (updatedLabels.length !== initialLength) {
            labelsChanged = true;
          }
        } else if (status === 'open') {
          // Se estamos reabrindo, removemos a label de arquivado
          if (updatedLabels.some(l => l.toLowerCase() === 'resolvido')) {
            updatedLabels = updatedLabels.filter(l => l.toLowerCase() !== 'resolvido');
            labelsChanged = true;
          }
        }

        if (labelsChanged) {
          await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/labels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: updatedLabels })
          });
        }

        handleSync(true);
        
        // Audit Log
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('audit_logs').insert({
            tipo: 'status',
            acao: `Status alterado para ${status.toUpperCase()}`,
            usuario: userProfile?.name || 'Assessor Legislativo',
            alvo: `Protocolo ${selectedMessage.protocol || selectedMessage.conversation_id}`,
            detalhes: { previous_status: previousMessage.status, new_status: status },
            created_at: new Date().toISOString()
          });
          fetchAuditLogs();
        }

        if (status === 'resolved') {
          // Atualiza o estado local primeiro para refletir a mudança visualmente (badge, etc)
          setSelectedMessage(prev => prev ? { ...prev, status, labels: updatedLabels } : null);
          
          // Delay suave de 1600ms antes de fechar a conversa
          setTimeout(() => {
            setSelectedMessage(null);
          }, 1600);
        } else {
          setSelectedMessage(prev => prev ? { ...prev, status, labels: updatedLabels } : null);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedMessage, handleSync, userProfile, fetchAuditLogs]);

  const handleUpdatePriority = useCallback(async (priority: 'urgent' | 'high' | 'medium' | 'low' | null) => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (response.ok) {
        handleSync(true);
        setSelectedMessage(prev => prev ? { ...prev, priority: priority || '' } : null);

        // Audit Log
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('audit_logs').insert({
            tipo: 'priority',
            acao: `Prioridade alterada para ${priority?.toUpperCase() || 'NENHUMA'}`,
            usuario: userProfile?.name || 'Assessor Legislativo',
            alvo: `Protocolo ${selectedMessage.protocol || selectedMessage.conversation_id}`,
            detalhes: { previous_priority: selectedMessage.priority, new_priority: priority },
            created_at: new Date().toISOString()
          });
          fetchAuditLogs();
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  }, [selectedMessage, handleSync, userProfile, fetchAuditLogs]);

  const handleAddLabel = useCallback(async (labelOverride?: string) => {
    const labelToUse = labelOverride || newLabel;
    if (!selectedMessage || !labelToUse) return;
    try {
      const currentLabels = selectedMessage.labels || [];
      if (currentLabels.includes(labelToUse)) return;
      const labels = [...currentLabels, labelToUse];
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels })
      });
      if (response.ok) {
        if (!labelOverride) setNewLabel('');
        handleSync(true);
        setSelectedMessage(prev => prev ? { ...prev, labels } : null);

        // Audit Log
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('audit_logs').insert({
            tipo: 'label',
            acao: `Etiqueta adicionada: ${labelToUse}`,
            usuario: userProfile?.name || 'Assessor Legislativo',
            alvo: `Protocolo ${selectedMessage.protocol || selectedMessage.conversation_id}`,
            detalhes: { label: labelToUse },
            created_at: new Date().toISOString()
          });
          fetchAuditLogs();
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
    }
  }, [selectedMessage, newLabel, handleSync, userProfile, fetchAuditLogs]);

  const fetchConversationDetails = useCallback(async (id: number) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('atendimentos_camara')
        .select('*')
        .eq('conversation_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      if (id !== lastSelectedId.current) {
        console.log(`fetchConversationDetails para o ID ${id} foi descartado pois a conversa ativa mudou.`);
        return;
      }
      
      // Mapeia para o formato esperado pelo componente
      const formattedData = {
        ...data,
        meta: {
          sender: {
            name: data.contact_name,
            phone_number: data.contact_phone,
            email: data.contact_email,
            id: data.contact_id
          },
          assignee: {
            name: data.vereador_assigned
          }
        }
      };

      setFullConversationData(formattedData);
      
      setSelectedMessage(prev => {
        if (!prev) return null;
        const prevId = prev.conversation_id || prev.id;
        if (Number(prevId) !== id) return prev;
        return {
          ...prev,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          labels: data.labels || prev.labels,
          custom_attributes: data.custom_attributes || prev.custom_attributes,
          status: data.status,
          team_id: data.team_id
        };
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes da conversa no Supabase:', error);
    }
  }, []);

  const handleAssignTeam = useCallback(async (teamId: number | null) => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId })
      });
      if (response.ok) {
        handleSync(true);
        // Atualiza os detalhes da conversa para refletir a nova atribuição
        fetchConversationDetails(Number(selectedMessage.conversation_id));

        // Audit Log
        const supabase = getSupabaseClient();
        if (supabase) {
          const teamName = teams.find(t => t.id === teamId)?.name || 'Nenhum';
          await supabase.from('audit_logs').insert({
            tipo: 'assignment',
            acao: `Gabinete alterado para: ${teamName}`,
            usuario: userProfile?.name || 'Assessor Legislativo',
            alvo: `Protocolo ${selectedMessage.protocol || selectedMessage.conversation_id}`,
            detalhes: { team_id: teamId, team_name: teamName },
            created_at: new Date().toISOString()
          });
          fetchAuditLogs();
        }
      }
    } catch (error) {
      console.error('Erro ao atribuir gabinete:', error);
    }
  }, [selectedMessage, handleSync, fetchConversationDetails, teams, userProfile, fetchAuditLogs]);

  const fetchContactConversations = useCallback(async (contactId?: number, assocConversationId?: number) => {
    if (!contactId) return;
    setLoadingContactHistory(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('atendimentos_camara')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (assocConversationId && assocConversationId !== lastSelectedId.current) {
        console.log(`fetchContactConversations descartado pois a conversa ativa mudou.`);
        return;
      }
      
      if (Array.isArray(data)) {
        setContactConversations(data.map(m => ({
          ...m,
          id: m.conversation_id || m.id
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar conversas do contato no Supabase:', error);
    } finally {
      if (!assocConversationId || assocConversationId === lastSelectedId.current) {
        setLoadingContactHistory(false);
      }
    }
  }, []);

  const lastFetchedConvHistory = useRef(new Map<number, number>());
  const fetchConversationHistory = useCallback(async (id: number, silent = false) => {
    if (!silent) {
      const lastTime = lastFetchedConvHistory.current.get(id) || 0;
      if (Date.now() - lastTime < 1000) return; // 1s cooldown
      lastFetchedConvHistory.current.set(id, Date.now());
    }
    
    if (!silent) setLoadingHistory(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('mensagens_camara')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (id !== lastSelectedId.current) {
        console.log(`fetchConversationHistory para o ID ${id} foi descartado pois a conversa ativa mudou.`);
        return;
      }
      
      if (Array.isArray(data)) {
        // Normaliza os dados para o formato que o componente Chat espera
        const formattedHistory = data.map(m => ({
          ...m,
          sender: {
            id: m.sender_id,
            name: m.sender_name,
            type: m.sender_type
          },
          // message_type no DB é 0 (incoming), 1 (outgoing/template), 2 (system)
          message_type: m.message_type === 0 ? 'incoming' : (m.message_type === 2 ? 'system' : 'outgoing'),
          raw_message_type: m.message_type
        }));
        setConversationMessages(formattedHistory);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico no Supabase:', error);
    } finally {
      if (id === lastSelectedId.current && !silent) setLoadingHistory(false);
    }
  }, []);

  const handleAnalyze = useCallback(async (msg: Message, mode: 'suggest' | 'info' = 'suggest') => {
    setIsAnalyzing(true);
    setShowAiMenu(false);
    if (mode === 'suggest') {
      setAiSuggestion('');
    } else {
      setAiInfo('');
    }
    
    try {
      await streamAnalyze(msg.message, mode, {
        onChunk: (chunk) => {
          if (mode === 'suggest') {
            setAiSuggestion(prev => (prev || '') + chunk);
          } else {
            setAiInfo(prev => (prev || '') + chunk);
          }
        },
        onFinish: (fullText) => {
          if (mode === 'suggest') {
            setAiSuggestion(fullText);
          } else {
            setAiInfo(fullText);
          }
        },
        onError: (err) => {
          const errMsg = 'Erro ao gerar resposta com inteligência artificial.';
          if (mode === 'suggest') {
            setAiSuggestion(errMsg);
          } else {
            setAiInfo(errMsg);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao analisar com stream:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [streamAnalyze]);

  const handleSendReply = useCallback(async () => {
    if (!replyText || !selectedMessage) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/chatwoot/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId: selectedMessage.conversation_id, 
          content: replyText,
          resolve: false 
        })
      });
      
      if (response.ok) {
        setReplyText('');
        setAiSuggestion(null);
        fetchConversationHistory(selectedMessage.conversation_id || selectedMessage.id);
        handleSync(true);

        // Audit Log
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('audit_logs').insert({
            tipo: 'message',
            acao: `Resposta oficial enviada`,
            usuario: userProfile?.name || 'Assessor Legislativo',
            alvo: `Protocolo ${selectedMessage.protocol || selectedMessage.conversation_id}`,
            detalhes: { text_preview: replyText.substring(0, 50) + '...' },
            created_at: new Date().toISOString()
          });
          fetchAuditLogs();
        }
      } else {
        const err = await response.json();
        alert(`Erro ao enviar: ${err.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setIsSending(false);
    }
  }, [replyText, selectedMessage, fetchConversationHistory, handleSync, userProfile, fetchAuditLogs]);

  // Periodic synchronization
  useEffect(() => {
    setMounted(true);
    
    // 1. Inicialização de Montagem (Executa APENAS uma vez)
    const initData = async () => {
      try {
        const res = await fetch('/api/chatwoot/init');
        const data = await res.json();
        if (data.profile) setUserProfile(data.profile);
        if (data.canned) setCannedResponses(data.canned);
        
        // Trigger first sync (noisy)
        handleSync(false);
      } catch (e) {
        console.error('Erro ao inicializar dados essenciais:', e);
      }
    };
    initData();
  }, [handleSync]);

  useEffect(() => {
    if (mainView === 'reports') {
      fetchReports();
    }
  }, [mainView, reportTab, reportRange, fetchReports]);

  useEffect(() => {
    if (mainView === 'duvidas' || mainView === 'reclamacoes') {
      setInboxSubFilter('mine');
    } else if (mainView === 'vereadores') {
      setInboxSubFilter('mine');
    } else {
      setInboxSubFilter('all');
    }
  }, [mainView]);

  useEffect(() => {
    const currentId = selectedMessage?.conversation_id || selectedMessage?.id;
    if (currentId && selectedMessage) {
      const numericId = Number(currentId);
      if (lastSelectedId.current !== numericId) {
        lastSelectedId.current = numericId;
        setIsFirstLoad(true);
        fetchConversationHistory(numericId);
        if (selectedMessage.contact_id) {
          fetchContactConversations(selectedMessage.contact_id, numericId);
        }
        fetchConversationDetails(numericId);
      }
    } else {
      lastSelectedId.current = null;
      setConversationMessages([]);
      setContactConversations([]);
      setFullConversationData(null);
    }
  }, [selectedMessage, fetchConversationHistory, fetchContactConversations, fetchConversationDetails]);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Server-Sent Events (SSE) para atualizações em tempo real com Reconnect
  useEffect(() => {
    if (!mounted) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectDelay = 1000;

    const connect = () => {
      console.log("Conectando ao stream de sincronização...");
      eventSource = new EventSource('/api/chatwoot/stream');

      eventSource.onopen = () => {
        console.log("SSE Conectado!");
        reconnectDelay = 1000; // Reseta o delay no sucesso
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Processa qualquer atualização que não seja heartbeat ou mensagem de sistema
          if (data.type && data.type !== 'heartbeat' && data.type !== 'system' && data.type !== 'sync_completed') {
            console.log(`Notificação SSE [${data.type}]:`, data);
            
            // Extrai dados do evento
            const payload = data.data;
            const eventConvId = payload?.conversationId || payload?.conversation?.id || (data.type?.startsWith('conversation') ? payload?.id : undefined);
            const currentId = selectedMessageRef.current?.conversation_id || selectedMessageRef.current?.id;
            
            console.log(`SSE Event: ${data.type}, ConvID: ${eventConvId}, Current: ${currentId}`);

            // 1. Atualização imediata para a conversa ativa
            if (currentId && (Number(eventConvId) === Number(currentId) || !eventConvId)) {
              console.log("Atualizando conversa ativa imediatamente...");
              
              // Se for uma nova mensagem, podemos tentar adicionar à lista localmente para ser instantâneo
              if (data.type === 'message_created' && payload.id) {
                setConversationMessages(prev => {
                  // Evita duplicatas
                  if (prev.some(m => m.id === payload.id)) return prev;
                  
                  const newMsg = {
                    id: payload.id,
                    content: payload.content || payload.message?.content,
                    message_type: payload.message_type === 2 ? 'system' : (payload.message_type === 0 || payload.sender?.type === 'contact' ? 'incoming' : 'outgoing'),
                    raw_message_type: payload.message_type,
                    created_at: payload.created_at || new Date().toISOString(),
                    sender: payload.sender || payload.message?.sender || payload.message?.contact
                  };
                  
                  return [...prev, newMsg].sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateA - dateB;
                  });
                });
              }
              
              histRef.current(Number(currentId), true);
            }

            // 2. Atualização imediata da lista lateral (aba) sem esperar o servidor
            if (eventConvId && (data.type === 'message_created' || data.type === 'message_updated' || data.type === 'conversation_updated')) {
              setMessages(prev => {
                const convId = Number(eventConvId);
                const index = prev.findIndex(m => Number(m.conversation_id) === convId || Number(m.id) === convId);
                
                if (index !== -1) {
                  const newMessages = [...prev];
                  const updated = { ...newMessages[index] };
                  
                  // Atualiza o preview e o horário
                  const newContent = payload.message?.content || payload.content;
                  if (newContent) {
                    updated.message = newContent;
                  }
                  
                  const now = new Date().toISOString();
                  updated.updated_at = now;
                  
                  if (data.type === 'message_created') {
                    updated.created_at = now;
                    newMessages.splice(index, 1);
                    newMessages.unshift(updated);
                  } else {
                    newMessages[index] = updated;
                    // Se a conversa mudou de status, os relatórios/contagens podem ter mudado
                    if (data.type === 'conversation_updated') {
                      reportsRef.current();
                    }
                  }
                  
                  return newMessages;
                } else if (data.type === 'message_created') {
                  // Se for uma conversa nova que não estava na lista, forçamos um sync muito rápido
                  setTimeout(() => syncRef.current(true, true), 50);
                }
                return prev;
              });
            }

            // 3. Atualização imediata das contagens da lateral
            countsRef.current();

            // 4. Debounce curto para a sincronização global (lista de conversas) como garantia
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            
            syncTimeoutRef.current = setTimeout(() => {
              syncRef.current(true, true); // Usa quick sync por padrão nas atualizações de evento
            }, 300); 
          }
        } catch (e) {
          console.error("Erro ao processar mensagem SSE:", e);
        }
      };

      eventSource.onerror = (error) => {
        // Silencia erros normais de fechamento de conexão para evitar poluição no console/UI
        if (eventSource?.readyState === EventSource.CLOSED || eventSource?.readyState === EventSource.CONNECTING) {
           console.log("SSE reconectando...");
        } else {
           console.error("Erro na conexão SSE, tentando reconectar em", reconnectDelay, "ms");
        }

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        // Exponential backoff
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000); // Max 30s
          connect();
        }, reconnectDelay);
      };
    };

    connect();

    return () => {
      console.log("Limpando recursos SSE");
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [mounted]);

  // Refs para funções estáveis em useEffects
  const syncRef = useRef(handleSync);
  const countsRef = useRef(fetchCounts);
  const histRef = useRef(fetchConversationHistory);
  const reportsRef = useRef(fetchReports);

  useEffect(() => { syncRef.current = handleSync; }, [handleSync]);
  useEffect(() => { countsRef.current = fetchCounts; }, [fetchCounts]);
  useEffect(() => { histRef.current = fetchConversationHistory; }, [fetchConversationHistory]);
  useEffect(() => { reportsRef.current = fetchReports; }, [fetchReports]);

  // Supabase Realtime Listener para a tabela atendimentos_camara
  useEffect(() => {
    if (!mounted) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log("Supabase client não disponível para Realtime.");
      return;
    }

    console.log("Iniciando escutador Supabase Realtime para atendimentos_camara...");

    // Canal para atendimentos
    const atendimentosChannel = supabase
      .channel('realtime_atendimentos_camara_hook')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'atendimentos_camara'
        },
        (payload: any) => {
          console.log('Evento Supabase Realtime (Atendimento) recebido. Forçando ritmo máximo.');
          setPollingInterval(5000); // Reseta o polling para 5s instantaneamente
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new;
            if (!record) return;

            const convId = Number(record.conversation_id);
            console.log(`Atualizando dados da conversa ${convId} a partir de evento Realtime (${payload.eventType}).`);

            // 1. Atualiza a lista lateral de conversas (messages)
            setMessages(prev => {
              const index = prev.findIndex(m => Number(m.conversation_id) === convId || Number(m.id) === convId);
              if (index !== -1) {
                const updatedList = [...prev];
                updatedList[index] = {
                  ...updatedList[index],
                  ...record,
                  id: updatedList[index].id // Preserva o ID original do Chatwoot no client
                };
                return updatedList;
              } else {
                // Se for um novo atendimento, adiciona-o ao topo da lista imediatamente
                console.log(`Adicionando nova conversa ${convId} à lista via Realtime.`);
                const newMessage = {
                  ...record,
                  id: convId // No client usamos o ID da conversa como ID da mensagem para a lista
                };
                
                // Evita duplicatas e ordena por data
                const newList = [newMessage, ...prev].sort((a: any, b: any) => {
                  const dateA = new Date(a.updated_at || a.created_at).getTime();
                  const dateB = new Date(b.updated_at || b.created_at).getTime();
                  return dateB - dateA; // Decrescente
                });
                
                return newList;
              }
            });

            // 2. Atualiza a conversa ativa se ela for a que sofreu alteração
            setSelectedMessage(prev => {
              if (prev && (Number(prev.conversation_id) === convId || Number(prev.id) === convId)) {
                console.log(`Atualizando conversa ativa (${convId}) com dados novos do Realtime...`);
                return {
                  ...prev,
                  ...record,
                  id: prev.id // Preserva o ID original do Chatwoot
                };
              }
              return prev;
            });

            // 3. Atualiza relatórios se necessário
            if (mainViewRef.current === 'reports') {
              reportsRef.current();
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`Status de conexão Supabase Realtime (Atendimentos): ${status}`);
      });

    return () => {
      console.log("Removendo escutador Supabase Realtime para atendimentos_camara");
      supabase.removeChannel(atendimentosChannel);
    };
  }, [mounted]); // mainView removido

  useEffect(() => {
    if (!mounted) return;

    // Limpa qualquer timer residual antes de agendar o próximo
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
    }

    const runPolling = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleSync(true, true);
        
        if (mainViewRef.current === 'reports') fetchReports();
        
        const currentId = selectedMessageRef.current?.conversation_id || selectedMessageRef.current?.id;
        if (currentId) fetchConversationHistory(Number(currentId), true);
      }
      
      // Re-agenda a próxima execução
      pollingTimerRef.current = setTimeout(runPolling, pollingInterval);
    };

    // Agenda a execução baseada no intervalo atual
    pollingTimerRef.current = setTimeout(runPolling, pollingInterval);
    
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, [mounted, pollingInterval, handleSync, fetchReports, fetchConversationHistory]);

  // Reativação automática por foco da aba
  useEffect(() => {
    const handleUserActivity = () => {
      // Se estivesse em modo de descanso e o atendente voltar pra aba:
      if (pollingInterval > 3000 && document.visibilityState === 'visible') {
        forceImmediateSync();
      }
    };

    window.addEventListener('focus', handleUserActivity);
    window.addEventListener('visibilitychange', handleUserActivity);
    
    return () => {
      window.removeEventListener('focus', handleUserActivity);
      window.removeEventListener('visibilitychange', handleUserActivity);
    };
  }, [pollingInterval, forceImmediateSync]);


  const toggleLabelVisibility = useCallback(async (labelId: number, currentStatus: boolean) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('labels')
        .update({ show_on_sidebar: !currentStatus })
        .eq('id', labelId);

      if (error) throw error;
      
      setLabels(prev => prev.map(l => l.id === labelId ? { ...l, show_on_sidebar: !currentStatus } : l));
    } catch (e) {
      console.error('Erro ao atualizar visibilidade da etiqueta:', e);
    }
  }, []);

  return useMemo(() => ({
    conversas: messages, setMessages,
    selectedMessage, setSelectedMessage,
    conversationMessages, setConversationMessages,
    loadingHistory, setLoadingHistory,
    inboxSubFilter, setInboxSubFilter,
    mainView, setMainView,
    lastSync, setLastSync,
    inboxFilter, setInboxFilter,
    contactConversations, setContactConversations,
    loadingContactHistory, setLoadingContactHistory,
    replyText, setReplyText,
    isAnalyzing, setIsAnalyzing,
    aiSuggestion, setAiSuggestion,
    loading, setLoading,
    mounted, setMounted,
    isSending, setIsSending,
    isFirstLoad, setIsFirstLoad,
    fullConversationData, setFullConversationData,
    sidebarOpenSections, setSidebarOpenSections,
    cannedResponses, setCannedResponses,
    showCanned, setShowCanned,
    counts, setCounts,
    teams, setTeams,
    reportSummary, setReportSummary,
    reportDaily, setReportDaily,
    reportTeams, reportChannels, reportDistribution, reportConversations,
    loadingReports, setLoadingReports,
    inboxInfo, setInboxInfo,
    showContactDetails, setShowContactDetails,
    reportTab, setReportTab,
    reportRange, setReportRange,
    customDateRange, setCustomDateRange,
    reportsExpanded, setReportsExpanded,
    gabinetesExpanded, setGabinetesExpanded,
    selectedVereador, setSelectedVereador,
    auditLogs,
    labels, setLabels,
    loadingLabels,
    fetchLabels,
    toggleLabelVisibility,
    selectedLabel, setSelectedLabel,
    selectedTeamId, setSelectedTeamId,
    userProfile,
    isUpdatingStatus,
    aiInfo, setAiInfo,
    showAiMenu, setShowAiMenu,
    handleUpdateStatus,
    handleAnalyze,
    handleSendReply,
    handleAddLabel,
    handleAssignTeam,
    fetchConversationDetails,
    fetchContactConversations,
    handleUpdatePriority,
    handleSync: forceImmediateSync,
    forceImmediateSync,
    fetchConversationHistory
  }), [messages, selectedMessage, conversationMessages, loadingHistory, inboxSubFilter, mainView, lastSync, inboxFilter, contactConversations, loadingContactHistory, replyText, isAnalyzing, aiSuggestion, loading, mounted, isSending, isFirstLoad, fullConversationData, sidebarOpenSections, cannedResponses, showCanned, counts, teams, reportSummary, reportDaily, reportTeams, reportChannels, reportDistribution, reportConversations, loadingReports, inboxInfo, showContactDetails, reportTab, reportRange, customDateRange, reportsExpanded, gabinetesExpanded, selectedVereador, auditLogs, labels, loadingLabels, fetchLabels, selectedLabel, selectedTeamId, userProfile, isUpdatingStatus, aiInfo, showAiMenu, handleUpdateStatus, handleAnalyze, handleSendReply, handleAddLabel, handleAssignTeam, fetchConversationDetails, fetchContactConversations, handleUpdatePriority, forceImmediateSync, fetchConversationHistory, toggleLabelVisibility]);
}
