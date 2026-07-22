'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Sparkles, 
  PanelLeftClose, 
  Search, 
  X, 
  CheckCheck, 
  RefreshCw, 
  Send, 
  Hash, 
  ChevronDown, 
  AtSign, 
  Users, 
  Mail, 
  Phone, 
  Copy, 
  Plus, 
  Minus, 
  Clock,
  Settings, 
  Info, 
  User, 
  Paperclip, 
  FileText, 
  PieChart,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Message } from '@/types';

interface ChatWindowProps {
  selectedMessage: Message | null;
  setSelectedMessage: (msg: Message | null) => void;
  conversationMessages: any[];
  loadingHistory: boolean;
  replyText: string;
  setReplyText: (text: string) => void;
  isAnalyzing: boolean;
  aiSuggestion: string | null;
  setAiSuggestion: (text: string | null) => void;
  isSending: boolean;
  cannedResponses: any[];
  showCanned: boolean;
  setShowCanned: (val: boolean) => void;
  showContactDetails: boolean;
  setShowContactDetails: (val: boolean) => void;
  fullConversationData: any;
  sidebarOpenSections: string[];
  setSidebarOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  isUpdatingStatus: boolean;
  aiInfo: string | null;
  setAiInfo: (val: string | null) => void;
  showAiMenu: boolean;
  setShowAiMenu: (val: boolean) => void;
  teams: any[];
  contactConversations: any[];
  loadingContactHistory: boolean;
  handleUpdateStatus: (status: 'open' | 'resolved' | 'pending' | 'snoozed') => Promise<void>;
  handleAnalyze: (msg: Message, mode: 'suggest' | 'info') => Promise<void>;
  handleSendReply: () => Promise<void>;
  handleAddLabel: (labelOverride?: string) => Promise<void>;
  handleAssignTeam: (teamId: number | null) => Promise<void>;
}

const safeFormatDate = (dateString: string | undefined) => {
  if (!dateString) return 'now';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'now';
  return format(date, 'HH:mm');
};

export function ChatWindow({
  selectedMessage,
  setSelectedMessage,
  conversationMessages,
  loadingHistory,
  replyText,
  setReplyText,
  isAnalyzing,
  aiSuggestion,
  setAiSuggestion,
  isSending,
  cannedResponses,
  showCanned,
  setShowCanned,
  showContactDetails,
  setShowContactDetails,
  fullConversationData,
  sidebarOpenSections,
  setSidebarOpenSections,
  isUpdatingStatus,
  aiInfo,
  setAiInfo,
  showAiMenu,
  setShowAiMenu,
  teams,
  contactConversations,
  loadingContactHistory,
  handleUpdateStatus,
  handleAnalyze,
  handleSendReply,
  handleAddLabel,
  handleAssignTeam,
}: ChatWindowProps) {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [prevConvsExpanded, setPrevConvsExpanded] = React.useState(true);

  useEffect(() => {
    if (containerRef.current && scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // Threshold to consider "near bottom"
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom || isFirstLoad.current) {
        scrollRef.current.scrollIntoView({ behavior: isFirstLoad.current ? 'auto' : 'smooth' });
      }

      if (isFirstLoad.current && conversationMessages.length > 0) {
        isFirstLoad.current = false;
      }
    }
  }, [conversationMessages, aiSuggestion]);

  // Reset first load when selected message changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [selectedMessage?.id, selectedMessage?.conversation_id]);

  if (!selectedMessage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-[#f4f1ea]">
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
    );
  }

  return (
    <div className="flex-1 flex bg-[#f4f1ea] relative overflow-hidden">
      {/* Central Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <div className="h-20 border-b border-[#c5a059]/20 flex items-center justify-between px-10 bg-white shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#0a192f] flex items-center justify-center font-serif font-bold text-[#c5a059] border border-[#c5a059]/30 shadow-lg flex-shrink-0">
              {selectedMessage.contact_name ? selectedMessage.contact_name[0] : 'J'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-serif font-bold text-[#0a192f] text-lg tracking-tight truncate max-w-[200px]">{selectedMessage.contact_name || 'Protocolo Reservado'}</p>
                <span className="text-[10px] font-mono font-bold bg-[#0a192f] text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/30">#{selectedMessage.conversation_id}</span>
                <div className={`w-2.5 h-2.5 rounded-full shadow-lg flex-shrink-0 ${
                  selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido') 
                    ? 'bg-slate-400' 
                    : (selectedMessage.status === 'resolved' || selectedMessage.status === 'AGUARDANDO RESOLUÇÃO')
                      ? (selectedMessage.team_id ? 'bg-amber-500 animate-pulse shadow-amber-500/20' : 'bg-emerald-500 animate-pulse shadow-emerald-500/20')
                      : selectedMessage.status === 'open'
                        ? 'bg-emerald-500 animate-pulse shadow-emerald-500/20'
                        : 'bg-[#c5a059] shadow-[#c5a059]/20'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0a192f]/40">
                   {selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido') ? 'Arquivada' :
                   selectedMessage.status === 'resolved' ? (selectedMessage.team_id ? 'Pendente Arquivo' : 'Aguardando Gabinete') : 
                   selectedMessage.status === 'AGUARDANDO RESOLUÇÃO' ? 'Aguardando Resolução' :
                   selectedMessage.status === 'open' ? 'Aberta' : 'Pendente'}
                </span>
                {selectedMessage.labels && selectedMessage.labels.filter(l => l.toLowerCase() !== 'resolvido').map((label, idx) => (
                  <span key={idx} className="bg-[#c5a059]/10 text-[#c5a059] text-[9px] px-2 py-0.5 rounded-full border border-[#c5a059]/20 font-black uppercase tracking-widest flex-shrink-0">
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">Fonte Oficial: Câmara de SJB</p>
            </div>
          </div>
          <div className="flex items-center gap-4 relative flex-shrink-0">
            <button 
              onClick={() => {
                const isArchived = selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido');
                handleUpdateStatus(isArchived ? 'open' : 'resolved');
              }}
              disabled={isUpdatingStatus}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido')
                  ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-600/20'
                  : 'bg-white border-[#c5a059]/30 text-[#0a192f] hover:bg-[#0a192f] hover:text-white'
              }`}
            >
              {isUpdatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              {selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido') ? 'Reativar Protocolo' : 'Finalizar Documento'}
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

        <div ref={containerRef} className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-[#f4f1ea]">
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
                  <p className="text-slate-600 leading-relaxed text-sm italic whitespace-pre-wrap">
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
              (() => {
                let lastDate = '';
                return conversationMessages
                  .filter(m => {
                    if (!m) return false;
                    if (m.message_type === 'system' || m.message_type === 2 || m.raw_message_type === 2) return false;
                    const content = (m.content || m.message || '').toLowerCase();
                    const isAutomation = content.includes('automation system') || 
                                     content.includes('assigned to') ||
                                     (content.includes('added') && (content.includes('label') || content.includes('etiqueta'))) ||
                                     (content.includes('removed') && (content.includes('label') || content.includes('etiqueta'))) ||
                                     content.includes('escolha_vereador') ||
                                     content.includes('estado_encaminhado');
                    return !isAutomation;
                  })
                  .map((m, idx) => {
                    if (!m || m.message_type === 'system' || m.message_type === 2 || m.raw_message_type === 2) return null;
                    const isSystem = m.message_type === 'outgoing' || m.message_type === 1;
                    const msgDate = format(new Date(m.created_at || m.timestamp), 'dd/MM/yyyy');
                    const showDate = msgDate !== lastDate;
                    lastDate = msgDate;

                    const dateLabel = msgDate === format(new Date(), 'dd/MM/yyyy') ? 'Hoje' : 
                                    msgDate === format(new Date(Date.now() - 86400000), 'dd/MM/yyyy') ? 'Ontem' : 
                                    format(new Date(m.created_at || m.timestamp), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

                    return (
                      <React.Fragment key={m.id || idx}>
                        {showDate && (
                          <div className="flex justify-center my-10">
                            <div className="px-6 py-2 bg-[#0a192f]/5 rounded-full border border-[#c5a059]/20">
                              <span className="text-[10px] font-black text-[#0a192f]/40 uppercase tracking-[0.2em]">
                                {dateLabel}
                              </span>
                            </div>
                          </div>
                        )}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isSystem ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] space-y-2 ${isSystem ? 'items-end' : 'items-start'}`}>
                            <div className={`p-6 rounded-2xl shadow-sm border ${
                              isSystem 
                                ? 'bg-[#0a192f] text-white border-[#c5a059]/30 rounded-tr-none' 
                                : 'bg-white text-[#0a192f] border-[#c5a059]/10 rounded-tl-none'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {m.content || m.message}
                              </p>
                            </div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isSystem ? 'text-[#c5a059]' : 'text-slate-400'}`}>
                              {m.sender?.name || (isSystem ? 'Oficial Legislativo' : 'Munícipe')} • {safeFormatDate(m.created_at || m.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  });
              })()
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

        <div className="p-10 bg-white border-t border-[#c5a059]/20 shadow-2xl relative z-10 flex-shrink-0">
          {selectedMessage.labels && selectedMessage.labels.some(l => l.toLowerCase() === 'resolvido') ? (
            <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <CheckCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-bold text-[#0a192f] text-xl">Protocolo Arquivado</h3>
                <p className="text-sm text-slate-500 font-medium">Este atendimento foi arquivado oficialmente no portal. Reabra para novas interações.</p>
              </div>
              <button 
                onClick={() => handleUpdateStatus('open')}
                className="px-8 py-3 bg-[#0a192f] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#152a4a] transition-all shadow-xl shadow-blue-900/20 border border-[#c5a059]/30"
              >
                Reativar Protocolo
              </button>
            </div>
          ) : (
            <>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (replyText.trim() && !isSending) {
                          handleSendReply();
                        }
                      }
                    }}
                    placeholder="Redigir despacho ou resposta oficial (Pressione Enter para enviar, Shift+Enter para nova linha)..."
                    className="flex-1 bg-transparent border-none outline-none text-sm p-5 text-[#0a192f] min-h-[100px] max-h-64 resize-none font-medium placeholder:text-[#0a192f]/30"
                  />
                  <div className="flex flex-col gap-3 p-2 flex-shrink-0">
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
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sincronizado com Chatwoot SJB</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Sidebar - Contact & Actions (Monarchic & Dark Theme) */}
      <AnimatePresence>
        {showContactDetails && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-[#0a192f] border-l border-white/10 flex flex-col z-40 shadow-2xl overflow-hidden h-full flex-shrink-0"
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

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Profile Card - Enhanced Layout based on reference */}
              <div className="flex items-start gap-5">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#c5a059]/10 border border-[#c5a059]/30 overflow-hidden shadow-xl">
                    {selectedMessage.contact_avatar ? (
                      <Image 
                        src={selectedMessage.contact_avatar} 
                        alt="" 
                        width={64}
                        height={64}
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-serif font-bold text-[#c5a059]">
                        {selectedMessage.contact_name?.[0] || 'P'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a192f] rounded-full" />
                </div>

                <div className="flex-1 min-w-0 space-y-3.5 pt-1">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-serif font-bold text-white tracking-tight truncate">
                        {selectedMessage.contact_name || 'Protocolo Reservado'}
                      </h3>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Info className="w-3.5 h-3.5 text-white/30 hover:text-[#c5a059] cursor-pointer transition-colors" />
                        <ExternalLink className="w-3.5 h-3.5 text-white/30 hover:text-[#c5a059] cursor-pointer transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-white/50 group">
                      <Mail className="w-4 h-4 text-white/20 group-hover:text-[#c5a059]/40 transition-colors" />
                      <span className="text-[11px] font-medium truncate">
                        {selectedMessage.contact_email || 'Indisponível'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between group/phone">
                      <div className="flex items-center gap-3 text-white/50">
                        <Phone className="w-4 h-4 text-white/20 group-hover:text-[#c5a059]/40 transition-colors" />
                        <span className="text-[11px] font-medium font-mono tracking-tight">
                          {selectedMessage.contact_phone || 'Não informado'}
                        </span>
                      </div>
                      {selectedMessage.contact_phone && (
                        <button 
                          onClick={() => navigator.clipboard.writeText(selectedMessage.contact_phone!)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-white/10 hover:text-[#c5a059] transition-all opacity-0 group-hover/phone:opacity-100"
                          title="Copiar Telefone"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion Sections - Unified and Ordered as per image */}
              <div className="space-y-3">
                {[
                  { id: 'actions', label: 'Ações da conversa' },
                  { id: 'macros', label: 'Macros' },
                  { id: 'info', label: 'Informação da conversa' },
                  { id: 'attributes', label: 'Atributos do contato' },
                  { id: 'attachments', label: 'Anexos' },
                  { id: 'previous', label: 'Conversas anteriores' }
                ].map((item) => {
                  const isOpen = item.id === 'previous' ? prevConvsExpanded : sidebarOpenSections.includes(item.label);
                  return (
                    <div key={item.id} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                      <button 
                        onClick={() => {
                          if (item.id === 'previous') {
                            setPrevConvsExpanded(!prevConvsExpanded);
                          } else {
                            setSidebarOpenSections(prev => 
                              prev.includes(item.label) ? prev.filter(s => s !== item.label) : [...prev, item.label]
                            );
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.08] transition-all group"
                      >
                        <span className="text-sm font-bold text-white tracking-tight">{item.label}</span>
                        {isOpen ? <Minus className="w-4 h-4 text-white/20" /> : <Plus className="w-4 h-4 text-white/20" />}
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/5 bg-[#0a192f]/20 overflow-hidden"
                          >
                            <div className="p-4">
                              {item.id === 'actions' && (
                                <div className="space-y-4">
                                  <div className="space-y-3">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Estado do Protocolo</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {['open', 'resolved', 'pending', 'snoozed'].map((s) => (
                                        <button
                                          key={s}
                                          onClick={() => handleUpdateStatus(s as any)}
                                          className={`py-2 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                            (s === 'resolved' && selectedMessage.labels?.some(l => l.toLowerCase() === 'resolvido')) || (s !== 'resolved' && selectedMessage.status === s && !selectedMessage.labels?.some(l => l.toLowerCase() === 'resolvido'))
                                              ? 'bg-[#c5a059] text-[#0a192f] border-[#c5a059] shadow-lg shadow-[#c5a059]/10' 
                                              : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                                          }`}
                                        >
                                          {s === 'open' ? 'Aberta' : s === 'resolved' ? 'Arquivada' : s === 'pending' ? 'Pendente' : 'Adiada'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="pt-2 space-y-3 border-t border-white/5">
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Atribuição de Gabinete</p>
                                    <div className="relative group/select">
                                      <select 
                                        value={fullConversationData?.meta?.team?.id || ""}
                                        onChange={(e) => handleAssignTeam(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/90 appearance-none outline-none focus:border-[#c5a059]/50 transition-all cursor-pointer"
                                      >
                                        <option value="" className="bg-[#0a192f]">Sem Gabinete</option>
                                        {teams.map((team: any) => (
                                          <option key={team.id} value={team.id} className="bg-[#0a192f]">
                                            {team.name}
                                          </option>
                                        ))}
                                      </select>
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                        <ChevronDown className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {item.id === 'macros' && (
                                <div className="text-center py-6">
                                  <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Nenhuma macro disponível</p>
                                </div>
                              )}

                              {item.id === 'info' && (
                                <div className="space-y-3">
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
                                          <span className="text-[9px] text-white/40 uppercase tracking-tighter">Canal</span>
                                          <span className="text-[10px] text-white/80 truncate ml-2">{fullConversationData.meta?.channel}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {item.id === 'attributes' && (
                                <div className="space-y-3">
                                  {fullConversationData?.custom_attributes && Object.keys(fullConversationData.custom_attributes).length > 0 ? (
                                    Object.entries(fullConversationData.custom_attributes).map(([key, value]: [string, any]) => (
                                      <div key={key} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] text-white/40 uppercase tracking-tighter">{key}</span>
                                        <span className="text-[10px] text-white/80 font-bold">{String(value)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl">
                                      <p className="text-[9px] text-white/20 uppercase font-black">Nenhum atributo</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {item.id === 'attachments' && (
                                <div className="space-y-3">
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
                                            <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-white/90 truncate">{att.file_type || 'Arquivo'}</p>
                                            <p className="text-[8px] text-white/30 uppercase tracking-tighter">Download</p>
                                          </div>
                                        </a>
                                      ))
                                    ))
                                  ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
                                      <p className="text-[9px] text-white/20 uppercase font-black">Sem anexos</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {item.id === 'previous' && (
                                <div className="-m-4">
                                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                    {loadingContactHistory ? (
                                      <div className="flex flex-col items-center py-10 gap-3">
                                        <RefreshCw className="w-4 h-4 text-[#c5a059] animate-spin opacity-40" />
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Buscando...</p>
                                      </div>
                                    ) : contactConversations && contactConversations.length > 0 ? (
                                      (() => {
                                        const otherConvs = contactConversations.filter(c => Number(c.id) !== (selectedMessage?.conversation_id || selectedMessage?.id));
                                        
                                        if (otherConvs.length === 0) {
                                          return (
                                            <div className="px-5 py-8 text-center">
                                              <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Sem outros registros</p>
                                            </div>
                                          );
                                        }

                                        return otherConvs.slice(0, 15).map((conv, idx) => {
                                          const createdAt = new Date(conv.created_at * 1000);
                                          const diff = Math.floor((Date.now() - createdAt.getTime()) / 1000);
                                          const days = Math.floor(diff / 86400);
                                          const hours = Math.floor((diff % 86400) / 3600);
                                          const timeStr = days > 0 ? `${days}d • ${hours}h` : `${hours}h`;
                                          const lastMsg = conv.messages?.[0]?.content || '---';

                                          return (
                                            <div 
                                              key={conv.id} 
                                              onClick={() => setSelectedMessage({
                                                ...selectedMessage,
                                                id: conv.id,
                                                conversation_id: conv.id,
                                                message: lastMsg,
                                                created_at: new Date(conv.created_at * 1000).toISOString(),
                                                status: conv.status,
                                                labels: conv.labels,
                                                team_id: conv.team_id
                                              } as any)}
                                              className="px-5 py-5 hover:bg-white/[0.04] transition-all cursor-pointer group border-b border-white/5 last:border-0"
                                            >
                                              <div className="flex items-start justify-between mb-1">
                                                <span className="text-sm font-bold text-white group-hover:text-[#c5a059] transition-colors">
                                                  {selectedMessage?.contact_name || 'Protocolo'}
                                                </span>
                                                <div className="flex flex-col items-end gap-0.5">
                                                  <span className="text-[9px] font-mono text-white/30">{timeStr}</span>
                                                  <span className="text-[8px] font-mono text-white/10 group-hover:text-[#c5a059]/40 transition-colors">#{conv.id}</span>
                                                </div>
                                              </div>
                                              
                                              <div className="flex items-start gap-1.5 text-white/50 mb-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 opacity-30">
                                                  <path d="M9 14 4 9l5-5"/>
                                                  <path d="M4 9h12a5 5 0 0 1 5 5v5"/>
                                                </svg>
                                                <p className="text-[12px] line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                  {lastMsg}
                                                </p>
                                              </div>

                                              <div className="flex flex-wrap gap-2">
                                                {conv.labels?.map((label: string, lidx: number) => {
                                                  const isTeam = ['analiel', 'joice', 'alan', 'julinho', 'gabriel', 'lucas'].some(t => label.toLowerCase().includes(t));
                                                  const isStatus = label.includes('atendimento') || label.includes('estado');
                                                  
                                                  const colorClass = isTeam ? 'bg-blue-600' : isStatus ? 'bg-emerald-500' : 'bg-[#c5a059]';
                                                  const borderClass = isTeam ? 'border-blue-500/20' : isStatus ? 'border-emerald-500/20' : 'border-[#c5a059]/20';

                                                  return (
                                                    <span 
                                                      key={lidx} 
                                                      className={`pl-1.5 pr-2 py-0.5 rounded-[4px] text-[9px] font-bold text-white/90 border ${borderClass} bg-white/[0.03] flex items-center gap-1.5`}
                                                    >
                                                      <div className={`w-2 h-2 rounded-sm ${colorClass}`} />
                                                      {label}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()
                                    ) : (
                                      <div className="px-5 py-8 text-center">
                                        <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Sem registros</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
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
                <span className="font-mono text-[7px] tracking-tighter opacity-50">Sessão Criptografada via Portal Geral</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
