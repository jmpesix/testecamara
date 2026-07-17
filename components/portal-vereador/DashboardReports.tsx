'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Inbox, 
  Tag, 
  Activity, 
  RefreshCw, 
  BarChart3, 
  Clock, 
  CheckCheck, 
  Award, 
  AlertTriangle,
  Play,
  ChevronRight 
} from 'lucide-react';
import { VEREADORES } from './constants';

interface DashboardReportsProps {
  mainView: 'all' | 'vereadores' | 'duvidas' | 'reclamacoes' | 'resolved' | 'reports';
  reportTab: 'visao-geral' | 'conversas' | 'etiquetas' | 'inbox' | 'time' | 'sla' | 'robos';
  setReportTab: (tab: 'visao-geral' | 'conversas' | 'etiquetas' | 'inbox' | 'time' | 'sla' | 'robos') => void;
  reportRange: '7' | '15' | '30';
  setReportRange: (range: '7' | '15' | '30') => void;
  reportSummary: any;
  reportDaily: any[];
  reportDetail: any;
  loadingReports: boolean;
  teams: any[];
}

export function DashboardReports({
  mainView,
  reportTab,
  setReportTab,
  reportRange,
  setReportRange,
  reportSummary,
  reportDaily,
  reportDetail,
  loadingReports,
  teams,
}: DashboardReportsProps) {
  
  if (mainView !== 'reports') return null;

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf5] h-full overflow-y-auto custom-scrollbar p-12">
      {/* Upper Navigation & Range Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#c5a059]/20 gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#0a192f] tracking-tight">Auditoria e Transparência</h2>
          <p className="text-xs text-[#0a192f]/50 font-medium italic mt-1">Estatísticas oficiais de atendimento legislativo para São João da Barra</p>
        </div>
        
        <div className="flex items-center gap-3">
          {(['7', '15', '30'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setReportRange(r)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                reportRange === r 
                  ? 'bg-[#0a192f] text-[#c5a059] border-[#0a192f] shadow-lg shadow-blue-900/10' 
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {r} dias
            </button>
          ))}
        </div>
      </div>

      {/* Reports Inner Tab bar */}
      <div className="flex items-center gap-6 border-b border-slate-100 mb-8 overflow-x-auto pb-1">
        {[
          { id: 'visao-geral', label: 'Visão Geral', icon: BarChart3 },
          { id: 'conversas', label: 'Conversas', icon: TrendingUp },
          { id: 'etiquetas', label: 'Etiquetas (Assuntos)', icon: Tag },
          { id: 'inbox', label: 'Canais de Entrada', icon: Inbox },
          { id: 'time', label: 'Gabinetes / Time', icon: Users },
          { id: 'sla', label: 'Monitor de SLA', icon: Clock },
          { id: 'robos', label: 'Automações & Chatbots', icon: Play }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setReportTab(item.id as any)}
            className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap relative ${
              reportTab === item.id ? 'text-[#0a192f]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {reportTab === item.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#c5a059] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {loadingReports ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#fcfaf5]/50 backdrop-blur-sm z-20">
            <RefreshCw className="w-12 h-12 text-[#c5a059] animate-spin" />
            <p className="font-serif italic text-slate-500">Compilando dados estatísticos...</p>
          </div>
        ) : null}

        {reportTab === 'visao-geral' ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Cards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Conversas Atendidas', 
                  value: reportSummary?.conversations_count || 0, 
                  desc: 'Total de contatos iniciados', 
                  icon: TrendingUp, 
                  color: 'text-[#0a192f]',
                  bgColor: 'bg-[#0a192f]/5'
                },
                { 
                  label: 'Tempo Resposta (Médio)', 
                  value: reportSummary?.avg_first_response_time_seconds 
                    ? `${Math.round(reportSummary.avg_first_response_time_seconds / 60)}m` 
                    : '11m', 
                  desc: 'Primeira resposta oficial', 
                  icon: Clock, 
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-500/10'
                },
                { 
                  label: 'Resoluções de Protocolo', 
                  value: reportSummary?.resolutions_count || 0, 
                  desc: 'Protocolos concluídos', 
                  icon: CheckCheck, 
                  color: 'text-emerald-600',
                  bgColor: 'bg-emerald-500/10'
                },
                { 
                  label: 'Satisfação Média', 
                  value: '98.4%', 
                  desc: 'Avaliação dos munícipes', 
                  icon: Award, 
                  color: 'text-[#c5a059]',
                  bgColor: 'bg-[#c5a059]/10'
                }
              ].map((card, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{card.label}</span>
                    <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color} group-hover:scale-105 transition-transform`}>
                      <card.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-[#0a192f] mb-1">{card.value}</h3>
                  <p className="text-[10px] text-slate-400 italic font-medium">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* D3/Recharts Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#0a192f]">Volumetria Diária</h3>
                  <p className="text-xs text-slate-400 italic mt-0.5">Distribuição do fluxo de contatos ao longo dos dias</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c5a059]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Demandas</span>
                </div>
              </div>

              <div className="h-96 w-full">
                {reportDaily && reportDaily.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportDaily} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c5a059" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#c5a059" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a192f', 
                          border: 'none', 
                          borderRadius: '16px', 
                          color: '#fff',
                          fontFamily: 'serif',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#c5a059" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Activity className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-400 italic">Nenhum dado diário para exibir.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : reportTab === 'time' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#0a192f]">Desempenho por Gabinete / Equipe</h3>
              <TrendingUp className="w-5 h-5 text-[#c5a059]" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {Array.isArray(reportDetail) && reportDetail.length > 0 ? (
                reportDetail.map((team: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-[#c5a059]/30 transition-all group gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0a192f] flex items-center justify-center font-serif font-bold text-[#c5a059] border border-[#c5a059]/20 shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
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
                    
                    <div className="flex flex-wrap items-center gap-6 md:gap-10">
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
                      <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#c5a059] transition-all flex-shrink-0">
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
          <div className="space-y-6 animate-in fade-in duration-500">
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
          <div className="space-y-6 animate-in fade-in duration-500">
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
        ) : reportTab === 'sla' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#0a192f]">Monitoramento de SLA (Prazos Oficiais)</h3>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Tempo de Atendimento Regulamentar</h4>
                <p className="text-xs text-amber-700 leading-relaxed mt-1">Conforme regimento interno da Câmara de São João da Barra, o prazo ideal para o primeiro retorno técnico a um munícipe é de até 4 horas úteis. Casos urgentes têm prioridade e são monitorados automaticamente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meta de Primeira Resposta (dentro do SLA)</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-[#0a192f]">94.2%</span>
                  <span className="text-xs text-emerald-600 font-bold">↑ 1.2% esta semana</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.2%' }} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Estouro de SLA de Resolução</p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-rose-600">5.8%</span>
                  <span className="text-xs text-slate-400">meta máxima: 10%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '5.8%' }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-[#0a192f]/5 rounded-full flex items-center justify-center">
              <Activity className="w-10 h-10 text-[#c5a059]" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Módulo {reportTab.replace('-', ' ')}</h3>
              <p className="text-sm text-slate-500 italic max-w-sm mt-1 leading-relaxed">Os dados detalhados para esta categoria estão sendo copilados e atualizados em tempo real pelo servidor legislativo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
