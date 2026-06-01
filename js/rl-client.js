const RL_URL = "http://127.0.0.1:3002";
const POLICY_STORAGE_KEY = "echoes-policy-mode";

export const POLICY_MODES = [
  { id: "hybrid", label: "Hybrid — RL navigation + Ollama strategy" },
  { id: "rl", label: "Pure RL — PPO / rule policy (Neuro-Adaptive)" },
  { id: "llm", label: "LLM only — scripted route + Ollama" },
];

export function getPolicyMode() {
  return localStorage.getItem(POLICY_STORAGE_KEY) || "hybrid";
}

export function setPolicyMode(mode) {
  localStorage.setItem(POLICY_STORAGE_KEY, mode);
}

export async function checkRlHealth() {
  try {
    const res = await fetch(`${RL_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fetchRlAction(observation, context = {}) {
  const res = await fetch(`${RL_URL}/api/act`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observation, context }),
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `RL act failed (${res.status})`);
  }
  return res.json();
}

export async function fetchPursuerUpdate(context) {
  const res = await fetch(`${RL_URL}/api/pursuers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`Pursuers failed (${res.status})`);
  return res.json();
}

// Designed by Dang-Tue Hoang, AI Engineer
