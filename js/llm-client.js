const PROXY_URL = "http://127.0.0.1:3001";
const MODEL_STORAGE_KEY = "echoes-ollama-model";
export const DEFAULT_MODEL = "llama3.2:latest";

export const AVAILABLE_MODELS = [
  { id: "llama3.2:latest", label: "Llama 3.2 (fast, recommended)" },
  { id: "gemma:latest", label: "Gemma" },
  { id: "qwen3:8b", label: "Qwen3 8B" },
  { id: "deepseek-r1:latest", label: "DeepSeek R1 (reasoning)" },
  { id: "gpt-oss:20b", label: "GPT-OSS 20B (slow)" },
];

const MODEL_LABELS = Object.fromEntries(AVAILABLE_MODELS.map((m) => [m.id, m.label]));

function fallbackModelList() {
  return {
    ok: false,
    recommended: DEFAULT_MODEL,
    models: AVAILABLE_MODELS.map((m) => ({
      id: m.id,
      label: m.label,
      installed: null,
      recommended: m.id === DEFAULT_MODEL,
    })),
  };
}

/** Fetch installed Ollama models via proxy; falls back to curated list when offline. */
export async function fetchAvailableModels() {
  try {
    const res = await fetch(`${PROXY_URL}/api/models`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json().catch(() => ({}));

    let installed = data.installed || [];
    let ok = data.ok !== undefined ? Boolean(data.ok) : res.ok;

    if (!installed.length) {
      const health = await checkLlmHealth();
      if (health.models?.length) {
        installed = health.models;
        ok = Boolean(health.ok);
      }
    }

    if (!installed.length && !res.ok) throw new Error(data.error || `models ${res.status}`);

    const recommended = data.recommended || DEFAULT_MODEL;
    const chatModels = data.chatModels || AVAILABLE_MODELS.map((m) => ({
      name: m.id,
      installed: installed.includes(m.id),
    }));
    const models = [];
    const seen = new Set();

    for (const cm of chatModels) {
      seen.add(cm.name);
      models.push({
        id: cm.name,
        label: MODEL_LABELS[cm.name] || cm.name,
        installed: cm.installed,
        recommended: cm.name === recommended,
      });
    }

    for (const name of [...installed].sort()) {
      if (seen.has(name)) continue;
      models.push({
        id: name,
        label: name,
        installed: true,
        recommended: name === recommended,
      });
    }

    if (!models.length) return fallbackModelList();

    return { ok, recommended, models, error: data.error };
  } catch (err) {
    return { ...fallbackModelList(), error: err.message };
  }
}

export function getSelectedModel() {
  return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
}

export function setSelectedModel(modelId) {
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}

export async function checkLlmHealth() {
  try {
    const res = await fetch(`${PROXY_URL}/api/health`, { signal: AbortSignal.timeout(4000) });
    return res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fetchAgentPlan(context, model = getSelectedModel()) {
  const res = await fetch(`${PROXY_URL}/api/agent/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, context }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Plan request failed (${res.status})`);
  }
  return res.json();
}

export function buildPlanContext({
  memory,
  sessionAttempts,
  runNumber,
  lastFailureReason,
  lastHazardId,
  trigger,
}) {
  return {
    trigger,
    sessionAttempts,
    runNumber,
    lastFailureReason: lastFailureReason || memory.lastOutcome,
    lastHazardId: lastHazardId || memory.lastHazardId,
    navigation: "A* pathfinding avoids hazard cones; survival rules enforce suppress/retreat",
    memory: {
      runs: memory.runs,
      wins: memory.wins,
      deaths: memory.deaths,
      oxygenFailures: memory.oxygenFailures,
      hazards: memory.hazards,
    },
    mission: {
      sigilOrder: ["sun", "moon", "eye"],
      hazardIds: ["lightning-21", "laser-14", "laser-6", "lightning-0"],
    },
  };
}

export function buildLiveContext({
  memory,
  position,
  hazards,
  routeIndex,
  routeLength,
  activatedSigils,
  oxygen,
}) {
  return {
    position,
    oxygen,
    routeIndex,
    routeLength,
    activatedSigils,
    hazards,
    memory: { hazards: memory.hazards, lastHazardId: memory.lastHazardId },
  };
}

export async function fetchReactivePlan(liveContext, model = getSelectedModel()) {
  const res = await fetch(`${PROXY_URL}/api/agent/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, context: liveContext }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Reactive plan failed (${res.status})`);
  return res.json();
}

export const FALLBACK_PLAN = {
  model: "none",
  source: "fallback",
  reasoning: "LLM offline — memory-only navigation.",
  detourScale: 1.05,
  suppressMultiplier: 1.1,
  speedFactor: 0.82,
  observeExtraSeconds: 0.6,
  cautionHazards: [],
};

// Designed by Dang-Tue Hoang, AI Engineer
