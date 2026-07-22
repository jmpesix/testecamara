'use client';

import React from 'react';
import { 
  Users, 
  CheckCheck, 
  Tag, 
  Activity, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditSectionProps {
  auditLogs: any[];
  auditoriaSubTab: 'timeline' | 'assuntos';
  setAuditoriaSubTab: (tab: 'timeline' | 'assuntos') => void;
  loadingLabels: boolean;
  fetchLabels: (force?: boolean) => Promise<void>;
  renderLabelsStats: () => React.ReactNode;
}

export function AuditSection({
  auditLogs,
  auditoriaSubTab,
  setAuditoriaSubTab,
  loadingLabels,
  fetchLabels,
  renderLabelsStats
}: AuditSectionProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-serif text-3xl font-bold text-[#0a192f]">Timeline de Auditoria Legislativa</h3>
          <p className="text-sm text-slate-400 italic mt-1">Registro cronológico de todas as ações de gestão de protocolos</p>
        </div>
        <div className="flex items-center gap-3">
          {['timeline', 'assuntos'].map(sub => (
            <button 
              key={sub}
              onClick={() => setAuditoriaSubTab(sub as 'timeline' | 'assuntos')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                auditoriaSubTab === sub ? 'bg-[#0a192f] text-[#c5a059]' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {sub === 'timeline' ? 'Timeline' : 'Assuntos Recorrentes'}
            </button>
          ))}
          {auditoriaSubTab === 'assuntos' && (
            <button
              onClick={() => fetchLabels(true)}
              disabled={loadingLabels}
              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-[#c5a059] rounded-2xl transition-all disabled:opacity-50"
              title="Sincronizar Etiquetas do Chatwoot"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLabels ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {auditoriaSubTab === 'timeline' ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <div key={log.id || index} className="p-8 hover:bg-slate-50/50 transition-colors flex items-start gap-8 group">
                  <div className="mt-1 relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      log.tipo === 'assignment' ? 'bg-blue-50 text-blue-500' : 
                      log.tipo === 'status' ? 'bg-emerald-50 text-emerald-500' :
                      log.tipo === 'note' ? 'bg-amber-50 text-amber-500' :
                      log.tipo === 'priority' ? 'bg-rose-50 text-rose-500' :
                      log.tipo === 'label' ? 'bg-purple-50 text-purple-500' :
                      log.tipo === 'message' ? 'bg-indigo-50 text-indigo-500' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {log.tipo === 'assignment' ? <Users className="w-5 h-5" /> : 
                       log.tipo === 'status' ? <CheckCheck className="w-5 h-5" /> :
                       log.tipo === 'note' ? <Tag className="w-5 h-5" /> : 
                       log.tipo === 'priority' ? <AlertTriangle className="w-5 h-5" /> :
                       log.tipo === 'label' ? <Tag className="w-5 h-5" /> :
                       log.tipo === 'message' ? <Activity className="w-5 h-5" /> :
                       <Activity className="w-5 h-5" />}
                    </div>
                    {index !== auditLogs.length - 1 && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-px h-12 bg-slate-100" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#c5a059] group-hover:tracking-[0.15em] transition-all">{log.acao}</span>
                      <span className="text-[10px] font-medium text-slate-400 italic flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_at), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#0a192f] mb-2">
                      {log.usuario} <span className="text-slate-300 font-normal mx-2">→</span> {log.alvo}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Ação registrada automaticamente pelo Portal Legislativo para fins de transparência pública.
                    </p>
                  </div>
                  
                  <button className="self-center p-3 rounded-2xl bg-slate-50 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-[#0a192f]">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p>Nenhuma atividade de auditoria registrada.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        renderLabelsStats()
      )}

      <div className="p-8 bg-amber-50/50 border border-amber-200/50 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm tracking-tight">Privacidade e Transparência</p>
            <p className="text-xs text-amber-700/70 italic">Este log é imutável e serve como registro oficial de transparência legislativa conforme a LAI.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-colors rounded-xl">
          Ver detalhes de segurança
        </button>
      </div>
    </div>
  );
}
