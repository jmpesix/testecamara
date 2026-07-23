'use client';

import React, { useState } from 'react';
import { RefreshCw, Shield, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Message } from '@/types';
import { VEREADORES } from './constants';
import { getPriority, PRIORITY_CONFIG, PriorityLevel } from '@/lib/priority';

interface ConversationListProps {
  conversas: Message[];
  selectedMessage: Message | null;
  setSelectedMessage: (msg: Message | null) => void;
  inboxSubFilter: 'mine' | 'unassigned' | 'all' | 'resolved';
  setInboxSubFilter: (filter: 'mine' | 'unassigned' | 'all' | 'resolved') => void;
  mainView: 'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports';
  selectedVereador: string | null;
  inboxFilter: number | null;
  loading: boolean;
  reportSummary: any;
  selectedLabel: string | null;
  selectedTeamId: number | null;
}

const safeFormatTime = (dateString: string | undefined) => {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--:--';
  return format(date, 'HH:mm');
};

const safeFormatDateOnly = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return format(date, 'dd/MM/yy');
};

export function ConversationList({
  conversas,
  selectedMessage,
  setSelectedMessage,
  inboxSubFilter,
  setInboxSubFilter,
  mainView,
  selectedVereador,
  inboxFilter,
  loading,
  reportSummary,
  selectedLabel,
  selectedTeamId,
}: ConversationListProps) {
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');

  const filteredMessages = conversas.filter(msg => {
    // Filtro por Prioridade
    if (priorityFilter !== 'all') {
      const msgPriority = getPriority(msg);
      if (msgPriority !== priorityFilter) return false;
    }

    // Filtro Global por Etiqueta
    if (selectedLabel && (!msg.labels || !msg.labels.includes(selectedLabel))) return false;

    // Filtro Global por Time
    if (selectedTeamId && msg.team_id !== selectedTeamId) return false;

    const isArchived = (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'resolvido')) || msg.status === 'arquivado';

    // Filtro por visualização principal
    if (mainView === 'resolved') {
      if (!isArchived) return false;
    }

    if (mainView === 'all') {
      if (inboxFilter && msg.inbox_id !== inboxFilter) return false;
      if (inboxSubFilter === 'resolved') return isArchived;
      if (inboxSubFilter === 'unassigned') return !msg.assignee || msg.assignee === 'Não atribuído';
      return true;
    }

    if (mainView === 'vereadores') {
      if (selectedVereador) {
        const v = VEREADORES.find(v => v.name === selectedVereador);
        if (v && msg.team_id !== v.id && msg.vereador_assigned !== v.name && (msg as any).vereador !== v.name) return false;
      } else {
        const isGab = ((msg.team_id || 0) >= 4 && (msg.team_id || 0) <= 16) || !!msg.vereador_assigned || !!(msg as any).vereador;
        if (!isGab) return false;
      }
    }

    if (mainView === 'duvidas') {
      const isDuvidas = msg.team_id === 2 || msg.theme === 'Dúvidas' || (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'dúvidas' || l.toLowerCase() === 'duvidas'));
      if (!isDuvidas) return false;
    }

    if (mainView === 'reclamacoes') {
      const isReclamacoes = msg.team_id === 3 || msg.theme === 'Ouvidoria' || (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'ouvidoria' || l.toLowerCase() === 'reclamações' || l.toLowerCase() === 'reclamacoes'));
      if (!isReclamacoes) return false;
    }

    // Filtro por Inbox (Canal)
    if (inboxFilter && msg.inbox_id !== inboxFilter) return false;
    
    // Filtros de atribuição e status interno
    if (inboxSubFilter === 'resolved') return isArchived;
    if (inboxSubFilter === 'mine') return !isArchived;
    if (inboxSubFilter === 'unassigned') return !isArchived && (!msg.assignee || msg.assignee === 'Não atribuído');
    
    return true;
  }).sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime());

  return (
    <div className={`bg-white border-r border-[#c5a059]/20 flex flex-col z-10 shadow-xl transition-all duration-500 ${mainView === 'reports' ? 'w-0 overflow-hidden border-none' : 'w-[400px]'}`}>
      <div className="p-8 border-b border-[#c5a059]/10 bg-[#fdfcf9] min-w-[400px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0a192f] tracking-tight flex items-center gap-2">
              {selectedLabel ? `Etiqueta: ${selectedLabel}` : 
               selectedTeamId ? `Time: ${VEREADORES.find(v => v.id === selectedTeamId)?.name || 'Especializado'}` :
               mainView === 'all' ? 'Portal Geral' :
               mainView === 'vereadores' ? (
                selectedVereador 
                  ? (['Joice Pedra', 'Soninha Pereira'].includes(selectedVereador) ? `Vereadora ${selectedVereador}` : `Vereador ${selectedVereador}`)
                  : 'Gabinete Legislativo'
               ) :
               mainView === 'duvidas' ? 'Informações' :
               mainView === 'reclamacoes' ? 'Ouvidoria' :
               mainView === 'resolved' ? 'Arquivados' : ''
              }
              {loading && <Loader2 className="w-4 h-4 text-[#c5a059] animate-spin ml-2" />}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolos Ativos</span>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="p-2 hover:bg-[#c5a059]/10 rounded-full transition-colors text-[#c5a059]"
            title="Recarregar Portal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
              { id: 'resolved', label: 'Arquivados' }
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
              { id: 'resolved', label: 'Arquivados' }
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

        {/* Priority Filter Bar */}
        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-[#c5a059]/10 overflow-x-auto custom-scrollbar">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 flex-shrink-0">
            Prioridade:
          </span>
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
              priorityFilter === 'all'
                ? 'bg-[#0a192f] text-[#c5a059] border-[#0a192f]'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setPriorityFilter('alta')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
              priorityFilter === 'alta'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            🔴 Alta
          </button>
          <button
            onClick={() => setPriorityFilter('media')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
              priorityFilter === 'media'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            🟡 Média
          </button>
          <button
            onClick={() => setPriorityFilter('baixa')}
            className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 ${
              priorityFilter === 'baixa'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🟢 Baixa
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfaf5]">
        {loading && filteredMessages.length === 0 ? (
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
          filteredMessages.map((msg, index) => {
            const priority = getPriority(msg);
            const priorityCfg = PRIORITY_CONFIG[priority];

            return (
              <div 
                key={`${msg.conversation_id || msg.id}-${index}`}
                onClick={() => setSelectedMessage(msg)}
                className={`p-6 cursor-pointer transition-all border-b border-[#c5a059]/5 relative hover:bg-[#f4f1ea] group ${selectedMessage?.id === msg.id ? 'bg-[#f4f1ea]' : ''}`}
              >
                {selectedMessage?.id === msg.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c5a059]" />}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#c5a059]/20 flex items-center justify-center font-serif font-bold text-[#c5a059] text-lg shadow-sm flex-shrink-0 group-hover:border-[#c5a059]/40 transition-colors relative">
                    {msg.contact_name ? msg.contact_name.substring(0, 1).toUpperCase() : 'P'}
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${priorityCfg.dotBg}`} title={`Prioridade ${priorityCfg.label}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-serif font-bold text-sm text-[#0a192f] truncate">
                          {msg.contact_name || 'Protocolo Reservado'}
                        </span>
                        <span className="text-[10px] font-black text-[#c5a059]/60 uppercase tracking-widest whitespace-nowrap">
                          #{msg.conversation_id || msg.id}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 ml-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded leading-none">
                          {safeFormatTime(msg.created_at)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400/70 uppercase tracking-tighter leading-none pr-1">
                          {safeFormatDateOnly(msg.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-3 line-clamp-2 leading-relaxed italic opacity-80">
                      &quot;{msg.message}&quot;
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityCfg.badgeBg} ${priorityCfg.badgeText} ${priorityCfg.badgeBorder} flex items-center gap-1`}>
                          <span>{priorityCfg.icon}</span> {priorityCfg.label}
                        </span>
                        {msg.labels && msg.labels.map((label, lIdx) => (
                          <span key={lIdx} className="bg-[#c5a059]/10 text-[#c5a059] text-[8px] px-2 py-0.5 rounded-full font-black border border-[#c5a059]/10 uppercase tracking-tighter">
                            {label}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ml-auto">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          msg.labels && msg.labels.some(l => l.toLowerCase() === 'resolvido') ? 'bg-slate-500' :
                          msg.status === 'resolved' ? 'bg-amber-500 animate-pulse' : 
                          msg.status === 'open' ? 'bg-[#c5a059]' : 
                          msg.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                        <span className={
                          msg.labels && msg.labels.some(l => l.toLowerCase() === 'resolvido') ? 'text-slate-500' :
                          (msg.status === 'resolved' || msg.status === 'AGUARDANDO RESOLUÇÃO') ? 'text-amber-600 font-bold' : 
                          msg.status === 'open' ? 'text-[#c5a059]' : 
                          msg.status === 'pending' ? 'text-amber-600' : 'text-slate-400'
                        }>
                          {msg.labels && msg.labels.some(l => l.toLowerCase() === 'resolvido') ? 'Arquivada' :
                           (msg.status === 'resolved' || msg.status === 'AGUARDANDO RESOLUÇÃO') ? 'Aguardando Resolução' : 
                           msg.status === 'open' ? 'Aberta' : 
                           msg.status === 'pending' ? 'Pendente' : 'Adiada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div className="p-12 text-center">
          <div className="inline-block px-4 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Fim dos Registros Oficiais
          </div>
        </div>
      </div>
    </div>
  );
}
