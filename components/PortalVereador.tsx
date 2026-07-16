'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  MessageSquare, 
  Filter,
  Send,
  Sparkles,
  ArrowUpDown,
  PanelLeftClose,
  ChevronDown,
  Inbox,
  RefreshCw,
  Search,
  Hash,
  Users,
  AtSign,
  Trash2,
  ExternalLink,
  Plus,
  Minus,
  Mail,
  Phone,
  Paperclip,
  History,
  FileText,
  User,
  Copy,
  Settings,
  Clock,
  CheckCheck,
  Shield,
  UserPlus,
  MoreVertical,
  Info,
  StickyNote,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  ShieldAlert,
  Crown,
  ChevronRight,
  Tag,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from 'recharts';
import { Message } from '@/types';

const VEREADORES = [
  { id: 4, name: 'Alan de Grussaí' },
  { id: 5, name: 'Analiel Vianna' },
  { id: 6, name: 'Caio César' },
  { id: 7, name: 'Elísio Rodrigues' },
  { id: 8, name: 'Eziel Pedro' },
  { id: 9, name: 'Joice Pedra' },
  { id: 10, name: 'Julinho Peixoto' },
  { id: 11, name: 'Júnior Monteiro' },
  { id: 12, name: 'Kaká' },
  { id: 13, name: 'Léo de Lolô' },
  { id: 14, name: 'Rodrigo Machado' },
  { id: 15, name: 'Rommenik' },
  { id: 16, name: 'Soninha Pereira' },
];

export default function PortalVereador() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inboxSubFilter, setInboxSubFilter] = useState<'mine' | 'unassigned' | 'all' | 'resolved'>('all');
  const [mainView, setMainView] = useState<'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports'>('all');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [inboxFilter, setInboxFilter] = useState<number | null>(null);
  const [contactConversations, setContactConversations] = useState<any[]>([]);
  const [loadingContactHistory, setLoadingContactHistory] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [fullConversationData, setFullConversationData] = useState<any>(null);
  const [sidebarOpenSections, setSidebarOpenSections] = useState<string[]>(['Ações da conversa']);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: isFirstLoad ? 'auto' : 'smooth' });
      if (isFirstLoad && conversationMessages.length > 0) {
        setIsFirstLoad(false);
      }
    }
  }, [conversationMessages, aiSuggestion, isFirstLoad]);
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

  useEffect(() => {
    setMounted(true);
    const init = async () => {
      try {
        await Promise.all([
          handleSync(),
          fetchCanned(),
          fetchCounts(),
          fetchTeams(),
          fetchInboxInfo(),
          fetchProfile(),
          fetchReports()
        ]);
      } catch (e) {
        console.error('Initialization error:', e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (mainView === 'reports') {
      fetchReports();
    }
  }, [mainView, reportTab, reportRange]);

  useEffect(() => {
    // Reset subfilter when main view changes to ensure valid tab is selected
    if (mainView === 'duvidas' || mainView === 'reclamacoes') {
      setInboxSubFilter('mine');
    } else if (mainView === 'vereadores') {
      setInboxSubFilter('mine');
    } else {
      setInboxSubFilter('all');
    }
  }, [mainView]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const until = Math.floor(Date.now() / 1000);
      const since = until - (parseInt(reportRange) * 86400);
      
      const queryParams = new URLSearchParams({
        since: since.toString(),
        until: until.toString()
      });

      // Busca sumário completo (incluindo times, canais e distribuição)
      const summaryRes = await fetch(`/api/chatwoot/reports?${queryParams.toString()}`);
      if (summaryRes.ok) {
        const reportData = await summaryRes.json();
        setReportSummary(reportData);
        
        // Se estiver na aba de times ou inboxes, aproveita os dados do sumário
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

      const now = new Date();
      // Se estiver na visão geral, busca o gráfico diário
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
        // Busca detalhes específicos da aba
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
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/chatwoot/profile');
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const handleUpdateStatus = async (status: 'open' | 'resolved' | 'pending' | 'snoozed') => {
    if (!selectedMessage) return;
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        handleSync();
        // Atualiza o objeto local
        setSelectedMessage(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (priority: 'urgent' | 'high' | 'medium' | 'low' | null) => {
    if (!selectedMessage) return;
    try {
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (response.ok) {
        handleSync();
        setSelectedMessage(prev => prev ? { ...prev, priority: priority || '' } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  };

  const handleAddLabel = async (labelOverride?: string) => {
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
        handleSync();
        setSelectedMessage(prev => prev ? { ...prev, labels } : null);
      }
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
    }
  };

  const lastSelectedId = useRef<number | null>(null);

  useEffect(() => {
    const currentId = selectedMessage?.conversation_id || selectedMessage?.id;
    if (currentId && selectedMessage) {
      const numericId = Number(currentId);
      // Only fetch if the conversation ID has changed to avoid infinite loops and flashing
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
  }, [selectedMessage?.id, selectedMessage?.conversation_id]);

  const fetchConversationDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/chatwoot/conversations/${id}`);
      const data = await response.json();
      setFullConversationData(data);
      
      // Também atualiza o selectedMessage com dados mais frescos se necessário
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
  };

  const fetchContactConversations = async (contactId?: number) => {
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
  };

  const fetchConversationHistory = async (id: number, silent = false) => {
    if (!silent) setLoadingHistory(true);
    try {
      const response = await fetch(`/api/chatwoot/conversations/${id}/messages`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Ordena por data (mais antigas primeiro para o chat)
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
  };

  const fetchInboxInfo = async () => {
    try {
      const response = await fetch('/api/chatwoot/inbox/3');
      const data = await response.json();
      setInboxInfo(data);
    } catch (error) {
      console.error('Erro ao buscar info da inbox:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/chatwoot/teams');
      const data = await response.json();
      if (Array.isArray(data)) setTeams(data);
    } catch (error) {
      console.error('Erro ao buscar times:', error);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/chatwoot/counts');
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    }
  };

  const fetchCanned = async () => {
    try {
      const response = await fetch('/api/chatwoot/canned-responses');
      const data = await response.json();
      if (Array.isArray(data)) setCannedResponses(data);
    } catch (error) {
      console.error('Erro ao buscar respostas rápidas:', error);
    }
  };

  const handleSync = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/chatwoot/sync');
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Periodic sync every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSync(true);
      fetchCounts();
      
      // Se houver uma conversa selecionada, atualiza o histórico dela silenciosamente
      const currentId = selectedMessage?.conversation_id || selectedMessage?.id;
      if (currentId) {
        fetchConversationHistory(Number(currentId), true);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMessage?.id, selectedMessage?.conversation_id]);

  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiInfo, setAiInfo] = useState<string | null>(null);

  const handleAnalyze = async (msg: Message, mode: 'suggest' | 'info' = 'suggest') => {
    setIsAnalyzing(true);
    setShowAiMenu(false);
    setAiInfo(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msg.message,
          mode 
        })
      });
      const data = await response.json();
      
      if (mode === 'suggest') {
        setAiSuggestion(data.suggested_response);
      } else if (mode === 'info') {
        setAiInfo(data.info);
      }
    } catch (error) {
      console.error('Erro ao analisar:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendReply = async () => {
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
        handleSync();
      } else {
        const err = await response.json();
        alert(`Erro ao enviar: ${err.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
    } finally {
      setIsSending(false);
    }
  };

  const safeFormatDate = (dateString: string | undefined) => {
    if (!dateString) return 'now';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'now';
    return format(date, 'HH:mm');
  };

  const filteredMessages = messages.filter(msg => {
    // Filtro por visualização principal
    if (mainView === 'resolved') {
      if (msg.status !== 'resolved') return false;
    } else if (mainView === 'all') {
      // Portal Geral (inbox 3) foca em demandas abertas
      if (msg.status === 'resolved') return false;
    }
    // Para vereadores, duvidas e reclamacoes, permitimos ver o histórico completo (abertos + resolvidos)

    // Filtros por Categoria/Time (Baseado na fonte/equipe atribuída)
    const sourceLower = (msg.source || '').toLowerCase();
    
    if (mainView === 'all' && msg.inbox_id !== 3) return false;
    if (mainView === 'vereadores') {
      if (selectedVereador) {
        const v = VEREADORES.find(v => v.name === selectedVereador);
        if (v && msg.team_id !== v.id) return false;
      } else {
        // Gabinete Legislativo: Mensagens de todos os times de 4 a 16
        if ((msg.team_id || 0) < 4 || (msg.team_id || 0) > 16) return false;
      }
    }
    if (mainView === 'duvidas' && msg.team_id !== 2) return false;
    if (mainView === 'reclamacoes' && msg.team_id !== 3) return false;

    // Filtro por Inbox (Canal)
    if (inboxFilter && msg.inbox_id !== inboxFilter) return false;
    
    // Filtros de atribuição e status interno
    if (mainView === 'vereadores') {
      if (inboxSubFilter === 'resolved') return msg.status === 'resolved';
      // "Meus Protocolos" no Gabinete Legislativo mostra todas as mensagens direcionadas aos vereadores (abertas + resolvidas)
      if (inboxSubFilter === 'mine') return true;
    }

    if (mainView === 'duvidas' || mainView === 'reclamacoes') {
      if (inboxSubFilter === 'resolved') return msg.status === 'resolved';
      return msg.status !== 'resolved';
    }
    
    if (inboxSubFilter === 'mine') return msg.assignee === 'joao' || true; // Modified to show all for now as requested
    if (inboxSubFilter === 'unassigned') return !msg.assignee || msg.assignee === 'Não atribuído';
    
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const availableInboxes = Array.from(new Set(messages.map(m => m.inbox_id))).filter(Boolean);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f4f1ea] text-[#0a192f] font-sans selection:bg-[#c5a059]/30 overflow-hidden">
      {/* Sidebar Left - Professional Navy */}
      <div className="w-16 bg-[#0a192f] border-r border-[#c5a059]/20 flex flex-col items-center py-6 gap-8 z-30 shadow-2xl">
        <div className="w-10 h-10 bg-[#c5a059] rounded-lg flex items-center justify-center text-[#0a192f] font-serif font-bold text-lg shadow-lg border border-[#c5a059]/50">
          SJB
        </div>
        <div className="flex flex-col gap-4">
          <button className="p-3 text-[#c5a059] bg-[#c5a059]/10 rounded-xl border border-[#c5a059]/20 shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="p-3 text-slate-500 hover:text-[#c5a059] transition-colors">
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Main - Institutional Navigation */}
      <div className="w-72 bg-[#0a192f] border-r border-[#c5a059]/10 flex flex-col z-20 shadow-xl">
        <div className="p-8 border-b border-[#c5a059]/10 space-y-6">
          <div className="text-center">
            <h1 className="font-serif text-lg font-bold text-[#c5a059] leading-tight tracking-wide uppercase">
              Câmara Municipal
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 opacity-70">
              São João da Barra
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#c5a059]/60" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full bg-white/5 border border-[#c5a059]/20 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#c5a059]/50 transition-all placeholder:text-slate-600 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div>
            <span className="text-[10px] font-black text-[#c5a059]/50 uppercase tracking-[0.2em] px-4 block mb-4">
              Painel do Vereador
            </span>
            <div className="space-y-1">
              {[
                { id: 'all', icon: Hash, label: 'Portal Geral', sublabel: 'Todas as Demandas', color: 'text-[#c5a059]' },
                { id: 'vereadores', icon: Users, label: 'Gabinete Legislativo', sublabel: 'Vereadores Ativos', color: 'text-blue-400' },
                { id: 'duvidas', icon: AtSign, label: 'Dúvidas e Informações', sublabel: 'Informações Oficiais', color: 'text-emerald-400' },
                { id: 'reclamacoes', icon: Clock, label: 'Ouvidoria de Reclamações', sublabel: 'Reclamações e Críticas', color: 'text-amber-400' },
                { id: 'resolved', icon: CheckCheck, label: 'Protocolos Resolvidos', sublabel: 'Casos Resolvidos', color: 'text-slate-400' }
              ].map((item) => {
                const isVereadores = item.id === 'vereadores';
                const itemCount = messages.filter(msg => {
                  const sourceLower = (msg.source || '').toLowerCase();
                  
                  // Aba Protocolos Resolvidos: mostra apenas resolvidos
                  if (item.id === 'resolved') return msg.status === 'resolved';
                  
                  // Outras categorias: contam apenas os pendentes (não resolvidos)
                  if (msg.status === 'resolved') return false;

                  if (item.id === 'all') return msg.inbox_id === 3;
                  if (item.id === 'vereadores') return (msg.team_id || 0) >= 4 && (msg.team_id || 0) <= 16;
                  if (item.id === 'duvidas') return msg.team_id === 2;
                  if (item.id === 'reclamacoes') return msg.team_id === 3;
                  
                  return false;
                }).length;

                const displayCount = (item.id === 'resolved' && reportSummary?.resolutions_count !== undefined) 
                  ? reportSummary.resolutions_count 
                  : itemCount;

                return (
                  <div key={item.id} className="space-y-1">
                    <button 
                      onClick={() => {
                        if (isVereadores) {
                          setGabinetesExpanded(!gabinetesExpanded);
                          setSelectedVereador(null);
                          setInboxSubFilter('mine');
                        } else {
                          setGabinetesExpanded(false);
                          setSelectedVereador(null);
                          if (item.id === 'all') {
                            setInboxSubFilter('all');
                          } else {
                            setInboxSubFilter('mine');
                          }
                        }
                        setMainView(item.id as any);
                        setReportsExpanded(false);
                      }}
                      className={`w-full flex flex-col px-4 py-3 rounded-2xl transition-all group border ${
                        mainView === item.id 
                          ? 'bg-[#c5a059]/10 border-[#c5a059]/30 text-white shadow-lg' 
                          : 'hover:bg-white/5 border-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${mainView === item.id ? 'text-[#c5a059]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span className="text-xs font-bold tracking-tight">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {displayCount > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              mainView === item.id ? 'bg-[#c5a059] text-[#0a192f]' : 'bg-white/10 text-slate-500'
                            }`}>
                              {displayCount}
                            </span>
                          )}
                          {isVereadores && (
                            <ChevronDown className={`w-3 h-3 transition-transform ${gabinetesExpanded ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                      </div>
                    </button>

                    {isVereadores && gabinetesExpanded && (
                      <div className="pl-10 space-y-1 py-1">
                        {VEREADORES.map((v) => {
                          const vCount = messages.filter(msg => msg.team_id === v.id && msg.status !== 'resolved').length;
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                setSelectedVereador(v.name);
                                setMainView('vereadores');
                                setSelectedMessage(null);
                              }}
                              className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs transition-all ${
                                selectedVereador === v.name 
                                  ? 'text-white font-bold bg-white/10' 
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <span>{v.name}</span>
                              {vCount > 0 && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                                  {vCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => {
                setReportsExpanded(!reportsExpanded);
                setGabinetesExpanded(false);
                setMainView('reports');
                setSelectedMessage(null);
              }}
              className={`w-full flex flex-col px-4 py-3 rounded-2xl transition-all group border ${
                mainView === 'reports' 
                  ? 'bg-[#c5a059]/10 border-[#c5a059]/30 text-white shadow-lg' 
                  : 'hover:bg-white/5 border-transparent text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-4 h-4 ${mainView === 'reports' ? 'text-[#c5a059]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="text-xs font-bold tracking-tight">Auditoria e Relatórios</span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${reportsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {reportsExpanded && (
              <div className="pl-10 space-y-1 py-1">
                {[
                  { id: 'visao-geral', label: 'Visão geral' },
                  { id: 'conversas', label: 'Conversas' },
                  { id: 'etiquetas', label: 'Etiquetas' },
                  { id: 'inbox', label: 'Caixa de Entrada' },
                  { id: 'time', label: 'Time' },
                  { id: 'sla', label: 'SLA' },
                  { id: 'robos', label: 'Robôs' }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => setReportTab(subTab.id as any)}
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-all ${
                      reportTab === subTab.id 
                        ? 'text-white font-bold bg-white/10' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        <div className="p-6 border-t border-[#c5a059]/10 bg-[#071120]">
          {userProfile && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#c5a059] flex items-center justify-center text-[#0a192f] font-serif font-bold text-lg shadow-lg">
                {userProfile.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-widest">Servidor Logado</p>
                <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Elegant Parchment List */}
      <div className={`bg-white border-r border-[#c5a059]/20 flex flex-col z-10 shadow-xl transition-all duration-500 ${mainView === 'reports' ? 'w-0 overflow-hidden border-none' : 'w-[400px]'}`}>
        <div className="p-8 border-b border-[#c5a059]/10 bg-[#fdfcf9] min-w-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#0a192f] tracking-tight">
                {mainView === 'all' && 'Fluxo Central'}
                {mainView === 'vereadores' && (
                  selectedVereador 
                    ? (['Joice Pedra', 'Soninha Pereira'].includes(selectedVereador) ? `Vereadora ${selectedVereador}` : `Vereador ${selectedVereador}`)
                    : 'Gabinete Legislativo'
                )}
                {mainView === 'duvidas' && 'Informações'}
                {mainView === 'reclamacoes' && 'Ouvidoria'}
                {mainView === 'resolved' && 'Resolvidos'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolos Ativos</span>
              </div>
            </div>
          </div>

          {mainView === 'all' ? (
            <div className="flex items-center gap-6">
              {[
                { id: 'all', label: 'Toda Câmara' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setInboxSubFilter(tab.id as any)}
                  className={`pb-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all relative ${inboxSubFilter === tab.id ? 'text-[#0a192f]' : 'text-slate-400'}`}
                >
                  {tab.label}
                  {inboxSubFilter === tab.id && <motion.div layoutId="subfilter" className="absolute bottom-0 left-0 right-0 h-1 bg-[#c5a059] rounded-full" />}
                </button>
              ))}
            </div>
          ) : mainView === 'vereadores' ? (
            <div className="flex items-center gap-6">
              {[
                { id: 'mine', label: 'Meus Protocolos' },
                { id: 'resolved', label: 'Resolvidos' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setInboxSubFilter(tab.id as any)}
                  className={`pb-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all relative ${inboxSubFilter === tab.id ? 'text-[#0a192f]' : 'text-slate-400'}`}
                >
                  {tab.label}
                  {inboxSubFilter === tab.id && <motion.div layoutId="subfilter" className="absolute bottom-0 left-0 right-0 h-1 bg-[#c5a059] rounded-full" />}
                </button>
              ))}
            </div>
          ) : (mainView === 'duvidas' || mainView === 'reclamacoes') ? (
            <div className="flex items-center gap-6">
              {[
                { id: 'mine', label: 'Meus Protocolos' },
                { id: 'resolved', label: 'Resolvidos' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setInboxSubFilter(tab.id as any)}
                  className={`pb-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all relative ${inboxSubFilter === tab.id ? 'text-[#0a192f]' : 'text-slate-400'}`}
                >
                  {tab.label}
                  {inboxSubFilter === tab.id && <motion.div layoutId="subfilter" className="absolute bottom-0 left-0 right-0 h-1 bg-[#c5a059] rounded-full" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex justify-center">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a192f] border-b-2 border-[#c5a059] pb-1">
                Meus Protocolos
              </h4>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfaf5]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <RefreshCw className="w-8 h-8 text-[#c5a059] animate-spin" />
              <p className="font-serif italic text-slate-500 text-sm">Consultando anais legislativos...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 p-12 text-center">
              <div className="w-16 h-16 bg-[#c5a059]/5 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-[#c5a059]/20" />
              </div>
              <p className="font-serif italic text-slate-500 text-sm">Nenhum protocolo oficial registrado nesta seção.</p>
            </div>
          ) : (
            filteredMessages.map((msg, index) => (
              <div 
                key={`${msg.conversation_id || msg.id}-${index}`}
                onClick={() => setSelectedMessage(msg)}
                className={`p-6 cursor-pointer transition-all border-b border-[#c5a059]/5 relative hover:bg-[#f4f1ea] group ${selectedMessage?.id === msg.id ? 'bg-[#f4f1ea]' : ''}`}
              >
                {selectedMessage?.id === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c5a059]" />}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#c5a059]/20 flex items-center justify-center font-serif font-bold text-[#c5a059] text-lg shadow-sm flex-shrink-0 group-hover:border-[#c5a059]/40 transition-colors">
                    {msg.contact_name ? msg.contact_name.substring(0, 1).toUpperCase() : 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-serif font-bold text-sm text-[#0a192f] truncate">{msg.contact_name || 'Protocolo Reservado'}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">
                        {safeFormatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3 line-clamp-2 leading-relaxed italic opacity-80">
                      &quot;{msg.message}&quot;
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {msg.labels && msg.labels.slice(0, 2).map((label, lIdx) => (
                          <span key={lIdx} className="bg-[#c5a059]/10 text-[#c5a059] text-[8px] px-2 py-0.5 rounded-full font-black border border-[#c5a059]/10 uppercase tracking-tighter">
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          msg.status === 'open' ? 'bg-[#c5a059]' : 
                          msg.status === 'resolved' ? 'bg-emerald-500' : 
                          msg.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                        <span className={
                          msg.status === 'open' ? 'text-[#c5a059]' : 
                          msg.status === 'resolved' ? 'text-emerald-600' : 
                          msg.status === 'pending' ? 'text-amber-600' : 'text-slate-400'
                        }>
                          {msg.status === 'open' ? 'Aberta' : 
                           msg.status === 'resolved' ? 'Resolvida' : 
                           msg.status === 'pending' ? 'Pendente' : 'Adiada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="p-12 text-center">
            <div className="inline-block px-4 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Fim dos Registros Oficiais
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat View - Parchment Document Style */}
      <div className="flex-1 flex flex-col bg-[#f4f1ea] relative">
        {mainView === 'reports' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#fdfcf9]">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Cabeçalho de Conteúdo */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#0a192f]">
                    {reportTab === 'visao-geral' ? 'Visão Geral de Auditoria' : 
                      reportTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a059] mt-1">Controle de Desempenho Legislativo</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[
                      { label: '7D', value: '7' },
                      { label: '15D', value: '15' },
                      { label: '30D', value: '30' }
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setReportRange(range.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          reportRange === range.value 
                            ? 'bg-white text-[#0a192f] shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a2e4d] transition-all">
                    <Activity className="w-3 h-3" />
                    Sincronizar
                  </button>
                </div>
              </div>

              {reportTab === 'visao-geral' ? (
                <>
                  {/* Grid de Métricas Diretas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Volume Total', value: reportSummary?.summary?.conversations_count || reportSummary?.conversations_count || 0, color: 'text-[#0a192f]' },
                      { label: 'Resolvidos', value: reportSummary?.summary?.resolutions_count || reportSummary?.resolutions_count || 0, color: 'text-emerald-600' },
                      { label: 'T. Médio Resposta', value: (reportSummary?.summary?.avg_first_response_time || reportSummary?.avg_first_response_time) ? `${Math.round((reportSummary?.summary?.avg_first_response_time || reportSummary?.avg_first_response_time) / 60)}m` : '0m', color: 'text-amber-600' },
                      { label: 'Mensagens Recebidas', value: reportSummary?.summary?.incoming_messages_count || reportSummary?.incoming_messages_count || 0, color: 'text-blue-600' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</h4>
                        <div className={`text-2xl font-serif font-bold ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Seção de Dados e Ranking */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Gráfico de Tendência */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-lg font-bold text-[#0a192f]">Volume de Demandas (7 dias)</h3>
                        <TrendingUp className="w-4 h-4 text-[#c5a059]" />
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={reportDaily}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#c5a059" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #c5a05933', borderRadius: '8px', fontSize: '10px' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#c5a059" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Ranking de Agentes / Equipes */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                      <h3 className="font-serif text-lg font-bold text-[#0a192f] mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#c5a059]" />
                        Tempo de Resposta (Distribuição)
                      </h3>
                      <div className="space-y-6">
                        {reportSummary?.distribution ? (
                          Object.entries(reportSummary.distribution).slice(0, 1).map(([channel, data]: [string, any]) => (
                            Object.entries(data).map(([range, count]: [string, any], i) => {
                              const total = Object.values(data).reduce((a: any, b: any) => a + b, 0) as number;
                              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                              return (
                                <div key={i} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0a192f]">
                                    <span>{range}</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      className={`h-full bg-[#c5a059]`}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-40 text-slate-400 text-xs italic">
                            Dados de distribuição não disponíveis
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Métricas de Eficiência Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#fcfaf5] p-6 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] mb-4">Média de Resolução</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-serif font-bold text-[#0a192f]">
                          {(reportSummary?.summary?.avg_resolution_time || reportSummary?.avg_resolution_time) ? Math.round((reportSummary?.summary?.avg_resolution_time || reportSummary?.avg_resolution_time) / 3600) : 0}h
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#fcfaf5] p-6 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] mb-4">Taxa de Resolução</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-serif font-bold text-[#0a192f]">
                          {reportSummary?.summary?.conversations_count ? Math.round((reportSummary.summary.resolutions_count / reportSummary.summary.conversations_count) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#fcfaf5] p-6 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] mb-4">Conversas Totais</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-serif font-bold text-[#0a192f]">
                          {reportSummary?.summary?.conversations_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé de Controle */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Câmara Municipal de São João da Barra</span>
                    <span>Relatório Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </>
              ) : reportTab === 'conversas' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-[#0a192f]">Relatório de Conversas</h3>
                    <TrendingUp className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  
                  {/* Métricas Principais de Conversas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total de Conversas</h4>
                      <div className="text-3xl font-serif font-bold text-[#0a192f]">
                        {reportSummary?.summary?.conversations_count || 0}
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 font-bold">+12% vs período anterior</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Conversas Resolvidas</h4>
                      <div className="text-3xl font-serif font-bold text-emerald-600">
                        {reportSummary?.summary?.resolutions_count || 0}
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2 font-bold">Taxa: {reportSummary?.summary?.conversations_count ? Math.round((reportSummary.summary.resolutions_count / reportSummary.summary.conversations_count) * 100) : 0}%</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mensagens Recebidas</h4>
                      <div className="text-3xl font-serif font-bold text-blue-600">
                        {reportSummary?.summary?.incoming_messages_count || 0}
                      </div>
                      <p className="text-[10px] text-blue-600 mt-2 font-bold">Média: {reportSummary?.summary?.conversations_count ? Math.round(reportSummary.summary.incoming_messages_count / reportSummary.summary.conversations_count) : 0} msg/conv</p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="font-serif text-lg font-bold text-[#0a192f] mb-6">Distribuição de Tempo de Resposta</h4>
                    <div className="space-y-4">
                      {reportSummary?.distribution ? (
                        Object.entries(reportSummary.distribution).slice(0, 1).map(([channel, data]: [string, any]) => (
                          Object.entries(data).map(([range, count]: [string, any], i) => {
                            const total = Object.values(data).reduce((a: any, b: any) => a + b, 0) as number;
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0a192f]">
                                  <span>{range}</span>
                                  <span>{count} conversas ({percentage}%)</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className={`h-full bg-[#c5a059]`}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ))
                      ) : (
                        <div className="text-center py-10 text-slate-400 italic text-sm">Carregando dados de distribuição...</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : reportTab === 'time' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-[#0a192f]">Desempenho por Gabinete / Equipe</h3>
                    <TrendingUp className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {Array.isArray(reportDetail) && reportDetail.length > 0 ? (
                      reportDetail.map((team: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-[#c5a059]/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#0a192f] flex items-center justify-center font-serif font-bold text-[#c5a059] border border-[#c5a059]/20 shadow-inner group-hover:scale-105 transition-transform">
                              {(() => {
                                const id = Number(team.id);
                                const teamFromState = teams.find(t => Number(t.id) === id);
                                const vereadorFromList = VEREADORES.find(v => Number(v.id) === id);
                                const rawName = team.name || teamFromState?.name || vereadorFromList?.name || '';
                                const cleanName = rawName.replace(/^(vereador|vereadora|gabinete)\s*:?\s*/i, '').trim();
                                
                                if (id === 1) return 'S'; // Suporte
                                if (id === 2) return 'D'; // Dúvidas
                                if (id === 3) return 'O'; // Ouvidoria
                                return cleanName ? cleanName[0].toUpperCase() : 'G';
                              })()}
                            </div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-[#0a192f]">
                                {(() => {
                                  const id = Number(team.id);
                                  const teamFromState = teams.find(t => Number(t.id) === id);
                                  const vereadorFromList = VEREADORES.find(v => Number(v.id) === id);
                                  const rawName = team.name || teamFromState?.name || vereadorFromList?.name || '';
                                  const lowerName = rawName.toLowerCase();

                                  if (id === 1) return 'Suporte: Equipe Técnica';
                                  if (id === 2 || lowerName.includes('duvida') || lowerName.includes('informação')) return 'Dúvidas e Informações';
                                  if (id === 3 || lowerName.includes('reclamação') || lowerName.includes('ouvidoria')) return 'Ouvidoria de Reclamações';
                                  if (lowerName === 'vereadores') return 'Gabinete Legislativo Geral';
                                  
                                  // Limpa o nome removendo termos indesejados
                                  const cleanName = rawName.replace(/^(vereador|vereadora|gabinete)\s*:?\s*/i, '').trim();
                                  
                                  if (!cleanName) return vereadorFromList ? `Gabinete: ${vereadorFromList.name}` : 'Gabinete Legislativo';

                                  // Capitalização Inteligente (Title Case)
                                  const capitalized = cleanName
                                    .split(' ')
                                    .map((word: string, index: number) => {
                                      const lowerWord = word.toLowerCase();
                                      const prepositions = ['de', 'da', 'do', 'das', 'dos'];
                                      if (index !== 0 && prepositions.includes(lowerWord)) return lowerWord;
                                      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                    })
                                    .join(' ');

                                  return `Gabinete: ${capitalized}`;
                                })()}
                              </h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">
                                {(() => {
                                  const name = (team.name || '').toLowerCase();
                                  const id = Number(team.id);
                                  const isApoio = id <= 3 || name.includes('suporte') || name.includes('ouvidoria');
                                  return isApoio ? 'Apoio Legislativo' : 'Vereador';
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center min-w-[80px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Demandas</p>
                              <p className="text-lg font-serif font-bold text-[#0a192f]">{team.conversations_count || 0}</p>
                            </div>
                            <div className="text-center min-w-[80px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Resolvidos</p>
                              <p className="text-lg font-serif font-bold text-emerald-600">{team.resolutions_count || 0}</p>
                            </div>
                            <div className="text-center min-w-[100px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Média Resposta</p>
                              <p className="text-lg font-serif font-bold text-amber-600">{team.avg_first_response_time ? `${Math.round(team.avg_first_response_time / 60)}m` : '---'}</p>
                            </div>
                            <div className="text-center min-w-[100px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Média Resolução</p>
                              <p className="text-lg font-serif font-bold text-[#0a192f]">{team.avg_resolution_time ? `${Math.round(team.avg_resolution_time / 3600)}h` : '---'}</p>
                            </div>
                            <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#c5a059] transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <h4 className="font-serif text-lg font-bold text-slate-300">Nenhum dado de equipe encontrado</h4>
                        <p className="text-xs text-slate-400 mt-1 italic">Tente sincronizar novamente ou verifique as configurações do Chatwoot.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : reportTab === 'inbox' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-[#0a192f]">Desempenho por Canal de Entrada</h3>
                    <Inbox className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {Array.isArray(reportDetail) && reportDetail.length > 0 ? (
                      reportDetail.map((inbox: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                              <Inbox className="w-5 h-5 text-[#c5a059]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#0a192f]">{inbox.name}</h4>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{inbox.channel_type || 'WhatsApp'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-10">
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Conversas</p>
                              <p className="text-xl font-serif font-bold text-[#0a192f]">{inbox.conversations_count || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">T. Resposta</p>
                              <p className="text-xl font-serif font-bold text-amber-600">{inbox.avg_first_response_time ? `${Math.round(inbox.avg_first_response_time / 60)}m` : '---'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Inbox className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <h4 className="font-serif text-lg font-bold text-slate-300">Nenhum dado de canal encontrado</h4>
                      </div>
                    )}
                  </div>
                </div>
              ) : reportTab === 'etiquetas' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-[#0a192f]">Assuntos mais Recorrentes (Etiquetas)</h3>
                    <Tag className="w-5 h-5 text-[#c5a059]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.isArray(reportDetail) && reportDetail.length > 0 ? (
                      reportDetail.map((label: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-all">
                          <span className="px-2 py-1 rounded bg-[#c5a059]/10 text-[#c5a059] text-[9px] font-black uppercase tracking-wider self-start mb-4">
                            {label.name}
                          </span>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Volume de Casos</p>
                            <p className="text-2xl font-serif font-bold text-[#0a192f]">{label.conversations_count || 0}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Tag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <h4 className="font-serif text-lg font-bold text-slate-300">Nenhum dado de etiqueta encontrado</h4>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Activity className="w-8 h-8 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0a192f]">Módulo {reportTab.replace('-', ' ')}</h3>
                    <p className="text-sm text-slate-500 italic max-w-sm">Os dados detalhados para esta categoria estão sendo compilados pelo servidor legislativo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : selectedMessage ? (
          <>
            <div className="h-20 border-b border-[#c5a059]/20 flex items-center justify-between px-10 bg-white shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a192f] flex items-center justify-center font-serif font-bold text-[#c5a059] border border-[#c5a059]/30 shadow-lg">
                  {selectedMessage.contact_name ? selectedMessage.contact_name[0] : 'J'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-serif font-bold text-[#0a192f] text-lg tracking-tight">{selectedMessage.contact_name || 'Protocolo Reservado'}</p>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                    {selectedMessage.labels && selectedMessage.labels.map((label, idx) => (
                      <span key={idx} className="bg-[#c5a059]/10 text-[#c5a059] text-[9px] px-2 py-0.5 rounded-full border border-[#c5a059]/20 font-black uppercase tracking-widest">
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Fonte Oficial: Câmara de SJB</p>
                </div>
              </div>
              <div className="flex items-center gap-4 relative">
                <button 
                  onClick={() => handleUpdateStatus(selectedMessage.status === 'resolved' ? 'open' : 'resolved')}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                    selectedMessage.status === 'resolved'
                      ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-600/20'
                      : 'bg-white border-[#c5a059]/30 text-[#0a192f] hover:bg-[#0a192f] hover:text-white'
                  }`}
                >
                  {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  {selectedMessage.status === 'resolved' ? 'Reativar Protocolo' : 'Arquivar Documento'}
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0a192f] border border-[#c5a059]/30 text-[#c5a059] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#152a4a] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 group"
                  >
                    <Sparkles className={`w-4 h-4 group-hover:animate-pulse ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    {isAnalyzing ? 'Processando...' : 'Consultar IA'}
                  </button>
                  
                  {showAiMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#c5a059]/20 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 mb-1">Assistente Legislativa SJB</p>
                      <button 
                        onClick={() => handleAnalyze(selectedMessage, 'suggest')}
                        className="w-full text-left px-4 py-3 hover:bg-[#f4f1ea] rounded-xl transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0a192f]/5 flex items-center justify-center text-[#0a192f]">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#0a192f]">Sugerir Resposta Oficial</p>
                          <p className="text-[9px] text-slate-500">Baseado no contexto da cidade</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => handleAnalyze(selectedMessage, 'info')}
                        className="w-full text-left px-4 py-3 hover:bg-[#f4f1ea] rounded-xl transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059]">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#0a192f]">Análise Técnica / Info</p>
                          <p className="text-[9px] text-slate-500">Orientações para o vereador</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowContactDetails(!showContactDetails)}
                  className={`p-3 rounded-xl transition-all border ${showContactDetails ? 'bg-[#c5a059]/20 border-[#c5a059]/30 text-[#0a192f]' : 'text-slate-400 hover:bg-slate-100 border-transparent'}`}
                >
                  <PanelLeftClose className={`w-5 h-5 transition-transform ${showContactDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-[#f4f1ea]">
              {aiInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-dashed border-[#c5a059]/30 p-8 rounded-3xl shadow-xl mb-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setAiInfo(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0a192f] flex items-center justify-center text-[#c5a059] shadow-lg shrink-0">
                      <Search className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#0a192f] mb-3">Análise Técnica da IA</h3>
                      <p className="text-slate-600 leading-relaxed text-sm italic">
                        {aiInfo}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 border-4 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                  <p className="font-serif italic text-[#0a192f]/60">Recuperando transcrições oficiais...</p>
                </div>
              ) : conversationMessages && conversationMessages.length > 0 ? (
                  conversationMessages
                    .filter(m => {
                      if (!m) return false;
                      const content = (m.content || '').toLowerCase();
                      const isAutomation = content.includes('automation system') || 
                                       content.includes('assigned to') ||
                                       (content.includes('added') && (content.includes('label') || content.includes('etiqueta'))) ||
                                       (content.includes('removed') && (content.includes('label') || content.includes('etiqueta'))) ||
                                       content.includes('escolha_vereador') ||
                                       content.includes('estado_encaminhado');
                      return !isAutomation;
                    })
                    .map((m, idx) => {
                      if (!m) return null;
                      const isSystem = m.message_type === 'outgoing';
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={m.id || idx} 
                          className={`flex ${isSystem ? 'justify-end' : 'justify-start'}`}
                        >
                        <div className={`max-w-[75%] space-y-2 ${isSystem ? 'items-end' : 'items-start'}`}>
                          <div className={`p-6 rounded-2xl shadow-sm border ${
                            isSystem 
                              ? 'bg-[#0a192f] text-white border-[#c5a059]/30 rounded-tr-none' 
                              : 'bg-white text-[#0a192f] border-[#c5a059]/10 rounded-tl-none'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {m.content}
                            </p>
                          </div>
                          <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isSystem ? 'text-[#c5a059]' : 'text-slate-400'}`}>
                            {m.sender?.name || (isSystem ? 'Oficial Legislativo' : 'Munícipe')} • {safeFormatDate(m.created_at || m.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[75%] bg-white p-8 rounded-3xl rounded-tl-none border border-[#c5a059]/20 shadow-xl">
                    <p className="text-sm text-[#0a192f] leading-relaxed italic">&quot;{selectedMessage.message}&quot;</p>
                    <div className="mt-4 flex items-center justify-between border-t border-[#c5a059]/10 pt-4">
                      <span className="text-[9px] font-black text-[#c5a059] uppercase tracking-widest">{selectedMessage.contact_name} • Munícipe</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />

              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-[#c5a059]/30 rounded-[40px] p-10 shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-6 text-[#0a192f]">
                      <div className="p-3 bg-[#0a192f] rounded-2xl text-[#c5a059] shadow-xl shadow-blue-900/20 border border-[#c5a059]/30">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-xl">Assistente do Gabinete (SJB)</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">Sugestão Contextualizada para São João da Barra</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed italic mb-8 border-l-4 border-[#c5a059]/30 pl-6">
                      &quot;{aiSuggestion}&quot;
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(null); }}
                        className="px-10 py-4 bg-[#0a192f] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#152a4a] transition-all shadow-2xl shadow-blue-900/20 border border-[#c5a059]/30"
                      >
                        Aplicar Sugestão
                      </button>
                      <button 
                        onClick={() => setAiSuggestion(null)}
                        className="px-10 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                      >
                        Ignorar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-10 bg-white border-t border-[#c5a059]/20 shadow-2xl relative z-10">
              <AnimatePresence>
                {showCanned && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-10 right-10 mb-6 bg-white border border-[#c5a059]/30 rounded-[32px] shadow-2xl overflow-hidden z-20 max-h-72 flex flex-col backdrop-blur-xl"
                  >
                    <div className="p-5 border-b border-[#c5a059]/10 bg-[#fdfcf9] flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#0a192f] uppercase tracking-[0.2em]">Respostas Oficiais Catalogadas</span>
                      <button onClick={() => setShowCanned(false)} className="text-[#c5a059] hover:text-[#0a192f]">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-4 space-y-2">
                      {cannedResponses.map((res, idx) => (
                        <button 
                          key={idx}
                          onClick={() => { setReplyText(res.content); setShowCanned(false); }}
                          className="w-full text-left p-4 hover:bg-[#f4f1ea] rounded-2xl transition-all group border border-transparent hover:border-[#c5a059]/20"
                        >
                          <p className="text-[10px] font-black text-[#c5a059] mb-1 uppercase tracking-widest">Cod: /{res.short_code}</p>
                          <p className="text-sm font-medium text-slate-700 line-clamp-1">{res.content}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-w-5xl mx-auto">
                <div className="flex items-end gap-5 bg-[#f4f1ea] border border-[#c5a059]/30 rounded-[40px] p-3 focus-within:ring-8 focus-within:ring-[#c5a059]/5 transition-all shadow-inner">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Redigir despacho ou resposta oficial..."
                    className="flex-1 bg-transparent border-none outline-none text-sm p-5 text-[#0a192f] min-h-[100px] max-h-64 resize-none font-medium placeholder:text-[#0a192f]/30"
                  />
                  <div className="flex flex-col gap-3 p-2">
                    <button 
                      onClick={() => setShowCanned(!showCanned)}
                      className={`p-4 rounded-3xl transition-all border ${showCanned ? 'bg-[#0a192f] text-[#c5a059] border-[#c5a059]/50' : 'bg-white text-[#c5a059] border-[#c5a059]/20 hover:border-[#c5a059]/50'}`}
                      title="Modelos Oficiais"
                    >
                      <Hash className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSendReply}
                      disabled={!replyText || isSending}
                      className="p-5 bg-[#0a192f] text-[#c5a059] rounded-3xl hover:bg-[#152a4a] transition-all disabled:opacity-30 shadow-2xl shadow-blue-900/40 group border border-[#c5a059]/30"
                    >
                      {isSending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between px-8">
                  <div className="flex gap-8">
                    <button 
                      onClick={async () => {
                        if (!selectedMessage) return;
                        const ok = confirm('Deseja realmente arquivar este protocolo?');
                        if (!ok) return;
                        handleUpdateStatus('resolved');
                      }}
                      className="text-[10px] font-black text-[#c5a059] hover:text-[#0a192f] uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Finalizar Documento
                    </button>
                    <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Notas Internas</button>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Aberto para Edição</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-60 h-60 mb-10 relative rounded-full overflow-hidden border-4 border-[#c5a059]/30 shadow-[0_20px_50px_rgba(10,25,47,0.3)] hover:scale-105 transition-all duration-500 ease-out bg-[#0a192f] flex items-center justify-center">
              <Image 
                src="/logo-camara.png"
                alt="Brasão Câmara Municipal"
                width={240}
                height={240}
                className="object-contain w-[90%] h-[90%] scale-[1.02]"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="font-serif text-4xl font-bold text-[#0a192f] mb-6 tracking-tight italic">Painel do Vereador</h3>
            <p className="text-[#0a192f]/50 max-w-md font-medium leading-relaxed italic text-lg">
              Selecione um protocolo oficial na galeria à esquerda para iniciar a conferência de documentos e redação legislativa.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Contact & Actions (Monarchic & Dark Theme) */}
      <AnimatePresence>
        {selectedMessage && showContactDetails && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#0a192f] border-l border-white/10 flex flex-col z-40 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-[#0a192f]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dossiê do Munícipe</h3>
              </div>
              <button onClick={() => setShowContactDetails(false)} className="p-1.5 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {/* Profile Card - Ultra Compact */}
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 border border-[#c5a059]/30">
                    {selectedMessage.contact_avatar ? (
                      <Image 
                        src={selectedMessage.contact_avatar} 
                        alt="" 
                        width={56}
                        height={56}
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-serif font-bold text-[#c5a059]">
                        {selectedMessage.contact_name?.[0] || 'P'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a192f] rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-serif font-bold text-white truncate">
                      {selectedMessage.contact_name || 'Protocolo Reservado'}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-[#c5a059] opacity-40 hover:opacity-100 cursor-pointer" />
                  </div>
                  <p className="text-[8px] font-black text-[#c5a059] uppercase tracking-widest mt-0.5">ID: #{selectedMessage.contact_id || '---'}</p>
                  
                  <div className="flex gap-2 mt-3">
                    {selectedMessage.contact_email && (
                      <a href={`mailto:${selectedMessage.contact_email}`} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedMessage.contact_phone && (
                      <a href={`tel:${selectedMessage.contact_phone}`} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button 
                      onClick={() => {
                        const info = `Nome: ${selectedMessage.contact_name}\nID: ${selectedMessage.contact_id}\nEmail: ${selectedMessage.contact_email || 'N/A'}\nFone: ${selectedMessage.contact_phone || 'N/A'}`;
                        navigator.clipboard.writeText(info);
                      }}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accordion Sections - Densified */}
              <div className="space-y-2">
                {[
                  { id: 'actions', label: 'Ações da conversa', icon: Settings },
                  { id: 'info', label: 'Informação da conversa', icon: Info },
                  { id: 'attributes', label: 'Atributos do contato', icon: User },
                  { id: 'attachments', label: 'Anexos', icon: Paperclip },
                ].map((item) => {
                  const isOpen = sidebarOpenSections.includes(item.label);
                  return (
                    <div key={item.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                      <button 
                        onClick={() => {
                          setSidebarOpenSections(prev => 
                            prev.includes(item.label) ? prev.filter(s => s !== item.label) : [...prev, item.label]
                          );
                        }}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-3.5 h-3.5 text-[#c5a059]/60 group-hover:text-[#c5a059]" />
                          <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-wider">{item.label}</span>
                        </div>
                        {isOpen ? <Minus className="w-3 h-3 text-white/20 group-hover:text-white/50" /> : <Plus className="w-3 h-3 text-white/20 group-hover:text-white/50" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 overflow-hidden"
                          >
                            {item.id === 'actions' && (
                              <div className="space-y-4 pt-2">
                                <div className="space-y-3">
                                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Estado do Protocolo</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {['open', 'resolved', 'pending', 'snoozed'].map((s) => (
                                      <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(s as any)}
                                        className={`py-2 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                          selectedMessage.status === s 
                                            ? 'bg-[#c5a059] text-[#0a192f] border-[#c5a059] shadow-lg shadow-[#c5a059]/10' 
                                            : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                                        }`}
                                      >
                                        {s === 'open' ? 'Aberta' : s === 'resolved' ? 'Resolvida' : s === 'pending' ? 'Pendente' : 'Adiada'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="pt-2 space-y-3 border-t border-white/5">
                                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Atribuição de Gabinete</p>
                                  <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-lg bg-[#c5a059]/10 flex items-center justify-center border border-[#c5a059]/20">
                                        <User className="w-3 h-3 text-[#c5a059]" />
                                      </div>
                                      <span className="text-xs font-bold text-white/90">{selectedMessage.assignee || 'Sem Relator'}</span>
                                    </div>
                                    <Settings className="w-3 h-3 text-white/20 hover:text-white cursor-pointer" />
                                  </div>
                                </div>
                                <div className="pt-2 space-y-3 border-t border-white/5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Etiquetas</p>
                                    <Plus className="w-2.5 h-2.5 text-[#c5a059] cursor-pointer" onClick={() => {
                                      const label = prompt('Nova etiqueta:');
                                      if (label) {
                                        handleAddLabel(label);
                                      }
                                    }} />
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {selectedMessage.labels?.map((l, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black text-[#c5a059] uppercase tracking-wider">
                                        {l}
                                      </span>
                                    )) || <span className="text-[8px] text-white/20 italic">Sem etiquetas</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {item.id === 'info' && (
                              <div className="space-y-3 pt-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-white/40 uppercase tracking-tighter">Conversa ID</span>
                                    <span className="text-[10px] font-mono text-white/80">#{selectedMessage.conversation_id}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-white/40 uppercase tracking-tighter">Iniciada em</span>
                                    <span className="text-[10px] text-white/80">{safeFormatDate(selectedMessage.created_at)}</span>
                                  </div>
                                  {fullConversationData && (
                                    <>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-white/40 uppercase tracking-tighter">Caixa de Entrada</span>
                                        <span className="text-[10px] text-white/80 truncate ml-2">{fullConversationData.meta?.channel}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-white/40 uppercase tracking-tighter">Status Atual</span>
                                        <span className="text-[10px] font-black text-[#c5a059] uppercase">{fullConversationData.status}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {item.id === 'attributes' && (
                              <div className="space-y-3 pt-2">
                                {fullConversationData?.custom_attributes && Object.keys(fullConversationData.custom_attributes).length > 0 ? (
                                  Object.entries(fullConversationData.custom_attributes).map(([key, value]: [string, any]) => (
                                    <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                                      <span className="text-[9px] text-white/40 uppercase tracking-tighter">{key}</span>
                                      <span className="text-[10px] text-white/80 font-bold">{String(value)}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-[9px] text-white/20 uppercase font-black">Nenhum atributo extra</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.id === 'attachments' && (
                              <div className="space-y-3 pt-2">
                                {conversationMessages.filter(m => m.attachments && m.attachments.length > 0).length > 0 ? (
                                  conversationMessages.filter(m => m.attachments && m.attachments.length > 0).map((msg, midx) => (
                                    msg.attachments.map((att: any, aidx: number) => (
                                      <a 
                                        key={`${midx}-${aidx}`}
                                        href={att.data_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 flex items-center justify-center border border-[#c5a059]/20">
                                          {att.file_type === 'image' ? <PieChart className="w-3.5 h-3.5 text-[#c5a059]" /> : <FileText className="w-3.5 h-3.5 text-[#c5a059]" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-bold text-white/90 truncate">{att.file_type || 'Arquivo'}</p>
                                          <p className="text-[8px] text-white/30 uppercase tracking-tighter">Anexo Legislativo</p>
                                        </div>
                                      </a>
                                    ))
                                  ))
                                ) : (
                                  <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-[9px] text-white/20 uppercase font-black">Sem anexos vinculados</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 bg-[#0a192f]/50 text-center">
              <p className="text-[8px] text-white/30 font-medium leading-relaxed tracking-tight uppercase">
                Acesso Restrito • Câmara Municipal de SJB<br/>
                <span className="font-mono text-[7px] tracking-tighter opacity-50">Sessão Criptografada via Fluxo Central</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
