'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { Message } from '@/types';
import { useAiStream } from '@/lib/ai-services/useAiStream';
import { VEREADORES } from './constants';

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
  
  const [cannedResponses, setCannedResponses] = useState<any[]>([]);
  const [showCanned, setShowCanned] = useState(false);
  const [counts, setCounts] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [reportDaily, setReportDaily] = useState<any[]>([]);
  const [reportDetail, setReportDetail] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [inboxInfo, setInboxInfo] = useState<any>(null);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [reportTab, setReportTab] = useState<'visao-geral' | 'conversas' | 'etiquetas' | 'inbox' | 'time' | 'sla' | 'robos'>('visao-geral');
  const [reportRange, setReportRange] = useState<'7' | '15' | '30'>('7');
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [gabinetesExpanded, setGabinetesExpanded] = useState(false);
  const [selectedVereador, setSelectedVereador] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const lastSelectedId = useRef<number | null>(null);

  const fetchCanned = useCallback(async () => {
    try {
      const response = await fetch('/api/chatwoot/canned-responses');
      const data = await response.json();
      if (Array.isArray(data)) setCannedResponses(data);
    } catch (e) {
      console.error('Erro ao buscar respostas rápidas:', e);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/chatwoot/counts');
      const data = await response.json();
      setCounts(data);
    } catch (e) {
      console.error('Erro ao buscar contagens:', e);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/chatwoot/teams');
      const data = await response.json();
      if (Array.isArray(data)) setTeams(data);
    } catch (e) {
      console.error('Erro ao buscar times:', e);
    }
  }, []);

  const fetchInboxInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/chatwoot/inbox/3');
      const data = await response.json();
      setInboxInfo(data);
    } catch (e) {
      console.error('Erro ao buscar info da inbox:', e);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/chatwoot/profile');
      const data = await response.json();
      setUserProfile(data);
    } catch (e) {
      console.error('Erro ao buscar perfil:', e);
    }
  }, []);

  const isSyncingRef = useRef(false);

  const handleSync = useCallback(async (silent = false, quick = false) => {
    if (isSyncingRef.current) return;
    
    if (!silent) setLoading(true);
    try {
      isSyncingRef.current = true;
      const url = quick ? '/api/chatwoot/sync?quick=true' : '/api/chatwoot/sync';
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setLastSync(new Date());
      }
    } catch (error: any) {
      // Silencia erros de rate limit ou rede temporária se for silencioso
      if (silent) {
        console.log("Auto-sync ignorado ou falhou:", error.message);
      } else {
        console.error('Erro ao sincronizar:', error);
      }
    } finally {
      isSyncingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const until = Math.floor(Date.now() / 1000);
      const since = until - (parseInt(reportRange) * 86400);
      
      const queryParams = new URLSearchParams({
        since: since.toString(),
        until: until.toString()
      });

      const summaryRes = await fetch(`/api/chatwoot/reports?${queryParams.toString()}`);
      if (summaryRes.ok) {
        const reportData = await summaryRes.json();
        setReportSummary(reportData);
        
        if (reportTab === 'time') {
          setReportDetail(reportData.teams || []);
          setLoadingReports(false);
          return; 
        } else if (reportTab === 'inbox') {
          setReportDetail(reportData.channels || []);
          setLoadingReports(false);
          return;
        }
      }

      if (reportTab === 'visao-geral') {
        const dailyRes = await fetch(`/api/chatwoot/reports?metric=conversations_count&since=${since}&until=${until}`);
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          if (dailyData.data) {
            setReportDaily(dailyData.data.map((item: any) => {
              let name = '??';
              try {
                if (item.timestamp) {
                  name = format(new Date(item.timestamp * 1000), 'dd/MM');
                }
              } catch (e) {}
              return {
                name,
                value: parseInt(item.value) || 0
              };
            }));
          }
        }
      } else {
        let metric = 'conversations_count';
        let type = 'account';

        if (reportTab === 'inbox') type = 'inbox';
        else if (reportTab === 'time') type = 'team';
        else if (reportTab === 'etiquetas') type = 'label';
        else if (reportTab === 'sla') metric = 'sla_breach_count';

        const detailRes = await fetch(`/api/chatwoot/reports?metric=${metric}&type=${type}&since=${since}&until=${until}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setReportDetail(detailData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setLoadingReports(false);
    }
  }, [reportRange, reportTab]);

  const handleUpdateStatus = useCallback(async (status: 'open' | 'resolved' | 'pending' | 'snoozed') => {
    if (!selectedMessage) return;
    setIsUpdatingStatus(true);
    try {
      // 1. Atualiza o status no Chatwoot
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
          if (!updatedLabels.includes('portal-arquivado')) {
            updatedLabels.push('portal-arquivado');
            labelsChanged = true;
          }
        } else if (status === 'open') {
          // Se estamos reabrindo, removemos a label de arquivado
          if (updatedLabels.includes('portal-arquivado')) {
            updatedLabels = updatedLabels.filter(l => l !== 'portal-arquivado');
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
        setSelectedMessage(prev => prev ? { ...prev, status, labels: updatedLabels } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [selectedMessage, handleSync]);

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
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  }, [selectedMessage, handleSync]);

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
      }
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
    }
  }, [selectedMessage, newLabel, handleSync]);

  const fetchConversationDetails = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/chatwoot/conversations/${id}`);
      const data = await response.json();
      setFullConversationData(data);
      
      if (data && data.meta?.sender) {
        setSelectedMessage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            contact_phone: data.meta.sender.phone_number,
            contact_email: data.meta.sender.email,
            labels: data.labels || prev.labels,
            custom_attributes: data.custom_attributes || prev.custom_attributes
          };
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da conversa:', error);
    }
  }, []);

  const fetchContactConversations = useCallback(async (contactId?: number) => {
    if (!contactId) return;
    setLoadingContactHistory(true);
    try {
      const response = await fetch(`/api/chatwoot/contacts/${contactId}/conversations`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setContactConversations(data);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas do contato:', error);
    } finally {
      setLoadingContactHistory(false);
    }
  }, []);

  const fetchConversationHistory = useCallback(async (id: number, silent = false) => {
    if (!silent) setLoadingHistory(true);
    try {
      const response = await fetch(`/api/chatwoot/conversations/${id}/messages`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedMessages = [...data].sort((a, b) => {
          const dateA = new Date(a.created_at || a.timestamp).getTime();
          const dateB = new Date(b.created_at || b.timestamp).getTime();
          return dateA - dateB;
        });
        setConversationMessages(sortedMessages);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      if (!silent) setLoadingHistory(false);
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
      } else {
        const err = await response.json();
        alert(`Erro ao enviar: ${err.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setIsSending(false);
    }
  }, [replyText, selectedMessage, fetchConversationHistory, handleSync]);

  // Periodic synchronization
  useEffect(() => {
    setMounted(true);
    const init = async () => {
      try {
        // Buscamos apenas o essencial para o funcionamento do chat e barra lateral
        await Promise.all([
          handleSync(),
          fetchCanned(),
          fetchCounts(),
          fetchTeams(),
          fetchInboxInfo(),
          fetchProfile()
        ]);
        
        // Relatórios só carregam no init se o usuário já começar na aba de reports
        if (mainView === 'reports') {
          fetchReports();
        }
      } catch (e) {
        console.error('Initialization error:', e);
      }
    };
    init();
  }, [fetchCanned, fetchCounts, fetchInboxInfo, fetchProfile, fetchReports, fetchTeams, handleSync, mainView]);

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
          fetchContactConversations(selectedMessage.contact_id);
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
            const currentId = selectedMessage?.conversation_id || selectedMessage?.id;
            
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
                    message_type: payload.message_type || (payload.sender?.type === 'contact' ? 0 : 1),
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
              
              fetchConversationHistory(Number(currentId), true);
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
                      fetchReports();
                    }
                  }
                  
                  return newMessages;
                } else if (data.type === 'message_created') {
                  // Se for uma conversa nova que não estava na lista, forçamos um sync muito rápido
                  setTimeout(() => handleSync(true, true), 50);
                }
                return prev;
              });
            }

            // 3. Atualização imediata das contagens da lateral
            fetchCounts();

            // 4. Debounce curto para a sincronização global (lista de conversas) como garantia
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            
            syncTimeoutRef.current = setTimeout(() => {
              handleSync(true, true); // Usa quick sync por padrão nas atualizações de evento
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
  }, [mounted, handleSync, fetchCounts, fetchConversationHistory, selectedMessage, fetchReports]);

  useEffect(() => {
    // Polling de fallback (mais lento agora que temos SSE)
    const interval = setInterval(() => {
      handleSync(true);
      fetchCounts();
      
      // Relatórios só atualizam em background se estivermos na aba deles
      if (mainView === 'reports') {
        fetchReports();
      }
      
      const currentId = selectedMessage?.conversation_id || selectedMessage?.id;
      if (currentId) {
        fetchConversationHistory(Number(currentId), true);
      }
    }, 45000); // 45 segundos de fallback
    return () => clearInterval(interval);
  }, [selectedMessage, handleSync, fetchCounts, fetchConversationHistory, fetchReports, mainView]);

  return {
    messages, setMessages,
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
    reportDetail, setReportDetail,
    loadingReports, setLoadingReports,
    inboxInfo, setInboxInfo,
    showContactDetails, setShowContactDetails,
    reportTab, setReportTab,
    reportRange, setReportRange,
    reportsExpanded, setReportsExpanded,
    gabinetesExpanded, setGabinetesExpanded,
    selectedVereador, setSelectedVereador,
    userProfile, setUserProfile,
    isUpdatingStatus, setIsUpdatingStatus,
    newLabel, setNewLabel,
    aiInfo, setAiInfo,
    showAiMenu, setShowAiMenu,
    handleSync,
    fetchCanned,
    fetchCounts,
    fetchTeams,
    fetchInboxInfo,
    fetchProfile,
    fetchReports,
    handleUpdateStatus,
    handleUpdatePriority,
    handleAddLabel,
    fetchConversationDetails,
    fetchContactConversations,
    fetchConversationHistory,
    handleAnalyze,
    handleSendReply
  };
}
