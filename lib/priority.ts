import { Message } from '@/types';

export type PriorityLevel = 'alta' | 'media' | 'baixa';

export function getPriority(msg: Message): PriorityLevel {
  if (!msg) return 'baixa';
  
  // 1. Explicit priority or urgency property
  const p = (msg.priority || msg.urgency || msg.custom_attributes?.priority || '').toString().toLowerCase();
  if (p === 'high' || p === 'alta' || p === 'urgente') return 'alta';
  if (p === 'medium' || p === 'media' || p === 'médio' || p === 'média') return 'media';
  if (p === 'low' || p === 'baixa') return 'baixa';

  // 2. Check labels
  if (msg.labels && msg.labels.length > 0) {
    const hasAlta = msg.labels.some(l => {
      const lower = l.toLowerCase();
      return lower.includes('urgente') || lower.includes('alta') || lower.includes('crítico') || lower.includes('prioridade-alta');
    });
    if (hasAlta) return 'alta';

    const hasBaixa = msg.labels.some(l => {
      const lower = l.toLowerCase();
      return lower.includes('baixa') || lower.includes('rotina') || lower.includes('prioridade-baixa');
    });
    if (hasBaixa) return 'baixa';

    const hasMedia = msg.labels.some(l => {
      const lower = l.toLowerCase();
      return lower.includes('média') || lower.includes('media') || lower.includes('prioridade-média');
    });
    if (hasMedia) return 'media';
  }

  // 3. Keyword / Content check
  const text = (msg.message || msg.content || '').toLowerCase();
  if (
    text.includes('urgente') ||
    text.includes('emergência') ||
    text.includes('risco de morte') ||
    text.includes('hospital') ||
    text.includes('vazamento') ||
    text.includes('denúncia') ||
    text.includes('socorro') ||
    text.includes('ambulância') ||
    text.includes('saúde')
  ) {
    return 'alta';
  }

  if (
    text.includes('reclamação') ||
    text.includes('solicitação') ||
    text.includes('iluminação') ||
    text.includes('buraco') ||
    text.includes('asfalto') ||
    text.includes('obras') ||
    text.includes('poda') ||
    text.includes('limpeza') ||
    text.includes('segurança')
  ) {
    return 'media';
  }

  return 'baixa';
}

export const PRIORITY_CONFIG: Record<PriorityLevel, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  icon: string;
}> = {
  alta: {
    label: 'Alta',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-600',
    badgeBorder: 'border-rose-500/20',
    dotBg: 'bg-rose-500',
    icon: '🔴',
  },
  media: {
    label: 'Média',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600',
    badgeBorder: 'border-amber-500/20',
    dotBg: 'bg-amber-500',
    icon: '🟡',
  },
  baixa: {
    label: 'Baixa',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600',
    badgeBorder: 'border-emerald-500/20',
    dotBg: 'bg-emerald-500',
    icon: '🟢',
  },
};
