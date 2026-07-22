'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subYears, isSameDay, eachDayOfInterval, startOfDay, endOfDay, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LEGISLATIVE_LABELS } from './constants';

// Sub-components
import { OverviewStats } from './reports/OverviewStats';
import { LabelsStats } from './reports/LabelsStats';
import { AuditSection } from './reports/AuditSection';
import { ConversationsStats } from './reports/ConversationsStats';
import { SLAStats } from './reports/SLAStats';
import { TeamsStats } from './reports/TeamsStats';
import { InboxStats } from './reports/InboxStats';

interface DashboardReportsProps {
  mainView: 'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports';
  reportTab: 'visao-geral' | 'conversas' | 'assuntos-recorrentes' | 'inbox' | 'time' | 'sla' | 'robos' | 'auditoria';
  setReportTab: (tab: 'visao-geral' | 'conversas' | 'assuntos-recorrentes' | 'inbox' | 'time' | 'sla' | 'robos' | 'auditoria') => void;
  reportRange: string;
  setReportRange: (range: string) => void;
  customDateRange: {from: Date; to: Date};
  setCustomDateRange: (range: {from: Date; to: Date}) => void;
  reportSummary: any;
  reportDaily: any[];
  reportTeams: any[];
  reportChannels: any[];
  reportDistribution: any;
  reportConversations: any[];
  loadingReports: boolean;
  teams: any[];
  auditLogs: any[];
  labels?: any[];
  loadingLabels?: boolean;
  fetchLabels?: (force?: boolean) => Promise<void>;
  toggleLabelVisibility?: (id: number, current: boolean) => Promise<void>;
}

export function DashboardReports({
  mainView,
  reportTab,
  setReportTab,
  reportRange,
  setReportRange,
  customDateRange,
  setCustomDateRange,
  reportSummary,
  reportDaily,
  reportTeams,
  reportChannels,
  reportDistribution,
  reportConversations,
  loadingReports,
  teams,
  auditLogs,
  labels = [],
  loadingLabels = false,
  fetchLabels = async () => {},
  toggleLabelVisibility = async () => {}
}: DashboardReportsProps) {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [auditoriaSubTab, setAuditoriaSubTab] = React.useState<'timeline' | 'assuntos'>('timeline');
  const [tempRange, setTempRange] = React.useState(reportRange);
  const [tempCustomRange, setTempCustomRange] = React.useState(customDateRange);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const PRESETS = [
    { id: '7days', label: 'Últimos 7 dias', days: 7 },
    { id: '30days', label: 'Últimos 30 dias', days: 30 },
    { id: '3months', label: 'Últimos 3 meses', days: 90 },
    { id: '6months', label: 'Últimos 6 meses', days: 180 },
    { id: 'lastYear', label: 'Ano passado', days: 365 },
    { id: 'thisWeek', label: 'Esta semana', days: 7 },
    { id: 'thisMonth', label: 'Este mês', days: 30 },
    { id: 'custom', label: 'Personalizado', days: 0 }
  ];

  const getRangeLabel = () => {
    const preset = PRESETS.find(p => p.id === reportRange);
    return preset ? preset.label : 'Intervalo Personalizado';
  };

  const getFormattedRange = () => {
    let from: Date;
    let to: Date = new Date();

    if (reportRange === 'custom') {
      from = customDateRange.from;
      to = customDateRange.to;
    } else {
      switch (reportRange) {
        case '7days': from = subDays(to, 7); break;
        case '30days': from = subDays(to, 30); break;
        case '3months': from = subMonths(to, 3); break;
        case '6months': from = subMonths(to, 6); break;
        case 'lastYear': from = subYears(to, 1); break;
        case 'thisWeek': from = startOfWeek(to, { weekStartsOn: 1 }); break;
        case 'thisMonth': from = startOfMonth(to); break;
        default: from = subDays(to, 7);
      }
    }

    const fmtFrom = format(from, 'MMM dd', { locale: ptBR });
    const fmtTo = format(to, 'MMM dd, yyyy', { locale: ptBR });
    return `${fmtFrom.charAt(0).toUpperCase() + fmtFrom.slice(1)} - ${fmtTo.charAt(0).toUpperCase() + fmtTo.slice(1)}`;
  };

  if (mainView !== 'reports') return null;

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf5] h-full overflow-y-auto custom-scrollbar p-16">
      {/* Header & Range Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-10 border-b border-slate-100 gap-6 mb-12">
        <div>
          <h2 className="font-serif text-4xl font-bold text-[#0a192f] tracking-tight">
            {reportTab === 'visao-geral' ? 'Auditoria e Transparência' : 
             reportTab === 'conversas' ? 'Estatísticas de Conversas' :
             reportTab === 'auditoria' ? 'Log de Auditoria Legislativa' :
             'Relatórios Detalhados'}
          </h2>
          <p className="text-sm text-slate-400 font-medium italic mt-2">
            Relatórios oficiais atualizados em tempo real pelo servidor legislativo.
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-3 px-6 py-4 bg-[#0a192f] text-white rounded-2xl shadow-xl hover:bg-[#142642] transition-all min-w-[320px] justify-between border border-white/10 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl group-hover:bg-[#c5a059]/20 transition-colors">
                <CalendarIcon className="w-4 h-4 text-[#c5a059]" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">{getRangeLabel()}</p>
                <p className="text-xs font-bold opacity-90">{getFormattedRange()}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDatePicker ? 'rotate-180' : ''}`} />
          </button>

          {showDatePicker && (
            <div className="absolute top-full right-0 mt-4 bg-[#0a192f] rounded-[32px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/10 z-50 p-1 flex animate-in fade-in zoom-in-95 duration-200">
              {/* Sidebar Presets */}
              <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-1">
                <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest px-4 mb-3 opacity-50">Intervalo de Data</p>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.id === 'custom') {
                        setTempRange('custom');
                        return;
                      }

                      const now = new Date();
                      let from: Date;
                      let to: Date = endOfDay(now);
                      
                      switch (p.id) {
                        case '7days': from = startOfDay(subDays(now, 7)); break;
                        case '30days': from = startOfDay(subDays(now, 30)); break;
                        case '3months': from = startOfDay(subMonths(now, 3)); break;
                        case '6months': from = startOfDay(subMonths(now, 6)); break;
                        case 'lastYear': from = startOfDay(subYears(now, 1)); break;
                        case 'thisWeek': 
                          from = startOfWeek(now, { weekStartsOn: 1 }); 
                          to = endOfWeek(now, { weekStartsOn: 1 });
                          break;
                        case 'thisMonth': 
                          from = startOfMonth(now); 
                          to = endOfMonth(now); 
                          break;
                        default: return;
                      }
                      
                      setTempRange(p.id);
                      setTempCustomRange({ from, to });
                      setReportRange(p.id);
                      setCustomDateRange({ from, to });
                      setShowDatePicker(false);
                    }}
                    className={`text-left px-5 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                      tempRange === p.id 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Main Picker Area */}
              <div className="p-10 min-w-[700px]">
                <div className="flex gap-12">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest mb-6">Data de início</p>
                    <div className="relative mb-8">
                      <input 
                        type="text" 
                        readOnly
                        value={format(tempCustomRange.from, 'dd/MM/yyyy')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm outline-none focus:border-[#c5a059]/50 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-white/40 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</p>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-white/40 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 text-center gap-1">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                          <span key={d} className="text-[10px] font-black text-white/20 pb-2">{d}</span>
                        ))}
                        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-10 h-10" />
                        ))}
                        {eachDayOfInterval({ 
                          start: startOfMonth(currentMonth), 
                          end: endOfMonth(currentMonth) 
                        }).map((day) => (
                          <button 
                            key={day.toString()} 
                            onClick={() => {
                              setTempRange('custom');
                              setTempCustomRange(prev => ({ ...prev, from: startOfDay(day) }));
                            }}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                              isSameDay(tempCustomRange.from, day)
                                ? 'bg-[#c5a059] text-[#0a192f] shadow-[0_0_15px_rgba(197,160,89,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[10px] font-black text-[#c5a059] uppercase tracking-widest mb-6">Data de término</p>
                    <div className="relative mb-8">
                      <input 
                        type="text" 
                        readOnly
                        value={format(tempCustomRange.to, 'dd/MM/yyyy')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm outline-none focus:border-[#c5a059]/50 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-white/40 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</p>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-white/40 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 text-center gap-1">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                          <span key={d} className="text-[10px] font-black text-white/20 pb-2">{d}</span>
                        ))}
                        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-10 h-10" />
                        ))}
                        {eachDayOfInterval({ 
                          start: startOfMonth(currentMonth), 
                          end: endOfMonth(currentMonth) 
                        }).map((day) => (
                          <button 
                            key={day.toString()} 
                            onClick={() => {
                              setTempRange('custom');
                              setTempCustomRange(prev => ({ ...prev, to: endOfDay(day) }));
                            }}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                              isSameDay(tempCustomRange.to, day)
                                ? 'bg-[#c5a059] text-[#0a192f] shadow-[0_0_15px_rgba(197,160,89,0.4)]'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex items-center justify-end gap-4 border-t border-white/5 pt-8">
                  <button 
                    onClick={() => setShowDatePicker(false)}
                    className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      setReportRange(tempRange);
                      setCustomDateRange(tempCustomRange);
                      setShowDatePicker(false);
                    }}
                    className="px-10 py-4 bg-[#c5a059] text-[#0a192f] rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all"
                  >
                    Aplicar Intervalo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={reportTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {reportTab === 'visao-geral' ? (
              <OverviewStats 
                reportSummary={reportSummary}
                reportDaily={reportDaily}
                reportChannels={reportChannels}
                reportDistribution={reportDistribution}
                labels={labels}
                setReportTab={setReportTab}
                loadingReports={loadingReports}
                auditLogs={auditLogs}
              />
            ) : reportTab === 'assuntos-recorrentes' ? (
              <LabelsStats 
                reportDistribution={reportDistribution}
                labels={labels}
                loadingLabels={loadingLabels}
                fetchLabels={fetchLabels}
                loadingReports={loadingReports}
                onToggleVisibility={toggleLabelVisibility}
                LEGISLATIVE_LABELS={LEGISLATIVE_LABELS}
              />
            ) : reportTab === 'conversas' ? (
              <ConversationsStats reportConversations={reportConversations} />
            ) : reportTab === 'auditoria' ? (
              <AuditSection 
                auditLogs={auditLogs}
                auditoriaSubTab={auditoriaSubTab}
                setAuditoriaSubTab={setAuditoriaSubTab}
                loadingLabels={loadingLabels}
                fetchLabels={fetchLabels}
                renderLabelsStats={() => (
                  <LabelsStats 
                    reportDistribution={reportDistribution}
                    labels={labels}
                    loadingLabels={loadingLabels}
                    fetchLabels={fetchLabels}
                    loadingReports={loadingReports}
                    onToggleVisibility={toggleLabelVisibility}
                    LEGISLATIVE_LABELS={LEGISLATIVE_LABELS}
                  />
                )}
              />
            ) : reportTab === 'time' ? (
              <TeamsStats reportTeams={reportTeams} />
            ) : reportTab === 'sla' ? (
              <SLAStats reportSummary={reportSummary} />
            ) : reportTab === 'inbox' ? (
              <InboxStats reportChannels={reportChannels} />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                <div className="w-20 h-20 bg-[#0a192f]/5 rounded-full flex items-center justify-center">
                  <Activity className="w-10 h-10 text-[#c5a059]" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Módulo {reportTab.replace('-', ' ')}</h3>
                  <p className="text-sm text-slate-500 italic max-w-sm mt-1 leading-relaxed">
                    Os dados detalhados para esta categoria estão sendo copilados e atualizados em tempo real pelo servidor legislativo.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
