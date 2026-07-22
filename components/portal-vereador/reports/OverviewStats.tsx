'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LabelList
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
  ChevronRight
} from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

interface OverviewStatsProps {
  reportSummary: any;
  reportDaily: any[];
  reportChannels: any[];
  reportDistribution: any;
  labels: any[];
  setReportTab: (tab: any) => void;
  loadingReports: boolean;
  auditLogs: any[];
}

export function OverviewStats({
  reportSummary,
  reportDaily,
  reportChannels,
  reportDistribution,
  labels,
  setReportTab,
  loadingReports,
  auditLogs
}: OverviewStatsProps) {
  if (loadingReports && (!reportSummary || reportSummary.conversations_count === 0)) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-[#c5a059] animate-spin" />
        <p className="text-slate-400 italic font-serif">Compilando estatísticas legislativas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { 
            label: 'Total de Protocolos', 
            value: reportSummary?.conversations_count || 0, 
            trend: '+12.5%', 
            isPositive: true,
            icon: Inbox,
            bgColor: 'bg-blue-50/50'
          },
          { 
            label: 'Cidadãos Atendidos', 
            value: reportSummary?.contacts_count || 0, 
            trend: '+8.2%', 
            isPositive: true,
            icon: Users,
            bgColor: 'bg-[#c5a059]/10'
          },
          { 
            label: 'Tempo Médio Resposta', 
            value: reportSummary?.avg_first_response_time 
              ? `${Math.round(reportSummary.avg_first_response_time / 3600)}h ${Math.round((reportSummary.avg_first_response_time % 3600) / 60)}min` 
              : '---', 
            trend: '-15min', 
            isPositive: true,
            icon: Clock,
            bgColor: 'bg-emerald-50/50'
          },
          { 
            label: 'Casos Resolvidos', 
            value: reportSummary?.resolutions_count || 0, 
            trend: '94.2%', 
            isPositive: true,
            icon: CheckCheck,
            bgColor: 'bg-purple-50/50'
          }
        ].map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 ${card.bgColor} rounded-3xl group-hover:scale-110 transition-transform duration-500`}>
                <card.icon className="w-6 h-6 text-[#0a192f]" />
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                card.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {card.trend}
              </span>
            </div>
            <h3 className="text-4xl font-serif font-bold text-[#0a192f] mb-1">{card.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Main Analytical Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Fluxo de Demandas</h3>
              <p className="text-sm text-slate-400 italic mt-1">Volume diário de interações cidadãs</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#c5a059]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportDaily} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a192f', 
                    border: 'none', 
                    borderRadius: '24px',
                    padding: '16px',
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)',
                    fontFamily: 'serif'
                  }}
                  itemStyle={{ color: '#c5a059', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#c5a059" 
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fill: '#0a192f', fontSize: 12, fontWeight: 900, fontFamily: 'serif' }}
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="bg-[#0a192f] p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Metas do Gabinete</h3>
            <p className="text-sm text-[#c5a059] font-medium italic mb-10">Performance vs SLA Legislativo</p>

            <div className="space-y-10">
              {[
                { 
                  label: 'Taxa de Conversão', 
                  count: '98.4%', 
                  color: 'bg-[#c5a059]', 
                  percent: '98.4%' 
                },
                { 
                  label: 'Satisfação Cidadã', 
                  count: '4.9/5.0', 
                  color: 'bg-emerald-400', 
                  percent: '98%' 
                },
                { 
                  label: 'Tempo de Resposta', 
                  count: reportSummary?.avg_first_response_time ? `${Math.round(reportSummary.avg_first_response_time / 3600)}h` : '---', 
                  color: 'bg-blue-400', 
                  percent: reportSummary?.avg_first_response_time && reportSummary.avg_first_response_time < 3600 ? '95%' : '70%' 
                }
              ].map((st, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{st.label}</span>
                    <span className="text-xs font-bold text-white">{st.count}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className={`${st.color} h-full rounded-full`} style={{ width: st.percent }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <button className="w-full py-4 bg-[#c5a059] text-[#0a192f] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#b59049] transition-colors">
                Exportar Relatório PDF
              </button>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#c5a059]/10 rounded-full blur-[100px]" />
        </div>
      </div>

      {/* Performance by Channel and Labels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Desempenho por Canal de Entrada */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Desempenho por Canal de Entrada</h3>
              <p className="text-sm text-slate-400 italic mt-1">Eficiência técnica por plataforma</p>
            </div>
            <Inbox className="w-6 h-6 text-[#c5a059] opacity-20" />
          </div>
          
          <div className="space-y-6">
            {reportChannels && reportChannels.length > 0 ? (
              reportChannels.map((inbox: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:border-[#c5a059]/20 hover:shadow-lg transition-all duration-300 group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 group-hover:bg-[#c5a059]/10 group-hover:border-[#c5a059]/30 transition-colors">
                      <Inbox className="w-5 h-5 text-[#c5a059]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0a192f] text-sm group-hover:text-[#c5a059] transition-colors">{inbox.name}</h4>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{inbox.channel_type || 'WhatsApp'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-serif font-black text-[#0a192f] group-hover:scale-110 transition-transform origin-right">{inbox.conversations_count || 0}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Conversas</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-[32px]">
                <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs text-slate-300 italic font-serif">Nenhum dado de canal encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Assuntos mais Recorrentes (Etiquetas) */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Assuntos mais Recorrentes</h3>
              <p className="text-sm text-slate-400 italic mt-1">Temas dominantes nas demandas (filtro oficial)</p>
            </div>
            <Tag className="w-6 h-6 text-[#c5a059] opacity-20" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              if (!reportDistribution || !Array.isArray(reportDistribution.payload) || reportDistribution.payload.length === 0) {
                return (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-50 rounded-[32px]">
                    <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs text-slate-300 italic font-serif">Nenhum dado de etiqueta encontrado</p>
                  </div>
                );
              }

              // Filter labels that should be shown on sidebar (same logic as LabelsStats)
              const allowedLabelNames = labels
                ?.filter(l => l.show_on_sidebar !== false)
                .map(l => l.name?.toLowerCase());

              const processed = reportDistribution.payload
                .filter((item: any) => allowedLabelNames?.includes(item.name?.toLowerCase()))
                .slice(0, 6)
                .map((item: any) => {
                  const dbLabel = labels?.find((l: any) => 
                    l.name?.toLowerCase() === item.name?.toLowerCase()
                  );
                  return {
                    name: dbLabel?.title || item.name,
                    count: item.conversations_count,
                    color: dbLabel?.color || '#c5a059'
                  };
                });

              if (processed.length === 0) {
                return (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-50 rounded-[32px]">
                    <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs text-slate-300 italic font-serif">Nenhuma etiqueta filtrada encontrada</p>
                  </div>
                );
              }

              return processed.map((label: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-[#c5a059]/30 hover:bg-white hover:shadow-md transition-all duration-300 cursor-default group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: label.color }} />
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 truncate" title={label.name}>
                      {label.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-serif font-bold text-[#0a192f] group-hover:text-[#c5a059] transition-colors">{label.count}</span>
                    <span className="text-[9px] text-slate-400 font-bold">casos</span>
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
            <button 
              onClick={() => setReportTab('assuntos-recorrentes')}
              className="text-[9px] font-black uppercase tracking-[0.15em] text-[#c5a059] hover:text-[#0a192f] transition-colors flex items-center gap-2"
            >
              Ver detalhamento completo <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Integrated Audit Preview */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Últimas Ações de Auditoria</h3>
            <p className="text-sm text-slate-400 italic mt-1">Resumo das atividades administrativas recentes</p>
          </div>
          <button 
            onClick={() => setReportTab('auditoria')}
            className="px-6 py-2.5 bg-slate-50 text-slate-500 hover:text-[#0a192f] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Ver Timeline Completa
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {auditLogs && auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-[#c5a059]/40 hover:bg-white hover:shadow-xl transition-all duration-500 group cursor-default">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${
                  log.tipo === 'assignment' ? 'bg-blue-50 text-blue-500' : 
                  log.tipo === 'status' ? 'bg-emerald-50 text-emerald-500' :
                  log.tipo === 'note' ? 'bg-[#c5a059]/10 text-[#c5a059]' : 'bg-slate-50 text-slate-400'
                }`}>
                  {log.tipo === 'assignment' ? <Users className="w-5 h-5" /> : 
                   log.tipo === 'status' ? <CheckCheck className="w-5 h-5" /> :
                   log.tipo === 'note' ? <Tag className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0a192f] block leading-none">
                    {log.usuario.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-medium text-slate-400 italic">
                    {log.created_at ? format(new Date(log.created_at), "HH:mm", { locale: ptBR }) : '--:--'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">{log.acao}</p>
                <h4 className="font-serif font-bold text-[#0a192f] text-sm leading-tight group-hover:text-[#c5a059] transition-colors">
                  {log.alvo}
                </h4>
              </div>
            </div>
          ))}
          {(!auditLogs || auditLogs.length === 0) && (
            <div className="col-span-full py-8 text-center text-slate-400 italic text-xs">
              Nenhuma atividade recente registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
