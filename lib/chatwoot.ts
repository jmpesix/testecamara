/**
 * Chatwoot API Client (Server Side)
 */

const API_KEY = process.env.CHATWOOT_API_KEY;
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

export async function sendChatwootMessage(conversationId: string | number, content: string) {
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot credentials missing');
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify({
      content,
      message_type: 'outgoing', // Mensagem do atendente/vereador
      private: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function updateChatwootConversationStatus(conversationId: string | number, status: 'open' | 'resolved' | 'pending' | 'snoozed') {
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
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getChatwootReports(metric: string, type: string = 'account', params: any = {}) {
  if (!API_KEY || !ACCOUNT_ID) {
    return { data: [] };
  }

  const queryParams = new URLSearchParams({
    metric,
    ...params
  });

  const path = type === 'account' ? 'reports' : `reports/${type}`;
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/${path}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': API_KEY,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP Error ${response.status} at ${url}`;
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = `Chatwoot API Error: ${JSON.stringify(error)} (URL: ${url})`;
      } else {
        const text = await response.text();
        errorMessage = `Chatwoot API Error (${response.status}): ${text.substring(0, 100)}... (URL: ${url})`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    throw new Error(`Expected JSON but received: ${text.substring(0, 100)}... (URL: ${url})`);
  } catch (error) {
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

  if (!API_KEY || !ACCOUNT_ID) {
    return emptySummary;
  }

  const queryParams = new URLSearchParams(params);
  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/reports/summary?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': API_KEY,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP Error ${response.status} at ${url}`;
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = `Chatwoot API Error: ${JSON.stringify(error)} (URL: ${url})`;
      } else {
        const text = await response.text();
        errorMessage = `Chatwoot API Error (${response.status}): ${text.substring(0, 100)}... (URL: ${url})`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    throw new Error(`Expected JSON but received: ${text.substring(0, 100)}... (URL: ${url})`);
  } catch (error) {
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
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot credentials missing');
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify({ priority }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function addChatwootLabels(conversationId: string | number, labels: string[]) {
  if (!API_KEY || !ACCOUNT_ID) {
    throw new Error('Chatwoot credentials missing');
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': API_KEY,
    },
    body: JSON.stringify({ labels }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Chatwoot API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getChatwootLabels(conversationId: string | number) {
  if (!API_KEY || !ACCOUNT_ID) {
    return [];
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`;

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
  if (!API_KEY || !ACCOUNT_ID) {
    return [];
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`;

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
  if (!API_KEY || !ACCOUNT_ID) {
    return [];
  }

  const queryParams = new URLSearchParams();
  if (filters.inboxId) queryParams.append('inbox_id', filters.inboxId.toString());
  if (filters.teamId) queryParams.append('team_id', filters.teamId.toString());
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.assignee_type) queryParams.append('assignee_type', filters.assignee_type);
  if (filters.page) queryParams.append('page', filters.page.toString());

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?${queryParams.toString()}`;

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

export async function getChatwootConversationDetails(conversationId: string | number) {
  if (!API_KEY || !ACCOUNT_ID) {
    return null;
  }

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/${conversationId}`;

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
  return json.data?.payload || json.payload || json;
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
  if (!API_KEY || !ACCOUNT_ID) {
    return { meta: { mine_count: 0, assigned_count: 0, unassigned_count: 0, all_count: 0 } };
  }

  const queryParams = new URLSearchParams();
  if (filters.inboxId) queryParams.append('inbox_id', filters.inboxId.toString());

  const url = `${BASE_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations/meta?${queryParams.toString()}`;

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

