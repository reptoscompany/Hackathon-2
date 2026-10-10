/** Client for local AI models (Ollama / LM Studio / any OpenAI-compatible server).
 * All calls run in the browser — no keys leave your machine except to the
 * endpoint you configure. Nothing is sent to the cloud by this app.
 */

const CONFIG_KEY = 'crimemap-ai-config';

export const PROVIDER_PRESETS = {
  ollama: {
    label: 'Ollama',
    endpoint: 'http://localhost:11434',
    model: 'llama3.1',
    hint: 'Run: ollama serve  +  ollama pull llama3.1'
  },
  openai: {
    label: 'LM Studio / OpenAI-compatible',
    endpoint: 'http://localhost:1234/v1',
    model: 'local-model',
    hint: 'LM Studio → Developer tab → Start Server (enable CORS)'
  }
};

export function loadAIConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { provider: 'ollama', endpoint: '', model: '', apiKey: '', ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return {
    provider: 'ollama',
    endpoint: PROVIDER_PRESETS.ollama.endpoint,
    model: PROVIDER_PRESETS.ollama.model,
    apiKey: ''
  };
}

export function saveAIConfig(cfg) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  } catch { /* ignore */ }
}

function normalizeEndpoint(endpoint) {
  return (endpoint || '').trim().replace(/\/+$/, '');
}

async function fetchWithTimeout(url, options = {}, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Probe the endpoint to verify a local model server is reachable. */
export async function testAIConnection({ provider, endpoint, apiKey }) {
  const base = normalizeEndpoint(endpoint);
  if (!base) throw new Error('Enter an endpoint URL first.');
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  // Try provider-native discovery endpoints first
  const candidates =
    provider === 'ollama'
      ? [`${base}/api/tags`, `${base}/v1/models`]
      : [`${base}/models`, `${base}/api/tags`];

  let lastErr = null;
  for (const url of candidates) {
    try {
      const res = await fetchWithTimeout(url, { headers }, 8000);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const models =
          data?.models?.map((m) => m.name || m.id) ||
          data?.data?.map((m) => m.id) ||
          [];
        return { ok: true, url, models };
      }
      lastErr = new Error(`HTTP ${res.status} from ${url}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Cannot reach a model server at ${base}. ` +
    `Start it first (${lastErr?.message || 'connection refused'}). ` +
    `If the server is running, allow CORS / browser access.`
  );
}

/**
 * Send a chat request to the local model.
 * Returns the assistant text.
 */
export async function chatWithLocalModel({ provider, endpoint, model, apiKey }, messages) {
  const base = normalizeEndpoint(endpoint);
  if (!base) throw new Error('Configure an endpoint first.');
  if (!model) throw new Error('Enter a model name first.');
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  if (provider === 'ollama') {
    // Native Ollama chat API
    try {
      const res = await fetchWithTimeout(`${base}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, stream: false })
      }, 120000);
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.message?.content || data?.response || '';
      if (!text) throw new Error('Empty response from model.');
      return text;
    } catch (e) {
      // Fall back to OpenAI-compatible path on the same host
      const res = await fetchWithTimeout(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, temperature: 0.3 })
      }, 120000);
      if (!res.ok) throw new Error(e.message || `HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      if (!text) throw new Error('Empty response from model.');
      return text;
    }
  }

  // OpenAI-compatible (LM Studio, llama.cpp server, text-generation-webui, etc.)
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, temperature: 0.3 })
  }, 120000);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Model server HTTP ${res.status}. ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty response from model.');
  return text;
}
