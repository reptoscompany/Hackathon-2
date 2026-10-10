import { useMemo, useState } from 'react';
import { Brain, PlugZap, RefreshCw, Send, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Select } from '@/components';
import { LoadingState, ErrorState } from '@/components/DataState';
import { useData } from '@/services/DataContext';
import { buildWardHotspots, suggestPatrolWindows } from '@/utils/geo';
import {
  PROVIDER_PRESETS,
  loadAIConfig,
  saveAIConfig,
  testAIConnection,
  chatWithLocalModel
} from '@/services/aiClient';

const PRESET_QUESTIONS = [
  'Where is the next assault most likely, and why?',
  'What is the best patrol window tonight?',
  'Summarize this week in 3 bullet points for briefing.'
];

/** Heuristic fallback that always works offline — clearly labeled simulated. */
function heuristicPrediction(incidents) {
  if (!incidents?.length) return null;
  const byWard = {};
  const byType = {};
  const byHour = Array(24).fill(0);
  incidents.forEach((i) => {
    byWard[i.ward] = byWard[i.ward] || [];
    byWard[i.ward].push(i);
    byType[i.crime_type] = (byType[i.crime_type] || 0) + 1;
    const h = parseInt(String(i.incident_time).split(':')[0], 10);
    if (!Number.isNaN(h)) byHour[h] += 1;
  });
  const topWardEntry = Object.entries(byWard).sort((a, b) => b[1].length - a[1].length)[0];
  const [ward, list] = topWardEntry;
  const evening = list.filter((i) => {
    const h = parseInt(String(i.incident_time).split(':')[0], 10);
    return h >= 18 && h < 22;
  }).length;
  const assaults = list.filter((i) => i.crime_type === 'Assault').length;
  const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  const peakHour = byHour.indexOf(Math.max(...byHour));
  const window = evening / list.length >= 0.35 ? '18:00–22:00' : `${String(peakHour).padStart(2, '0')}:00–${String((peakHour + 2) % 24).padStart(2, '0')}:00`;
  const confidence = Math.min(0.92, 0.45 + (list.length / incidents.length) * 0.8 + (evening / list.length) * 0.2);
  return {
    ward,
    count: list.length,
    window,
    type: assaults >= list.length * 0.25 ? 'Assault' : topTypeEntry[0],
    confidence,
    reasons: [
      `${list.length} past incidents in ${ward} (${((list.length / incidents.length) * 100).toFixed(1)}% of all cases)`,
      `${((evening / list.length) * 100).toFixed(0)}% of ${ward} cases fall in the evening peak`,
      `${topTypeEntry[0]} is the most frequent type overall (${topTypeEntry[1]} cases)`,
      `Peak hour across data is ${String(peakHour).padStart(2, '0')}:00`
    ]
  };
}

function buildSummaryText(services, hotspots, windows) {
  const k = services.kpis;
  const topWards = hotspots.slice(0, 5).map((h) => `${h.ward} (${h.level} ${h.score}, ${h.count} cases)`).join('; ');
  const typeDist = services.charts.crimeTypeDist.map((t) => `${t.type}: ${t.count}`).join(', ');
  const patrol = windows.slice(0, 4).map((w) => `${w.ward} ${w.day} ${w.block} (${w.count})`).join('; ');
  return [
    `Dataset: ${k.totalIncidents} simulated incidents. Most common type: ${k.mostCommonType}. Unresolved: ${k.unresolvedCases}.`,
    `Top risk wards: ${topWards}.`,
    `By type: ${typeDist}.`,
    `Suggested patrol cells: ${patrol}.`
  ].join('\n');
}

const SYSTEM_PROMPT =
  'You are CRIMEMAP assistant. All data is synthetic prototype data. ' +
  'Predict PLACES and TIME PERIODS only — never individuals. ' +
  'Be concise, cite the numbers given, and end with one patrol suggestion. ' +
  'Always remind that this is simulated, not evidence.';

export function AIAssistant() {
  const { services, loading, error } = useData();
  const [config, setConfig] = useState(loadAIConfig);
  const [connState, setConnState] = useState('idle'); // idle | testing | connected | error
  const [connMsg, setConnMsg] = useState('');
  const [models, setModels] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [busy, setBusy] = useState(false);

  const hotspots = useMemo(
    () => (services ? buildWardHotspots(services.incidents, services.landmarks) : []),
    [services]
  );
  const windows = useMemo(
    () => (services ? suggestPatrolWindows(services.incidents, 6) : []),
    [services]
  );
  const prediction = useMemo(
    () => (services ? heuristicPrediction(services.incidents) : null),
    [services]
  );
  const summaryText = useMemo(
    () => (services ? buildSummaryText(services, hotspots, windows) : ''),
    [services, hotspots, windows]
  );

  if (loading) return <div className="p-6"><LoadingState message="Loading data for AI analysis…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  const set = (patch) => {
    setConfig((c) => {
      const next = { ...c, ...patch };
      saveAIConfig(next);
      return next;
    });
  };

  const applyPreset = (provider) => {
    const p = PROVIDER_PRESETS[provider];
    set({ provider, endpoint: p.endpoint, model: p.model });
    setConnState('idle');
    setConnMsg('');
  };

  const handleTest = async () => {
    setConnState('testing');
    setConnMsg('Contacting local model server…');
    try {
      const res = await testAIConnection(config);
      setModels(res.models || []);
      setConnState('connected');
      setConnMsg(`Connected via ${res.url}${res.models?.length ? ` · models: ${res.models.slice(0, 3).join(', ')}` : ''}`);
    } catch (e) {
      setConnState('error');
      setConnMsg(e.message);
    }
  };

  const runAI = async (mode, customQ) => {
    const q = customQ ?? question;
    if (mode === 'chat' && !q.trim()) return;
    setBusy(true);
    setAnswer('');
    setAiReasoning('');
    const userPrompt =
      mode === 'predict'
        ? `DATA:\n${summaryText}\n\nHeuristic baseline: next incident likely ${prediction.type} in ${prediction.ward} during ${prediction.window} (confidence ${(prediction.confidence * 100).toFixed(0)}%).\n\nExplain this prediction in plain language for a duty officer: which ward, which time window, which crime type, and why (2-4 reasons with numbers).`
        : mode === 'analyze'
          ? `DATA:\n${summaryText}\n\nAnalyze this synthetic crime data: top patterns, riskiest ward/time, and 3 deployment suggestions.`
          : `DATA:\n${summaryText}\n\nOfficer question: ${q}\n\nAnswer using ONLY the data above. If the answer is not in the data, say so.`;
    try {
      const text = await chatWithLocalModel(config, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]);
      if (mode === 'predict') setAiReasoning(text);
      else setAnswer(text);
      setConnState('connected');
    } catch (e) {
      // Graceful fallback: heuristic answer keeps the page useful offline
      const fallback =
        mode === 'predict'
          ? `Local model unreachable (${e.message}).\n\nSimulated baseline still applies: most likely next — ${prediction.type} in ${prediction.ward} during ${prediction.window} — based on ${prediction.reasons[0].toLowerCase()}. Connect a model (Ollama / LM Studio) and retry for a generated explanation.`
          : `Local model unreachable (${e.message}). Showing data summary instead:\n\n${summaryText}`;
      if (mode === 'predict') setAiReasoning(fallback);
      else setAnswer(fallback);
      setConnState((s) => (s === 'connected' ? s : 'error'));
      if (connState !== 'connected') setConnMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[var(--color-accent)]" aria-hidden="true" /> AI Assistance
        </h1>
        <p className="text-[var(--color-text-secondary)]">Connect your local AI model to analyse data and predict the next assault or crime</p>
      </div>

      <div className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-navy-50)] text-sm text-[var(--color-text-primary)]" role="note">
        <strong>Simulated data · predictions describe places &amp; time periods, never individuals.</strong>
        <span className="text-[var(--color-text-secondary)]"> The model runs on your machine (Ollama / LM Studio). Nothing is uploaded anywhere.</span>
      </div>

      {/* Connection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><PlugZap className="w-5 h-5" aria-hidden="true" /> Local model connection</CardTitle>
            <CardDescription>Ollama or any OpenAI-compatible server (LM Studio, llama.cpp). Saved in this browser only.</CardDescription>
          </div>
          <Badge
            variant={connState === 'connected' ? 'success' : connState === 'error' ? 'danger' : connState === 'testing' ? 'warning' : 'gray'}
            size="sm"
          >
            {connState === 'connected' ? 'Connected' : connState === 'testing' ? 'Testing…' : connState === 'error' ? 'Not connected' : 'Not tested'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Provider preset"
              value={config.provider}
              onChange={(e) => applyPreset(e.target.value)}
              options={[
                { value: 'ollama', label: 'Ollama (localhost:11434)' },
                { value: 'openai', label: 'LM Studio / OpenAI-compatible' }
              ]}
            />
            <Input
              label="Model name"
              placeholder={PROVIDER_PRESETS[config.provider]?.model || 'llama3.1'}
              value={config.model}
              onChange={(e) => set({ model: e.target.value })}
              hint={PROVIDER_PRESETS[config.provider]?.hint}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Endpoint URL"
              placeholder="http://localhost:11434"
              value={config.endpoint}
              onChange={(e) => set({ endpoint: e.target.value })}
            />
            <Input
              label="API key (optional, usually empty for local)"
              type="password"
              placeholder="sk-… (leave empty for Ollama)"
              value={config.apiKey || ''}
              onChange={(e) => set({ apiKey: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleTest} disabled={connState === 'testing'} leftIcon={<PlugZap className="w-4 h-4" aria-hidden="true" />}>
              {connState === 'testing' ? 'Testing…' : 'Test connection'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => runAI('analyze')} disabled={busy} leftIcon={<Brain className="w-4 h-4" aria-hidden="true" />}>
              Analyse data with AI
            </Button>
          </div>
          {connMsg && (
            <p className={`text-sm ${connState === 'error' ? 'text-[var(--color-crime-assault)]' : 'text-[var(--color-text-secondary)]'}`} role="status">
              {connMsg}
            </p>
          )}
          {models.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {models.slice(0, 6).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set({ model: m })}
                  className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-full border border-[var(--color-border)] hover:bg-[var(--color-navy-50)]"
                  title={`Use model ${m}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <details className="text-sm text-[var(--color-text-secondary)]">
            <summary className="cursor-pointer font-medium text-[var(--color-text-primary)] py-2 min-h-[44px]">How to start a local model</summary>
            <ol className="list-decimal ml-5 space-y-1 mt-1">
              <li><strong>Ollama:</strong> install from ollama.com → <code>ollama serve</code> → <code>ollama pull llama3.1</code>. If the browser blocks it, start with <code>OLLAMA_ORIGINS=* ollama serve</code>.</li>
              <li><strong>LM Studio:</strong> load a model → Developer tab → Start Server → enable CORS. Endpoint is <code>http://localhost:1234/v1</code>.</li>
              <li>Enter the endpoint + model above → <strong>Test connection</strong> → ask questions below.</li>
            </ol>
          </details>
        </CardContent>
      </Card>

      {/* Data snapshot + prediction */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Data snapshot (what the AI sees)</CardTitle>
            <CardDescription>{services.incidents.length} incidents · {hotspots.length} wards · live from sample data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 text-sm">
              {[
                ['Total cases', services.kpis.totalIncidents],
                ['Most common', services.kpis.mostCommonType],
                ['Top ward', hotspots[0]?.ward || '—'],
                ['Unresolved', services.kpis.unresolvedCases]
              ].map(([k, v]) => (
                <div key={k} className="border border-[var(--color-border)] rounded-lg p-3 min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{k}</p>
                  <p className="font-semibold text-[var(--color-text-primary)] truncate">{v}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {hotspots.slice(0, 4).map((h) => (
                <li key={h.ward} className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: h.level === 'Critical' ? '#D71920' : h.level === 'High' ? '#ea580c' : h.level === 'Moderate' ? '#f59e0b' : '#16a34a' }} aria-hidden="true" />
                  <span className="font-medium text-[var(--color-text-primary)] truncate">{h.ward}</span>
                  <span className="text-[var(--color-text-muted)] text-xs ml-auto flex-shrink-0">{h.level} · {h.count} cases</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" aria-hidden="true" /> Next assault / crime prediction</CardTitle>
              <CardDescription>Heuristic baseline + optional AI explanation</CardDescription>
            </div>
            <Badge variant={prediction.confidence >= 0.7 ? 'danger' : prediction.confidence >= 0.5 ? 'warning' : 'gray'} size="sm">
              {(prediction.confidence * 100).toFixed(0)}% simulated confidence
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-navy-50)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{prediction.type} · {prediction.ward}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Most likely window: <strong>{prediction.window}</strong></p>
              <div className="mt-2 h-2 bg-white rounded-full overflow-hidden border border-[var(--color-border)]">
                <div className="h-full bg-[var(--color-crime-assault)]" style={{ width: `${prediction.confidence * 100}%` }} />
              </div>
            </div>
            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
              {prediction.reasons.map((r) => <li key={r} className="flex gap-2"><span aria-hidden="true">•</span><span>{r}</span></li>)}
            </ul>
            <Button size="sm" onClick={() => runAI('predict')} disabled={busy} leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />} className="w-full sm:w-auto min-h-[44px]">
              {busy ? 'Generating…' : 'Generate AI explanation'}
            </Button>
            {aiReasoning && (
              <div className="text-sm whitespace-pre-wrap border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-surface)]" role="status">
                {aiReasoning}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ask */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" aria-hidden="true" /> Ask about the data</CardTitle>
          <CardDescription>Works offline with the summary; connects to your model when available</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-col sm:flex-row sm:flex-wrap">
            {PRESET_QUESTIONS.map((q) => (
              <Button key={q} variant="outline" size="sm" onClick={() => { setQuestion(q); runAI('chat', q); }} disabled={busy} className="text-left whitespace-normal w-full sm:w-auto">
                {q}
              </Button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="e.g. Which ward needs patrols this weekend?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runAI('chat'); }}
              className="flex-1 min-w-0"
              aria-label="Ask a question about the data"
            />
            <Button onClick={() => runAI('chat')} disabled={busy || !question.trim()} leftIcon={<Send className="w-4 h-4" aria-hidden="true" />} className="min-h-[44px]">
              {busy ? 'Thinking…' : 'Ask'}
            </Button>
          </div>
          {answer && (
            <div className="text-sm whitespace-pre-wrap border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-navy-50)]" role="status">
              {answer}
            </div>
          )}
          <p className="text-xs text-[var(--color-text-muted)] flex gap-1.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            AI output is advisory on simulated data — verify before any operational use. Predictions guide presence; they never label people.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
