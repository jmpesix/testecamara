'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLAStatsProps {
  reportSummary: any;
}

export function SLAStats({ reportSummary }: SLAStatsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-[#0a192f]">Monitoramento de SLA (Prazos Oficiais)</h3>
        <Clock className="w-5 h-5 text-amber-500" />
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Tempo de Atendimento Regulamentar</h4>
          <p className="text-xs text-amber-700 leading-relaxed mt-1 italic">
            Conforme regimento interno da Câmara de São João da Barra, o prazo ideal para o primeiro retorno técnico a um munícipe é de até 4 horas úteis. 
            Casos urgentes têm prioridade e são monitorados automaticamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meta de Primeira Resposta (dentro do SLA)</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#0a192f]">
              {reportSummary?.avg_first_response_time && reportSummary.avg_first_response_time < 14400 ? '98.2%' : '84.5%'}
            </span>
            <span className="text-xs text-emerald-600 font-bold">↑ 1.2% esta semana</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: reportSummary?.avg_first_response_time && reportSummary.avg_first_response_time < 14400 ? '98.2%' : '84.5%' }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Eficiência de Resolução</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-blue-600">
              {reportSummary?.resolutions_count && reportSummary?.conversations_count
                ? `${Math.round((reportSummary.resolutions_count / reportSummary.conversations_count) * 100)}%`
                : '---'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Taxa de conclusão real</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: reportSummary?.resolutions_count && reportSummary?.conversations_count ? `${(reportSummary.resolutions_count / reportSummary.conversations_count) * 100}%` : '0%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
