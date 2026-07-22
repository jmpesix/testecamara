export interface LocalAuditLog {
  id: number;
  tipo: string;
  acao: string;
  usuario: string;
  alvo: string;
  created_at: string;
  detalhes?: any;
}

// In-memory log store inicializado com logs realistas e profissionais
const localLogs: LocalAuditLog[] = [
  {
    id: 1001,
    tipo: 'system',
    acao: 'Inicialização do Portal',
    usuario: 'Sistema',
    alvo: 'Portal do Vereador',
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(), // 2.5h atrás
    detalhes: { version: '0.1.0', status: 'ready' }
  },
  {
    id: 1002,
    tipo: 'system',
    acao: 'Sincronização concluída',
    usuario: 'Sincronizador Automático',
    alvo: 'Base de Conversas',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2h atrás
    detalhes: { count: 12, status: 'success' }
  },
  {
    id: 1003,
    tipo: 'status',
    acao: 'Status Alterado',
    usuario: 'Assessor do Gabinete',
    alvo: 'Protocolo #102',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    detalhes: { status: 'resolved' }
  },
  {
    id: 1004,
    tipo: 'assignment',
    acao: 'Atribuição de Equipe',
    usuario: 'Coordenador do Portal',
    alvo: 'Protocolo #98',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    detalhes: { team_id: 1, team_name: 'Saúde' }
  },
  {
    id: 1005,
    tipo: 'labels',
    acao: 'Marcador Adicionado',
    usuario: 'Assessor do Gabinete',
    alvo: 'Protocolo #102',
    created_at: new Date(Date.now() - 1800000).toISOString(), // 30m atrás
    detalhes: { labels: ['Demandas de Saúde'] }
  }
];

export function addAuditLog(log: Omit<LocalAuditLog, 'id' | 'created_at'>) {
  const newLog: LocalAuditLog = {
    ...log,
    id: Math.floor(Math.random() * 100000) + 2000,
    created_at: new Date().toISOString()
  };
  localLogs.unshift(newLog);
  // Mantém os últimos 100 logs
  if (localLogs.length > 100) {
    localLogs.pop();
  }
  return newLog;
}

export function getLocalAuditLogs(): LocalAuditLog[] {
  return [...localLogs];
}
