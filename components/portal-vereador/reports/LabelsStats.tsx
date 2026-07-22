'use client';

import React from 'react';
import { Tag, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface LabelsStatsProps {
  reportDistribution: any;
  labels: any[];
  loadingLabels: boolean;
  fetchLabels: (force?: boolean) => Promise<void>;
  loadingReports: boolean;
  LEGISLATIVE_LABELS: any[];
  onToggleVisibility?: (id: number, current: boolean) => Promise<void>;
}

export function LabelsStats({
  reportDistribution,
  labels,
  loadingLabels,
  fetchLabels,
  loadingReports,
  LEGISLATIVE_LABELS,
  onToggleVisibility
}: LabelsStatsProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-serif text-xl font-bold text-[#0a192f]">Assuntos Recorrentes</h3>
        </div>
        <Tag className="w-5 h-5 text-[#c5a059]" />
      </div>
      
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a059]">Mapeamento de Demandas por Assunto</p>
            <p className="text-xs text-slate-400 italic mt-0.5">Visão unificada do volume de protocolos por área de atuação</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-2">
          {(() => {
            if (loadingReports && (!reportDistribution || !reportDistribution.payload)) {
              return (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin" />
                  <p className="text-sm text-slate-400 italic font-serif">Carregando métricas...</p>
                </div>
              );
            }

            // 1. Base Legislativa
            const standardLabels = LEGISLATIVE_LABELS;
            
            // 2. Todas as etiquetas do banco
            const dbLabels = labels || [];
            
            // 3. Construção da lista (Todos os itens oficiais)
            const allLabels = standardLabels
              .map(official => {
                const dbMatch = dbLabels.find(db => {
                  const dbNameNorm = db.name.toLowerCase().trim();
                  const offNameNorm = official.name.toLowerCase().trim();
                  return dbNameNorm === offNameNorm;
                });

                const payloadData = reportDistribution?.payload?.find((p: any) => {
                  const pName = p.name.toLowerCase().trim();
                  return pName === official.name.toLowerCase().trim();
                });

                return {
                  id: dbMatch?.id,
                  name: official.name,
                  title: official.title,
                  count: payloadData?.conversations_count || 0,
                  officialColor: official.color,
                  color: '#10b981', // Green for the bar
                  showOnSidebar: dbMatch ? dbMatch.show_on_sidebar !== false : true
                };
              })
              .filter(Boolean)
              .sort((a: any, b: any) => b.count - a.count);
              
            const max = Math.max(...allLabels.map((l: any) => l.count), 1);
            
            if (allLabels.length === 0) {
              return (
                <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-serif italic mb-4">Nenhuma etiqueta oficial encontrada.</p>
                  <button 
                    onClick={() => fetchLabels(true)}
                    className="px-6 py-2 bg-[#c5a059] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#0a192f] transition-colors"
                  >
                    Sincronizar Agora
                  </button>
                </div>
              );
            }

            return allLabels.map((label: any) => {
              const percentage = (label.count / max) * 100;
              return (
                <div key={label.name} className="flex items-center gap-6 group hover:bg-slate-50 p-3 rounded-2xl transition-all duration-300">
                  <button 
                    onClick={() => {
                      if (label.id) onToggleVisibility?.(label.id, label.showOnSidebar);
                    }}
                    className={`p-2.5 rounded-xl transition-all ${label.showOnSidebar ? 'text-[#c5a059] bg-[#c5a059]/10 shadow-sm' : 'text-slate-300 bg-slate-100 hover:bg-slate-200'}`}
                    title={label.showOnSidebar ? "Visível na Visão Geral" : "Oculto na Visão Geral"}
                    disabled={!label.id}
                  >
                    {label.showOnSidebar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <div className="flex items-center gap-4 w-64">
                    <div 
                      className="w-1.5 h-8 rounded-full transition-transform group-hover:scale-110" 
                      style={{ 
                        backgroundColor: label.showOnSidebar ? label.officialColor : '#cbd5e1',
                        boxShadow: label.showOnSidebar ? `0 0 10px ${label.officialColor}33` : 'none'
                      }}
                    />
                    <span className={`text-[11px] font-bold uppercase tracking-wider truncate transition-colors ${label.showOnSidebar ? 'text-[#0a192f]' : 'text-slate-400'}`} title={label.title}>
                      {label.title}
                    </span>
                  </div>
                  
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: label.showOnSidebar ? '#10b981' : '#cbd5e1',
                        opacity: label.showOnSidebar ? 1 : 0.3,
                        boxShadow: label.showOnSidebar ? `0 0 15px #10b98144` : 'none'
                      }} 
                    />
                  </div>
                  
                  <div className="w-16 text-right">
                    <span className={`text-base font-serif font-black tabular-nums transition-colors ${label.showOnSidebar ? 'text-[#0a192f]' : 'text-slate-400'}`}>
                      {label.count}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
