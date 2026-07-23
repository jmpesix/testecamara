'use client';

import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Search, 
  Hash, 
  AtSign, 
  Clock, 
  CheckCheck, 
  ChevronDown, 
  BarChart3 
} from 'lucide-react';
import { Message } from '@/types';
import { VEREADORES } from './constants';

interface SidebarProps {
  conversas: Message[];
  mainView: 'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports';
  setMainView: (view: 'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports') => void;
  gabinetesExpanded: boolean;
  setGabinetesExpanded: (expanded: boolean) => void;
  selectedVereador: string | null;
  setSelectedVereador: (v: string | null) => void;
  reportsExpanded: boolean;
  setReportsExpanded: (expanded: boolean) => void;
  reportTab: 'visao-geral' | 'conversas' | 'assuntos-recorrentes' | 'inbox' | 'time' | 'sla' | 'robos' | 'auditoria';
  setReportTab: (tab: 'visao-geral' | 'conversas' | 'assuntos-recorrentes' | 'inbox' | 'time' | 'sla' | 'robos' | 'auditoria') => void;
  reportSummary: any;
  setSelectedMessage: (msg: Message | null) => void;
  setInboxSubFilter: (filter: 'mine' | 'unassigned' | 'all' | 'resolved') => void;
  userProfile: any;
  labels: any[];
  selectedLabel: string | null;
  setSelectedLabel: (label: string | null) => void;
  teams: any[];
  selectedTeamId: number | null;
  setSelectedTeamId: (teamId: number | null) => void;
}

export function Sidebar({
  conversas,
  mainView,
  setMainView,
  gabinetesExpanded,
  setGabinetesExpanded,
  selectedVereador,
  setSelectedVereador,
  reportsExpanded,
  setReportsExpanded,
  reportTab,
  setReportTab,
  reportSummary,
  setSelectedMessage,
  setInboxSubFilter,
  userProfile,
  labels,
  selectedLabel,
  setSelectedLabel,
  teams,
  selectedTeamId,
  setSelectedTeamId,
}: SidebarProps) {
  return (
    <>
      {/* Sidebar Left - Professional Navy */}
      <div id="sidebar-left-rail" className="w-16 bg-[#0a192f] border-r border-[#c5a059]/20 flex flex-col items-center py-6 gap-8 z-30 shadow-2xl">
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
      <div id="sidebar-main-navigation" className="w-72 bg-[#0a192f] border-r border-[#c5a059]/10 flex flex-col z-20 shadow-xl">
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-6 space-y-6">
          <div>
            <span className="text-[10px] font-black text-[#c5a059]/50 uppercase tracking-[0.2em] px-4 block mb-4">
              Painel do Vereador
            </span>
            <div className="space-y-2">
              {[
                { id: 'all', icon: Hash, label: 'Portal Geral', sublabel: 'Todas as Demandas' },
                { id: 'vereadores', icon: Users, label: 'Gabinete Legislativo', sublabel: 'Vereadores Ativos' },
                { id: 'duvidas', icon: AtSign, label: 'Dúvidas e Informações', sublabel: 'Informações Oficiais' },
                { id: 'reclamacoes', icon: Clock, label: 'Ouvidoria de Reclamações', sublabel: 'Reclamações e Críticas' },
                { id: 'resolved', icon: CheckCheck, label: 'Protocolos Arquivados', sublabel: 'Casos Arquivados' }
              ].map((item) => {
                const isVereadores = item.id === 'vereadores';
                const itemCount = conversas.filter(msg => {
                  const isArchived = (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'resolvido')) || msg.status === 'arquivado';
                  
                  if (item.id === 'all') return true;
                  if (item.id === 'resolved') return isArchived;
                  if (isArchived) return false;
                  if (item.id === 'vereadores') {
                    return ((msg.team_id || 0) >= 4 && (msg.team_id || 0) <= 16) || !!msg.vereador_assigned || !!(msg as any).vereador;
                  }
                  if (item.id === 'duvidas') {
                    return msg.team_id === 2 || msg.theme === 'Dúvidas' || (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'dúvidas' || l.toLowerCase() === 'duvidas'));
                  }
                  if (item.id === 'reclamacoes') {
                    return msg.team_id === 3 || msg.theme === 'Ouvidoria' || (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'ouvidoria' || l.toLowerCase() === 'reclamações' || l.toLowerCase() === 'reclamacoes'));
                  }
                  
                  return false;
                }).length;

                const displayCount = itemCount;

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
                        setSelectedLabel(null);
                        setSelectedTeamId(null);
                        setMainView(item.id as any);
                        setReportsExpanded(false);
                      }}
                      className={`w-full flex flex-col px-4 py-3.5 rounded-2xl transition-all group border ${
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
                          const vCount = conversas.filter(msg => {
                            const isArchived = (msg.labels && Array.isArray(msg.labels) && msg.labels.some((l: any) => l.toLowerCase() === 'resolvido')) || msg.status === 'arquivado';
                            if (isArchived) return false;
                            return msg.team_id === v.id || msg.vereador_assigned === v.name || (msg as any).vereador === v.name;
                          }).length;
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

          <div className="space-y-2">
            <button 
              onClick={() => {
                setReportsExpanded(!reportsExpanded);
                setGabinetesExpanded(false);
                setMainView('reports');
                setSelectedMessage(null);
              }}
              className={`w-full flex flex-col px-4 py-3.5 rounded-2xl transition-all group border ${
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
                  { id: 'time', label: 'Time' },
                  { id: 'conversas', label: 'Conversas' },
                  { id: 'assuntos-recorrentes', label: 'Assuntos Recorrentes' },
                  { id: 'auditoria', label: 'Linha do Tempo / Auditoria' },
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
    </>
  );
}
