import { upsertAtendimento, getSupabaseClient } from './supabase';
/**
 * Chatwoot API Client (Server Side)
 */

const API_KEY = process.env.CHATWOOT_API_KEY;
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function chatwootFetch(url: string, options: RequestInit = {}) {
  if (!API_KEY) {
    throw new Error('Chatwoot API Key missing');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
    } else {
      const text = await response.text();
      // Trata o erro "Retry later" (Rate Limit) de forma específica
      if (text.includes('Retry later')) {
        throw new Error('Chatwoot Rate Limit: Muitas requisições. Tente novamente em alguns segundos.');
      }
      throw new Error(`Chatwoot API Error (${response.status}): ${text.substring(0, 100)}...`);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function sendChatwootMessage(conversationId: string | number, content: string) {
  if (!ACCOUNT_ID) throw new Error('Chatwoot Account ID missing');
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`;

  return chatwootFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      content,
      message_type: 'outgoing',
      private: false,
    }),
  });
}

export async function updateChatwootConversationStatus(conversationId: string | number, status: 'open' | 'resolved' | 'pending' | 'snoozed') {
  if (!ACCOUNT_ID) throw new Error('Chatwoot Account ID missing');
  
  // Directly update database
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('atendimentos_camara')
      .update({ status })
      .eq('account_id', Number(ACCOUNT_ID))
      .eq('conversation_id', Number(conversationId));
  }
  
  return { status: 'success' };
}



export async function updateChatwootConversationPriority(conversationId: string | number, priority: 'urgent' | 'high' | 'medium' | 'low' | null) {
  if (!ACCOUNT_ID) throw new Error('Chatwoot Account ID missing');
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`;

  return chatwootFetch(url, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
}

export async function addChatwootLabels(conversationId: string | number, labels: string[]) {
  if (!ACCOUNT_ID) throw new Error('Chatwoot Account ID missing');
  
  // Directly update database
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('atendimentos_camara')
      .update({ labels })
      .eq('account_id', Number(ACCOUNT_ID))
      .eq('conversation_id', Number(conversationId));
  }
  
  return { status: 'success' };
}

export async function getChatwootLabels(conversationId: string | number) {
  if (!ACCOUNT_ID) return [];
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`;

  try {
    const json = await chatwootFetch(url);
    return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  } catch (error) {
    console.error('Error fetching Chatwoot labels:', error);
    return [];
  }
}

export async function updateChatwootCustomAttributes(conversationId: string | number, custom_attributes: Record<string, any>) {
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot credentials missing');
  }

  // Directly update database
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('atendimentos_camara')
      .update({ custom_attributes })
      .eq('account_id', Number(ACCOUNT_ID))
      .eq('conversation_id', Number(conversationId));
  }

  return { status: 'success' };
}

export async function assignChatwootTeam(conversationId: string | number, teamId: string | number | null) {
  if (!ACCOUNT_ID) throw new Error('Chatwoot Account ID missing');
  
  // Directly update database
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('atendimentos_camara')
      .update({ team_id: teamId })
      .eq('account_id', Number(ACCOUNT_ID))
      .eq('conversation_id', Number(conversationId));
  }
  
  return { status: 'success' };
}

export async function getChatwootProfile() {
  const cached = getCached('profile');
  if (cached) return cached;
  
  if (!API_KEY) {
    throw new Error('Chatwoot API Key missing');
  }

  const url = `${BASE_URL}/api/v1/profile`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot Profile API Error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  setCached('profile', data);
  return data;
}

export async function updateChatwootProfile(profileData: Record<string, any>) {
  if (!API_KEY) {
    throw new Error('Chatwoot API Key missing');
  }

  const url = `${BASE_URL}/api/v1/profile`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot Profile API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function resolveChatwootConversation(conversationId: string | number) {
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot credentials missing');
  }

  // Directly update database
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase
      .from('atendimentos_camara')
      .update({ status: 'resolved' })
      .eq('account_id', Number(ACCOUNT_ID))
      .eq('conversation_id', Number(conversationId));
  }

  return { status: 'success' };
}

export async function getChatwootMessages(conversationId: string | number) {
  if (!ACCOUNT_ID) return [];
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`;

  try {
    const json = await chatwootFetch(url);
    return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  } catch (error) {
    console.error('Error fetching Chatwoot messages:', error);
    return [];
  }
}

export async function getChatwootInboxes() {
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot API Key or Account ID not configured');
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
}

export async function getChatwootConversations(filters: { inboxId?: string | number, teamId?: string | number, status?: string, assignee_type?: string, page?: number } = {}) {
  if (!ACCOUNT_ID) return [];

  const queryParams = new URLSearchParams();
  if (filters.inboxId) queryParams.append('inbox_id', filters.inboxId.toString());
  if (filters.teamId) queryParams.append('team_id', filters.teamId.toString());
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.assignee_type) queryParams.append('assignee_type', filters.assignee_type);
  if (filters.page) queryParams.append('page', filters.page.toString());

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?${queryParams.toString()}`;

  try {
    const json = await chatwootFetch(url);
    return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  } catch (error) {
    console.error('Error fetching Chatwoot conversations:', error);
    return [];
  }
}

export async function getChatwootConversationDetails(conversationId: string | number) {
  if (!ACCOUNT_ID) return null;
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`;

  try {
    const json = await chatwootFetch(url);
    return json.data?.payload || json.payload || json;
  } catch (error) {
    console.error('Error fetching Chatwoot conversation details:', error);
    return null;
  }
}

export async function getChatwootCannedResponses() {
  const cached = getCached('cannedResponses');
  if (cached) return cached;

  if (!API_KEY || !ACCOUNT_ID) {
    return [];
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/canned_responses`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  const data = json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  setCached('cannedResponses', data);
  return data;
}

export async function getChatwootConversationCounts(filters: { inboxId?: string | number } = {}) {
  if (!ACCOUNT_ID) return { meta: { mine_count: 0, assigned_count: 0, unassigned_count: 0, all_count: 0 } };

  const queryParams = new URLSearchParams();
  if (filters.inboxId) queryParams.append('inbox_id', filters.inboxId.toString());

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/meta?${queryParams.toString()}`;

  try {
    const json = await chatwootFetch(url);
    return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  } catch (error) {
    console.error('Chatwoot Conversation Counts Error:', error);
    return { meta: { mine_count: 0, assigned_count: 0, unassigned_count: 0, all_count: 0 } };
  }
}

export async function getChatwootTeams() {
  const cached = getCached('teams');
  if (cached) return cached;

  if (!API_KEY || !ACCOUNT_ID) {
    return [];
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/teams`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  const data = json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
  setCached('teams', data);
  return data;
}

export async function getChatwootInbox(inboxId: string | number) {
  const cached = getCached(`inbox_${inboxId}`);
  if (cached) return cached;

  if (!API_KEY || !ACCOUNT_ID) {
    return null;
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/inboxes/${inboxId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  setCached(`inbox_${inboxId}`, data);
  return data;
}

export async function getChatwootPublicConversations(inboxIdentifier: string, contactIdentifier: string) {
  const url = `${BASE_URL}/public/api/v1/inboxes/${inboxIdentifier}/contacts/${contactIdentifier}/conversations`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY || '',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot Public API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
}

export async function getChatwootPublicMessages(inboxIdentifier: string, contactIdentifier: string, conversationId: string | number) {
  const url = `${BASE_URL}/public/api/v1/inboxes/${inboxIdentifier}/contacts/${contactIdentifier}/conversations/${conversationId}/messages`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY || '',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot Public API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
}

export async function getChatwootAccountDetails() {
  if (!API_KEY || !ACCOUNT_ID) {
    return null;
  }

  const url = `${BASE_URL}/platform/api/v1/accounts/${ACCOUNT_ID}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot Platform API Error: ${JSON.stringify(error)}`);
  }

  const json = await response.json();
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
}

export async function getChatwootAuditLogs(page: number = 1) {
  if (!ACCOUNT_ID || !API_KEY) return [];
  
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/audit_logs?page=${page}`;
  
  try {
    const json = await chatwootFetch(url);
    // Chatwoot audit logs structure is usually { payload: [...] }
    return json.payload || json.data || (Array.isArray(json) ? json : []);
  } catch (error) {
    console.error('Error fetching Chatwoot audit logs:', error);
    return [];
  }
}

export async function getChatwootAccountLabels() {
  if (!ACCOUNT_ID) return [];
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/labels`;

  try {
    const json = await chatwootFetch(url);
    return json.payload || json.data || (Array.isArray(json) ? json : []);
  } catch (error) {
    console.error('Error fetching Chatwoot account labels:', error);
    return [];
  }
}

