import { getSupabaseClient } from './supabase';

export async function updateConversationStatusInDb(conversationId: string | number, status: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('atendimentos_camara')
      .update({ status })
      .eq('conversation_id', Number(conversationId))
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error: any) {
    console.error(`Erro ao atualizar status da conversa ${conversationId} no banco:`, error.message);
    return null;
  }
}
