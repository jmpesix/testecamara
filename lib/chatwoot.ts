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

export async function getChatwootConversations(filters: { inboxId?: string | number, teamId?: string | number, status?: string, assignee_type?: string } = {}) {
  if (!API_KEY || !ACCOUNT_ID) {
    console.warn('Chatwoot credentials missing, using mock conversations');
    return MOCK_DATA.conversations;
  }

  const queryParams = new URLSearchParams();
  if (filters.inboxId) queryParams.append('inbox_id', filters.inboxId.toString());
  if (filters.teamId) queryParams.append('team_id', filters.teamId.toString());
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.assignee_type) queryParams.append('assignee_type', filters.assignee_type);

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

