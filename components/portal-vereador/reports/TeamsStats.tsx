'use client';

import React from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { VEREADORES } from '../constants';
import { TeamDemandsModal } from '../TeamDemandsModal';

interface TeamsStatsProps {
  reportTeams: any[];
}

export function TeamsStats({ reportTeams }: TeamsStatsProps) {
  const [selectedTeam, setSelectedTeam] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Lista base de todas as equipes esperadas
  const baseTeams = [
    { id: 1, name: 'Portal Geral', type: 'apoio' },
    { id: 2, name: 'Dúvidas e Informações', type: 'apoio' },
    { id: 3, name: 'Ouvidoria de Reclamações', type: 'apoio' },
    ...VEREADORES.map(v => ({ ...v, type: 'vereador' }))
  ];

  // Mescla com os dados do relatório
  const mergedTeams = baseTeams.map(base => {
    const report = Array.isArray(reportTeams) 
      ? reportTeams.find(r => Number(r.id) === base.id)
      : null;
    
    return {
      ...base,
      conversations_count: report?.conversations_count || 0,
      resolutions_count: report?.resolutions_count || 0,
      avg_first_response_time: report?.avg_first_response_time || 0,
      avg_resolution_time: report?.avg_resolution_time || 0
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-[#0a192f]">Desempenho por Gabinete / Equipe</h3>
        <TrendingUp className="w-5 h-5 text-[#c5a059]" />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {mergedTeams.map((team: any, i: number) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-[#c5a059]/30 transition-all group gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0a192f] flex items-center justify-center font-serif font-bold text-[#c5a059] border border-[#c5a059]/20 shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                {team.name ? team.name[0].toUpperCase() : 'G'}
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-[#0a192f]">
                  {team.type === 'vereador' ? `Gabinete: ${team.name}` : team.name}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">
                  {team.type === 'apoio' ? 'Apoio Legislativo' : 'Vereador(a)'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 md:gap-10">
              <div className="text-center min-w-[80px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Demandas</p>
                <p className="text-lg font-serif font-bold text-[#0a192f]">{team.conversations_count}</p>
              </div>
              <div className="text-center min-w-[80px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Aguardando Resolução</p>
                <p className="text-lg font-serif font-bold text-amber-600">{Math.max(0, team.conversations_count - team.resolutions_count)}</p>
              </div>
              <div className="text-center min-w-[80px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Resolvidos (%)</p>
                <p className="text-lg font-serif font-bold text-emerald-600">
                  {team.conversations_count > 0 
                    ? `${Math.round((team.resolutions_count / team.conversations_count) * 100)}%` 
                    : '0%'}
                </p>
              </div>
              <div className="text-center min-w-[100px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Média Resposta</p>
                <div className="flex items-center justify-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${team.avg_first_response_time > 0 && team.avg_first_response_time < 3600 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <p className="text-lg font-serif font-bold text-amber-600">
                    {team.avg_first_response_time > 0 ? `${Math.round(team.avg_first_response_time / 60)}m` : '---'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedTeam(team); setIsModalOpen(true); }}
                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#c5a059] transition-all flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <TeamDemandsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} team={selectedTeam} />
    </div>
  );
}
