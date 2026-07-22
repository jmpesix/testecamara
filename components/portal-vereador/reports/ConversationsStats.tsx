'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationsStatsProps {
  reportConversations: any[];
}

export function ConversationsStats({ reportConversations }: ConversationsStatsProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#0a192f]">Métricas de Conversas</h3>
          <p className="text-sm text-slate-400 italic mt-1">Visão detalhada de volumes e resoluções</p>
        </div>
        <BarChart3 className="w-6 h-6 text-[#c5a059]" />
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Abertas</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Resolvidas</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Pendentes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportConversations && reportConversations.length > 0 ? (
                reportConversations.map((conv: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-serif font-bold text-slate-700">
                      {conv.timestamp ? format(new Date(conv.timestamp * 1000), 'dd MMM yyyy', { locale: ptBR }) : '---'}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-[#0a192f]">{conv.open_count || 0}</td>
                    <td className="px-8 py-6 text-right font-bold text-emerald-600">{conv.resolved_count || 0}</td>
                    <td className="px-8 py-6 text-right font-bold text-amber-500">{conv.pending_count || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic font-serif">
                    Nenhum dado de conversas disponível no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
