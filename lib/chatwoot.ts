/**
 * Chatwoot API Client (Server Side)
 */

const API_KEY = process.env.CHATWOOT_API_KEY;
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

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
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/toggle_status`;

  return chatwootFetch(url, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export async function getChatwootReports(metric: string, type: string = 'account', params: any = {}) {
  if (!ACCOUNT_ID) return { data: [] };

  const queryParams = new URLSearchParams({ metric, ...params });
  const path = type === 'account' ? 'reports' : `reports/${type}`;
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/${path}?${queryParams.toString()}`;

  try {
    const json = await chatwootFetch(url);
    return json;
  } catch (error: any) {
    if (error.message.includes('404')) {
      console.warn(`Chatwoot reports not found (404) at ${url}`);
      return { data: [] };
    }
    console.error('Error fetching Chatwoot reports:', error);
    return { data: [] };
  }
}

export async function getChatwootReportsSummary(params: any = {}) {
  const emptySummary = {
    avg_first_response_time: 0,
    avg_resolution_time: 0,
    conversations_count: 0,
    incoming_messages_count: 0,
    outgoing_messages_count: 0,
    resolutions_count: 0
  };

  if (!ACCOUNT_ID) return emptySummary;
  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/reports/summary?${queryParams.toString()}`;

  try {
    const json = await chatwootFetch(url);
    return json;
  } catch (error: any) {
    if (error.message.includes('404')) {
      console.warn(`Chatwoot reports summary not found (404) at ${url}`);
      return emptySummary;
    }
    console.error('Error fetching Chatwoot reports summary:', error);
    return emptySummary;
  }
}

export async function getChatwootTeamSummary(params: any = {}) {
  if (!API_KEY || !ACCOUNT_ID) return [];
  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v2/accounts/${ACCOUNT_ID}/summary_reports/team?${queryParams.toString()}`;
  try {
    const response = await fetch(url, {
      headers: { 'api_access_token': API_KEY }
    });
    return response.ok ? response.json() : [];
  } catch (error) {
    console.error('Error fetching team summary:', error);
    return [];
  }
}

export async function getChatwootChannelSummary(params: any = {}) {
  if (!API_KEY || !ACCOUNT_ID) return [];
  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v2/accounts/${ACCOUNT_ID}/summary_reports/channel?${queryParams.toString()}`;
  try {
    const response = await fetch(url, {
      headers: { 'api_access_token': API_KEY }
    });
    return response.ok ? response.json() : [];
  } catch (error) {
    console.error('Error fetching channel summary:', error);
    return [];
  }
}

export async function getChatwootFirstResponseDistribution(params: any = {}) {
  if (!API_KEY || !ACCOUNT_ID) return {};
  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v2/accounts/${ACCOUNT_ID}/reports/first_response_time_distribution?${queryParams.toString()}`;
  try {
    const response = await fetch(url, {
      headers: { 'api_access_token': API_KEY }
    });
    return response.ok ? response.json() : {};
  } catch (error) {
    console.error('Error fetching response distribution:', error);
    return {};
  }
}

// Funções especializadas de relatório baseadas na API
export async function getAgentReports(params: any = {}) {
  return getChatwootReports('conversations_count', 'agent', params);
}

export async function getInboxReports(params: any = {}) {
  return getChatwootReports('conversations_count', 'inbox', params);
}

export async function getTeamReports(params: any = {}) {
  return getChatwootReports('conversations_count', 'team', params);
}

export async function getChatwootConversationMetrics(params: any = {}) {
  if (!API_KEY || !ACCOUNT_ID) return { conversations: [] };
  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/reports/conversations?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    headers: { 'api_access_token': API_KEY }
  });
  return response.ok ? response.json() : { conversations: [] };
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
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`;

  return chatwootFetch(url, {
    method: 'POST',
    body: JSON.stringify({ labels }),
  });
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

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/custom_attributes`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify({ custom_attributes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getChatwootProfile() {
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

  return response.json();
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

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/toggle_status`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify({
      status: 'resolved',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
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
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
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
  return json.data?.payload || json.payload || (Array.isArray(json.data) ? json.data : json);
}

export async function getChatwootInbox(inboxId: string | number) {
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

  return response.json();
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

