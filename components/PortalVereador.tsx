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
  Tags,
  Heart,
  Timer,
  Cpu
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

export default function PortalVereador() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inboxSubFilter, setInboxSubFilter] = useState<'mine' | 'unassigned' | 'all'>('all');
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
  const [loadingReports, setLoadingReports] = useState(false);
  const [inboxInfo, setInboxInfo] = useState<any>(null);
  const [showContactDetails, setShowContactDetails] = useState(true);
  const [reportSubView, setReportSubView] = useState<'overview' | 'conversations' | 'agents' | 'inboxes' | 'teams' | 'labels' | 'csat' | 'sla' | 'bots'>('overview');
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    setMounted(true);
    handleSync();
    fetchCanned();
    fetchCounts();
    fetchTeams();
    fetchInboxInfo();
    fetchProfile();
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      // Busca sumário
      const summaryRes = await fetch('/api/chatwoot/reports');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setReportSummary(summaryData);
      }

      // Busca dados diários de conversas (últimos 7 dias)
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const dailyRes = await fetch(`/api/chatwoot/reports?metric=conversations_count&since=${Math.floor(sevenDaysAgo.getTime() / 1000)}&until=${Math.floor(now.getTime() / 1000)}`);
      if (dailyRes.ok) {
        const dailyData = await dailyRes.json();
        if (dailyData.data) {
          setReportDaily(dailyData.data.map((item: any) => ({
            name: format(new Date(item.timestamp * 1000), 'dd/MM'),
            value: parseInt(item.value)
          })));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (mainView === 'reports') {
      fetchReports();
    }
  }, [mainView]);

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

  const handleAddLabel = async () => {
    if (!selectedMessage || !newLabel) return;
    try {
      const currentLabels = selectedMessage.labels || [];
      const labels = [...currentLabels, newLabel];
      const response = await fetch(`/api/chatwoot/conversations/${selectedMessage.conversation_id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels })
      });
      if (response.ok) {
        setNewLabel('');
        handleSync();
        setSelectedMessage(prev => prev ? { ...prev, labels } : null);
      }
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
    }
  };

  useEffect(() => {
    if (selectedMessage) {
      setIsFirstLoad(true);
      fetchConversationHistory(selectedMessage.conversation_id || selectedMessage.id);
      fetchContactConversations(selectedMessage.contact_id);
    } else {
      setConversationMessages([]);
      setContactConversations([]);
    }
  }, [selectedMessage]);

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

  const fetchConversationHistory = async (id: number) => {
    setLoadingHistory(true);
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
      setLoadingHistory(false);
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

  // Periodic sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSync(true);
      fetchCounts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (msg: Message) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg.message })
      });
      const data = await response.json();
      if (data.analysis?.suggested_response) {
        setAiSuggestion(data.analysis.suggested_response);
      } else {
        setAiSuggestion(data.suggested_response);
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
    // Primeiro filtro por status (Resolvido vs Outros)
    if (mainView === 'resolved') {
      if (msg.status !== 'resolved') return false;
    } else {
      if (msg.status === 'resolved') return false;
    }

    // Filtros por Categoria/Time (Baseado na fonte/equipe atribuída)
    const sourceLower = (msg.source || '').toLowerCase();
    
    if (mainView === 'all' && msg.inbox_id !== 3) return false;
    if (mainView === 'vereadores' && !sourceLower.includes('vereador')) return false;
    if (mainView === 'duvidas' && msg.team_id !== 2 && !sourceLower.includes('duvida') && !sourceLower.includes('informação')) return false;
    if (mainView === 'reclamacoes' && msg.team_id !== 3 && !sourceLower.includes('reclamação')) return false;

    // Filtro por Inbox (Canal)
    if (inboxFilter && msg.inbox_id !== inboxFilter) return false;
    
    // Filtros de atribuição (Minhas / Não atribuídas)
    if (inboxSubFilter === 'mine') return msg.assignee === 'joao';
    if (inboxSubFilter === 'unassigned') return !msg.assignee || msg.assignee === 'Não atribuído';
    
    return true;
  }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const availableInboxes = Array.from(new Set(messages.map(m => m.inbox_id))).filter(Boolean);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f4f1ea] text-[#0a192f] font-sans selection:bg-[#c5a059]/30 overflow-hidden">
      {/* Sidebar Main - Institutional Navigation */}
      <div className="w-72 bg-[#0a192f] border-r border-[#c5a059]/10 flex flex-col z-20 shadow-xl">
        <div className="p-8 border-b border-[#c5a059]/10 space-y-6">
          <div className="text-center flex flex-col items-center">
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
          <div>
            <span className="text-[10px] font-black text-[#c5a059]/50 uppercase tracking-[0.2em] px-4 block mb-4">
              Painel do Vereador
            </span>
            <div className="space-y-1">
              {[
                { id: 'all', icon: Hash, label: 'Caixa de Entrada Geral', sublabel: 'Todas as Demandas', color: 'text-[#c5a059]' },
                { id: 'vereadores', icon: Users, label: 'Gabinete Legislativo', sublabel: 'Vereadores Ativos', color: 'text-blue-400' },
                { id: 'duvidas', icon: AtSign, label: 'Dúvidas e Informações', sublabel: 'Informações Oficiais', color: 'text-emerald-400' },
                { id: 'reclamacoes', icon: Clock, label: 'Ouvidoria de Reclamações', sublabel: 'Reclamações e Críticas', color: 'text-amber-400' },
                { id: 'resolved', icon: CheckCheck, label: 'Protocolos Resolvidos', sublabel: 'Casos Resolvidos', color: 'text-slate-400' },
                { id: 'reports', icon: BarChart3, label: 'Auditoria e Relatórios', sublabel: 'Métricas de Desempenho', color: 'text-purple-400', hasSubmenu: true }
              ].map((item) => {
                const isActive = mainView === item.id;
                const isReports = item.id === 'reports';

                const itemCount = messages.filter(msg => {
                  const sourceLower = (msg.source || '').toLowerCase();
                  if (item.id === 'reports') return false;
                  if (item.id === 'resolved') return msg.status === 'resolved';
                  if (msg.status === 'resolved') return false;
                  if (item.id === 'all') return msg.inbox_id === 3;
                  if (item.id === 'vereadores') return sourceLower.includes('vereador');
                  if (item.id === 'duvidas') return msg.team_id === 2 || sourceLower.includes('duvida') || sourceLower.includes('informação');
                  if (item.id === 'reclamacoes') return msg.team_id === 3 || sourceLower.includes('reclamação');
                  return true;
                }).length;

                return (
                  <div key={item.id} className="space-y-1">
                    <button 
                      onClick={() => {
                        if (isReports) {
                          setIsReportsMenuOpen(!isReportsMenuOpen);
                          setMainView('reports');
                        } else {
                          setMainView(item.id as any);
                          setSelectedMessage(null);
                        }
                      }}
                      className={`w-full flex flex-col px-4 py-3 rounded-2xl transition-all group border ${
                        isActive 
                          ? 'bg-[#c5a059]/10 border-[#c5a059]/30 text-white shadow-lg' 
                          : 'hover:bg-white/5 border-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-4 h-4 ${isActive ? 'text-[#c5a059]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span className="text-xs font-bold tracking-tight">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {itemCount > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-[#c5a059] text-[#0a192f]' : 'bg-white/10 text-slate-500'
                            }`}>
                              {itemCount}
                            </span>
                          )}
                          {isReports && (
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isReportsMenuOpen ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Submenu de Relatórios */}
                    {isReports && (
                      <AnimatePresence>
                        {isReportsMenuOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-10 space-y-1"
                          >
                            {[
                              { id: 'overview', label: 'Visão geral' },
                              { id: 'conversations', label: 'Conversas' },
                              { id: 'agents', label: 'Agentes' },
                              { id: 'labels', label: 'Etiquetas' },
                              { id: 'teams', label: 'Time' },
                              { id: 'csat', label: 'CSAT' },
                              { id: 'sla', label: 'SLA' },
                              { id: 'bots', label: 'Robôs' }
                            ].map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setReportSubView(sub.id as any);
                                  setMainView('reports');
                                }}
                                className={`w-full text-left py-2 text-[11px] font-medium transition-all ${
                                  reportSubView === sub.id && mainView === 'reports'
                                    ? 'text-[#c5a059]' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
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
                {mainView === 'vereadores' && 'Gabinete'}
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

          <div className="flex items-center justify-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a192f] border-b-2 border-[#c5a059] pb-1">
              CAIXA DE ENTRADA CÂMARA
            </h4>
          </div>
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
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfcf9] p-10">
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Título Dinâmico */}
              <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-6">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#0a192f]">
                    {reportSubView === 'overview' && 'Auditoria e Controle de Demandas'}
                    {reportSubView === 'conversations' && 'Análise de Conversas e Canais'}
                    {reportSubView === 'agents' && 'Desempenho de Agentes'}
                    {reportSubView === 'teams' && 'Resumo do Time'}
                    {reportSubView === 'labels' && 'Desempenho por Etiquetas'}
                    {reportSubView === 'csat' && 'Índice de Satisfação (CSAT)'}
                    {reportSubView === 'sla' && 'Relatórios de SLA'}
                    {reportSubView === 'bots' && 'Métricas de Automação (Robôs)'}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a059] mt-1">
                    {reportSubView === 'overview' && 'Relatórios de Desempenho Legislativo'}
                    {reportSubView === 'conversations' && 'Métricas de Fluxo e Performance por Caixa de Entrada'}
                    {reportSubView === 'agents' && 'Produtividade Individual da Equipe'}
                    {reportSubView === 'teams' && 'Gestão de Gabinetes e Departamentos'}
                    {reportSubView === 'labels' && 'Categorização e Frequência de Assuntos'}
                    {reportSubView === 'csat' && 'Feedback e Qualidade do Atendimento'}
                    {reportSubView === 'sla' && 'Cumprimento de Prazos Institucionais'}
                    {reportSubView === 'bots' && 'Eficácia de Respostas Automáticas'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a2e4d] transition-all">
                    <RefreshCw className="w-3 h-3" />
                    Sincronizar
                  </button>
                </div>
              </div>

              {reportSubView === 'overview' && (
                  <>
                    {/* Grid de Métricas Diretas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Volume Total', value: reportSummary?.conversations_count || 0, color: 'text-[#0a192f]' },
                        { label: 'Resolvidos', value: reportSummary?.resolutions_count || 0, color: 'text-emerald-600' },
                        { label: 'T. Médio Resposta', value: reportSummary?.avg_first_response_time ? `${Math.round(reportSummary.avg_first_response_time / 60)}m` : '0m', color: 'text-amber-600' },
                        { label: 'Mensagens Recebidas', value: reportSummary?.incoming_messages_count || 0, color: 'text-blue-600' }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white border border-[#c5a059]/10 p-5 rounded-2xl shadow-sm">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</h4>
                          <div className={`text-2xl font-serif font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-[#c5a059]/10">
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
                              <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #c5a05933', borderRadius: '8px', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="value" stroke="#c5a059" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c5a059]/10">
                        <h3 className="font-serif text-lg font-bold text-[#0a192f] mb-6 flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#c5a059]" />
                          Distribuição
                        </h3>
                        <div className="space-y-6">
                          {[
                            { name: 'Gabinete Principal', value: 45, color: 'bg-[#0a192f]' },
                            { name: 'Jurídico', value: 30, color: 'bg-[#c5a059]' },
                            { name: 'Obras/Infra', value: 15, color: 'bg-slate-400' },
                            { name: 'Saúde', value: 10, color: 'bg-emerald-500' }
                          ].map((item, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0a192f]">
                                <span>{item.name}</span>
                                <span>{item.value}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} className={`h-full ${item.color}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {reportSubView === 'conversations' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c5a059]/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif text-lg font-bold text-[#0a192f]">Conversas</h3>
                          <span className="text-2xl font-serif font-bold text-[#0a192f]">331 <span className="text-[10px] text-emerald-600">▲ 2446%</span></span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportDaily}>
                              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                              <RechartsTooltip />
                              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c5a059]/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-serif text-lg font-bold text-[#0a192f]">Mensagens Recebidas</h3>
                          <span className="text-2xl font-serif font-bold text-[#0a192f]">269 <span className="text-[10px] text-emerald-600">▲ 1394%</span></span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportDaily.map(d => ({ ...d, messages: Math.floor(d.value * 4.5) }))}>
                              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                              <RechartsTooltip />
                              <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Dados de Caixa de Entrada integrados */}
                    <div className="bg-white rounded-3xl shadow-sm border border-[#c5a059]/10 overflow-hidden">
                      <div className="p-6 border-b border-[#c5a059]/10 bg-[#fcfaf5]">
                        <h3 className="font-serif text-lg font-bold text-[#0a192f]">Desempenho por Caixa de Entrada</h3>
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#fcfaf5] text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[#c5a059]/10">
                            <th className="px-6 py-4">Caixa de Entrada</th>
                            <th className="px-6 py-4">Nº de Conversas</th>
                            <th className="px-6 py-4">T. Médio Resposta</th>
                            <th className="px-6 py-4">T. Médio Resolução</th>
                            <th className="px-6 py-4 text-right">Resoluções</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[{name: 'Câmara de SJB', id: 1}, {name: 'Ouvidoria Digital', id: 2}].map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-[#fcfaf5]/50 transition-all">
                              <td className="px-6 py-5 text-xs font-bold text-[#0a192f]">{item.name}</td>
                              <td className="px-6 py-5 text-xs font-mono">{Math.floor(Math.random() * 300 + 100)}</td>
                              <td className="px-6 py-5 text-xs">1 Hr 18 Min</td>
                              <td className="px-6 py-5 text-xs">5 Hr 47 Min</td>
                              <td className="px-6 py-5 text-right text-xs font-bold text-[#0a192f]">{Math.floor(Math.random() * 200 + 80)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {reportSubView === 'teams' && (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#c5a059]/10 overflow-hidden">
                    <div className="p-6 border-b border-[#c5a059]/10 bg-[#fcfaf5]">
                      <p className="text-xs text-slate-500 italic">
                        Tenha uma visão geral do desempenho dos seus times com métricas essenciais.
                      </p>
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#fcfaf5] text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[#c5a059]/10">
                          <th className="px-6 py-4">Time</th>
                          <th className="px-6 py-4">Nº de Conversas</th>
                          <th className="px-6 py-4">Tempo Médio de Primeira Resposta</th>
                          <th className="px-6 py-4">Tempo Médio de Resolução</th>
                          <th className="px-6 py-4 text-right">Contagem de Resolução</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(teams.length > 0 ? teams : [{name: 'Gabinete Principal', id: 1}, {name: 'Jurídico', id: 2}]).map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-[#fcfaf5]/50 transition-all">
                            <td className="px-6 py-5 text-xs font-bold text-[#0a192f]">{item.name}</td>
                            <td className="px-6 py-5 text-xs font-mono">{Math.floor(Math.random() * 200 + 50)}</td>
                            <td className="px-6 py-5 text-xs">7 Min 24 Sec</td>
                            <td className="px-6 py-5 text-xs">11 Min 50 Sec</td>
                            <td className="px-6 py-5 text-right text-xs font-bold text-[#0a192f]">{Math.floor(Math.random() * 100 + 40)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportSubView === 'agents' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: 'Ver. João Moonsix', conversations: 45, csat: '4.9', status: 'online' },
                      { name: 'Ana Souza (Gabinete)', conversations: 32, csat: '4.8', status: 'offline' },
                      { name: 'Carlos Lima (Jurídico)', conversations: 28, csat: '4.7', status: 'online' }
                    ].map((agent, i) => (
                      <div key={i} className="bg-white border border-[#c5a059]/10 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-[#0a192f]/5 flex items-center justify-center text-[#0a192f] font-bold text-lg">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#0a192f]">{agent.name}</h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              agent.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {agent.status}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Conversas</p>
                            <p className="text-lg font-serif font-bold text-[#0a192f]">{agent.conversations}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Satisfação</p>
                            <p className="text-lg font-serif font-bold text-emerald-600">{agent.csat}/5</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(['labels', 'csat', 'sla', 'bots'].includes(reportSubView)) && (
                  <div className="bg-white rounded-3xl shadow-sm border border-[#c5a059]/10 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#fcfaf5] text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[#c5a059]/10">
                          <th className="px-6 py-4">
                            {reportSubView === 'labels' && 'Etiqueta'}
                            {reportSubView === 'csat' && 'Agente'}
                            {reportSubView === 'sla' && 'Gabinete'}
                            {reportSubView === 'bots' && 'Automação'}
                          </th>
                          <th className="px-6 py-4">
                            {reportSubView === 'labels' && 'Volume'}
                            {reportSubView === 'csat' && 'Avaliações'}
                            {reportSubView === 'sla' && 'Total Conversas'}
                            {reportSubView === 'bots' && 'Interações'}
                          </th>
                          <th className="px-6 py-4">
                            {reportSubView === 'labels' && 'Resolução'}
                            {reportSubView === 'csat' && 'Média'}
                            {reportSubView === 'sla' && 'Dentro do Prazo'}
                            {reportSubView === 'bots' && 'Resolvidos'}
                          </th>
                          <th className="px-6 py-4 text-right">
                            {reportSubView === 'labels' && 'Tendência'}
                            {reportSubView === 'csat' && 'Performance'}
                            {reportSubView === 'sla' && '% SLA'}
                            {reportSubView === 'bots' && 'Eficácia'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3].map((item, i) => (
                          <tr key={i} className="hover:bg-[#fcfaf5]/50 transition-all">
                            <td className="px-6 py-5 text-xs font-bold text-[#0a192f]">
                              {reportSubView === 'labels' && ['Obras', 'Saúde', 'Iluminação'][i]}
                              {reportSubView === 'csat' && ['João M.', 'Ana S.', 'Carlos L.'][i]}
                              {reportSubView === 'sla' && ['Gabinete 01', 'Gabinete 02', 'Jurídico'][i]}
                              {reportSubView === 'bots' && ['Triagem Inicial', 'FAQ Automático', 'Protocolo'][i]}
                            </td>
                            <td className="px-6 py-5 text-xs font-mono">{Math.floor(Math.random() * 100 + 20)}</td>
                            <td className="px-6 py-5 text-xs">
                              {reportSubView === 'labels' && '85%'}
                              {reportSubView === 'csat' && '4.8/5'}
                              {reportSubView === 'sla' && '92%'}
                              {reportSubView === 'bots' && '65%'}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className="text-[10px] font-black uppercase text-emerald-600">▲ {Math.floor(Math.random() * 15 + 5)}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
              <div className="flex items-center gap-4">
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
                <button 
                  onClick={() => handleAnalyze(selectedMessage)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0a192f] border border-[#c5a059]/30 text-[#c5a059] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#152a4a] transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 group"
                >
                  <Sparkles className={`w-4 h-4 group-hover:animate-pulse ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  {isAnalyzing ? 'Analisando...' : 'Consultar IA'}
                </button>
                <button 
                  onClick={() => setShowContactDetails(!showContactDetails)}
                  className={`p-3 rounded-xl transition-all border ${showContactDetails ? 'bg-[#c5a059]/20 border-[#c5a059]/30 text-[#0a192f]' : 'text-slate-400 hover:bg-slate-100 border-transparent'}`}
                >
                  <PanelLeftClose className={`w-5 h-5 transition-transform ${showContactDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-[#f4f1ea]">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 border-4 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                  <p className="font-serif italic text-[#0a192f]/60">Recuperando transcrições oficiais...</p>
                </div>
              ) : conversationMessages.length > 0 ? (
                conversationMessages.map((m, idx) => {
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
                          {m.sender?.name || (isSystem ? 'Oficial Legislativo' : 'Peticionário')} • {safeFormatDate(m.created_at || m.timestamp)}
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
                      <span className="text-[9px] font-black text-[#c5a059] uppercase tracking-widest">{selectedMessage.contact_name} • Protocolo de Entrada</span>
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
                    className="bg-emerald-50 border border-emerald-200/50 rounded-[40px] p-10 shadow-inner"
                  >
                    <div className="flex items-center gap-4 mb-6 text-emerald-700">
                      <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-xl">Recomendação do Painel do Vereador IA</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Análise de Conteúdo e Contexto</p>
                      </div>
                    </div>
                    <p className="text-sm text-emerald-900 leading-relaxed italic mb-8 border-l-4 border-emerald-500/30 pl-6">
                      &quot;{aiSuggestion}&quot;
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(null); }}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                      >
                        Aplicar Transcrição
                      </button>
                      <button 
                        onClick={() => setAiSuggestion(null)}
                        className="px-8 py-3 bg-white border border-emerald-200 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                      >
                        Ignorar Sugestão
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
            <div className="w-40 h-40 bg-white rounded-[50px] flex items-center justify-center mb-12 shadow-[0_30px_60px_-15px_rgba(10,25,47,0.15)] border border-[#c5a059]/20 rotate-6">
              <Shield className="w-20 h-20 text-[#c5a059] opacity-30 -rotate-6" />
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
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dossiê do Peticionário</h3>
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
                        fill 
                        className="object-cover" 
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
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Accordion Sections - Densified */}
              <div className="space-y-2">
                {[
                  { label: 'Mensagens agendadas', icon: Clock },
                  { label: 'Ações da conversa', icon: Settings, defaultOpen: true },
                  { label: 'Macros', icon: FileText },
                  { label: 'Informação da conversa', icon: Info },
                  { label: 'Atributos do contato', icon: User },
                  { label: 'Notas do contato', icon: StickyNote },
                  { label: 'Anexos', icon: Paperclip },
                  { label: 'Conversas anteriores', icon: History },
                  { label: 'Participantes da conversa', icon: Users }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-3.5 hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-3.5 h-3.5 text-[#c5a059]/60 group-hover:text-[#c5a059]" />
                        <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-wider">{item.label}</span>
                      </div>
                      <Plus className="w-3 h-3 text-white/20 group-hover:text-white/50" />
                    </button>
                    
                    {item.label === 'Ações da conversa' && (
                      <div className="px-4 pb-4 space-y-4">
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
                      </div>
                    )}
                  </div>
                ))}
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
