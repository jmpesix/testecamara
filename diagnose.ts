
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function diagnose() {
  console.log('--- Diagnóstico Geral do Supabase ---');
  
  // Check atendimentos_camara
  console.log('\n1. Verificando atendimentos_camara (Últimos 5):');
  const { data: atendimentos, error: errAtend } = await supabase
    .from('atendimentos_camara')
    .select('id, conversation_id, contact_name, created_at, updated_at, status')
    .order('updated_at', { ascending: false })
    .limit(5);
  if (errAtend) console.error('Erro:', errAtend.message);
  else {
    atendimentos?.forEach(a => {
      console.log(`[ID: ${a.conversation_id}] ${a.contact_name} - Created: ${a.created_at} - Updated: ${a.updated_at} - Status: ${a.status}`);
    });
  }

  // Check labels
  console.log('\n2. Verificando labels:');
  const { data: labels, error: errLabels } = await supabase
    .from('labels')
    .select('*')
    .limit(1);
  if (errLabels) console.error('Erro:', errLabels.message);
  else console.log('Colunas:', labels?.[0] ? Object.keys(labels[0]) : 'Tabela vazia');

  // Check audit_logs
  console.log('\n3. Verificando audit_logs (Últimos 5):');
  const { data: logs, error: errLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  if (errLogs) console.error('Erro:', errLogs.message);
  else {
    logs?.forEach(log => {
      console.log(`[${log.created_at}] ${log.usuario} -> ${log.acao} (${log.alvo})`);
    });
  }
}

diagnose();
