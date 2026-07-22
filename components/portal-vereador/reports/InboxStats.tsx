'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface InboxStatsProps {
  reportChannels: any[];
}

export function InboxStats({ reportChannels }: InboxStatsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-[#0a192f]">Desempenho por Canal de Entrada</h3>
        <Inbox className="w-5 h-5 text-[#c5a059]" />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(reportChannels) && reportChannels.length > 0 ? (
          reportChannels.map((inbox: any, i: number) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-[#c5a059]/30 transition-all">
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
          <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <Inbox className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <h4 className="font-serif text-lg font-bold text-slate-300">Nenhum dado de canal encontrado</h4>
          </div>
        )}
      </div>
    </div>
  );
}
