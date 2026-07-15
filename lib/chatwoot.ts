/**
 * Chatwoot API Client (Server Side)
 */

const API_KEY = process.env.CHATWOOT_API_KEY;
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

// Mock data for development when credentials are missing
const MOCK_DATA = {
  profile: { id: 1, name: 'Vereador Mock', email: 'vereador@exemplo.com' },
  counts: { meta: { mine_count: 5, assigned_count: 8, unassigned_count: 2, all_count: 10 } },
  teams: [{ id: 1, name: 'Gabinete Legislativo' }, { id: 2, name: 'Ouvidoria' }],
  inbox: { id: 3, name: 'Câmara de SJB', channel_type: 'Channel::Whatsapp' },
  canned_responses: [
    { short_code: 'boasvindas', content: 'Olá! Sou o Vereador e recebi sua demanda. Em breve daremos um retorno oficial.' },
    { short_code: 'encaminhado', content: 'Sua solicitação foi encaminhada para a secretaria competente para análise.' }
  ],
  conversations: [
    {
      id: 1,
      status: 'open',
      inbox_id: 3,
      labels: ['Urgent'],
      meta: { sender: { id: 101, name: 'João Silva' }, assignee: { name: 'Vereador Mock' } },
      messages: [{ content: 'Gostaria de saber sobre a pavimentação da rua principal.', message_type: 'incoming', created_at: new Date().toISOString() }]
    }
  ],
  sync: [
    {
      id: 1,
      conversation_id: 1,
      source: 'WhatsApp',
      status: 'open',
      assignee: 'Vereador Mock',
      labels: ['Infraestrutura'],
      inbox_id: 3,
      contact_name: 'João Silva',
      contact_id: 101,
      message: 'Gostaria de saber sobre a pavimentação da rua principal.',
      sentiment: 'neutro',
      priority: 'alta',
      theme: 'Obras',
      resumo: 'Solicitação de pavimentação',
      suggested_response: 'Olá João, já estamos verificando com a secretaria de obras.',
      created_at: new Date().toISOString()
    }
  ]
};

export async function sendChatwootMessage(conversationId: string | number, content: string) {
  if (!API_KEY || !ACCOUNT_ID) {
    console.warn('Chatwoot credentials missing, using mock send');
    return { id: Math.random(), content, message_type: 'outgoing', created_at: new Date().toISOString() };
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
    console.warn('Chatwoot credentials missing, using mock update');
    return { id: conversationId, status };
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
    console.warn('Chatwoot credentials missing, using mock reports');
    return {
      data: [
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 4, value: '10' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 3, value: '15' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, value: '8' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 1, value: '20' },
        { timestamp: Math.floor(Date.now() / 1000), value: '12' }
      ]
    };
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
      if (response.status === 404) {
        console.warn(`Reports endpoint not found (404) at ${url}. Returning mock data.`);
        return {
          data: [
            { timestamp: Math.floor(Date.now() / 1000) - 86400 * 4, value: Math.floor(Math.random() * 15 + 5).toString() },
            { timestamp: Math.floor(Date.now() / 1000) - 86400 * 3, value: Math.floor(Math.random() * 15 + 5).toString() },
            { timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, value: Math.floor(Math.random() * 15 + 5).toString() },
            { timestamp: Math.floor(Date.now() / 1000) - 86400 * 1, value: Math.floor(Math.random() * 15 + 5).toString() },
            { timestamp: Math.floor(Date.now() / 1000), value: Math.floor(Math.random() * 15 + 5).toString() }
          ]
        };
      }
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
    // Return mock data on any fetch error to keep UI working
    return {
      data: [
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 4, value: '10' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 3, value: '15' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, value: '8' },
        { timestamp: Math.floor(Date.now() / 1000) - 86400 * 1, value: '20' },
        { timestamp: Math.floor(Date.now() / 1000), value: '12' }
      ]
    };
  }
}

export async function getChatwootReportsSummary(params: any = {}) {
  const defaultSummary = {
    avg_first_response_time: 1200,
    avg_resolution_time: 3600,
    conversations_count: 25,
    incoming_messages_count: 150,
    outgoing_messages_count: 140,
    resolutions_count: 18
  };

  if (!API_KEY || !ACCOUNT_ID) {
    return defaultSummary;
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
      if (response.status === 404) {
        console.warn(`Reports summary endpoint not found (404) at ${url}. Returning mock data.`);
        return defaultSummary;
      }
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
    return defaultSummary;
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
    console.warn('Chatwoot credentials missing, using mock update');
    return { id: conversationId, priority };
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
    console.warn('Chatwoot credentials missing, using mock update');
    return { id: conversationId, labels };
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
    console.warn('Chatwoot credentials missing, using mock labels');
    return MOCK_DATA.conversations[0].labels;
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
    console.warn('Chatwoot credentials missing, using mock update');
    return { id: conversationId, custom_attributes };
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
    console.warn('Chatwoot API Key missing, using mock profile');
    return MOCK_DATA.profile;
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
    console.warn('Chatwoot API Key missing, using mock update');
    return { ...MOCK_DATA.profile, ...profileData };
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
    console.warn('Chatwoot credentials missing, using mock resolve');
    return { id: conversationId, status: 'resolved' };
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
    console.warn('Chatwoot credentials missing, using mock messages');
    return MOCK_DATA.conversations[0].messages;
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
    console.warn('Chatwoot credentials missing, using mock conversations');
    return MOCK_DATA.conversations;
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
    console.warn('Chatwoot credentials missing, using mock conversation details');
    return MOCK_DATA.conversations.find(c => c.id.toString() === conversationId.toString()) || MOCK_DATA.conversations[0];
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
    console.warn('Chatwoot credentials missing, using mock canned responses');
    return MOCK_DATA.canned_responses;
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
    console.warn('Chatwoot credentials missing, using mock counts');
    return MOCK_DATA.counts;
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
    console.warn('Chatwoot credentials missing, using mock teams');
    return MOCK_DATA.teams;
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
    console.warn('Chatwoot credentials missing, using mock inbox');
    return MOCK_DATA.inbox;
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
    console.warn('Chatwoot credentials missing, using mock account details');
    return { id: ACCOUNT_ID || 1, name: 'Câmara Municipal de SJB' };
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

