#!/usr/bin/env node
/**
 * Local proxy: browser game -> Ollama (localhost:11434)
 * Zero dependencies — Node 18+ built-in fetch/http.
 */
import http from "http";
import { URL } from "url";

const PORT = Number(process.env.OLLAMA_PROXY_PORT || 3001);
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";

const CHAT_MODELS = [
  "llama3.2:latest",
  "gemma:latest",
  "qwen3:8b",
  "deepseek-r1:latest",
  "gpt-oss:20b",
];

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, data) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function ollamaChat(model, messages, formatJson = true) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(formatJson ? { format: "json" } : {}),
      options: { temperature: 0.2, num_predict: 512 },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.message?.content ?? "";
}

function buildPlannerPrompt(context) {
  return `You are the navigation planner for an autonomous explorer in a sci-fi megastructure game.

GOAL: Route the agent from entry (z=28) through a corridor with defense murals, activate sigils in order (sun, moon, eye), reach the airlock (z=-17).

HAZARDS (automated murals — kill agent if caught in beam):
- lightning-21: LEFT wall at z≈21 — detour RIGHT (positive x, ~1.6+)
- laser-14: RIGHT wall at z≈14 — detour LEFT (negative x, ~-1.6)
- laser-6: LEFT wall at z≈6 — detour RIGHT
- lightning-0: RIGHT wall at z≈0 — detour LEFT

RULES:
- Prefer suppressing murals early if past deaths/near-misses at that zone
- Slower speed near hot zones; wider detours after deaths
- Sigil order MUST stay sun -> moon -> eye

RUN CONTEXT (JSON):
${JSON.stringify(context, null, 2)}

Respond with ONLY valid JSON (no markdown):
{
  "reasoning": "2-3 sentences explaining the plan for this run",
  "detourScale": 1.0,
  "suppressMultiplier": 1.0,
  "speedFactor": 0.85,
  "observeExtraSeconds": 0.5,
  "cautionHazards": ["lightning-21"]
}

Field ranges: detourScale 1.0-1.6, suppressMultiplier 1.0-1.5, speedFactor 0.45-1.0, observeExtraSeconds 0-3.0
cautionHazards: subset of ["lightning-21","laser-14","laser-6","lightning-0"]`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function validatePlan(raw, model) {
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("LLM did not return JSON");
      parsed = JSON.parse(match[0]);
    }
  }

  const caution = Array.isArray(parsed.cautionHazards)
    ? parsed.cautionHazards.filter((id) =>
        ["lightning-21", "laser-14", "laser-6", "lightning-0"].includes(id)
      )
    : [];

  return {
    model,
    source: "ollama",
    reasoning: String(parsed.reasoning || "Proceed with caution through the corridor.").slice(0, 500),
    detourScale: clamp(Number(parsed.detourScale) || 1.05, 1.0, 1.6),
    suppressMultiplier: clamp(Number(parsed.suppressMultiplier) || 1.05, 1.0, 1.5),
    speedFactor: clamp(Number(parsed.speedFactor) || 0.85, 0.45, 1.0),
    observeExtraSeconds: clamp(Number(parsed.observeExtraSeconds) || 0.5, 0, 3),
    cautionHazards: caution,
  };
}

function fallbackPlan(model, reason) {
  return {
    model: model || DEFAULT_MODEL,
    source: "fallback",
    reasoning: reason || "Ollama unavailable — using memory-only policy.",
    detourScale: 1.1,
    suppressMultiplier: 1.15,
    speedFactor: 0.8,
    observeExtraSeconds: 0.8,
    cautionHazards: ["lightning-21", "laser-14", "laser-6", "lightning-0"],
  };
}

async function handlePlan(body) {
  const model = body.model || DEFAULT_MODEL;
  const context = body.context || {};
  try {
    const content = await ollamaChat(
      model,
      [
        {
          role: "system",
          content:
            "You output only valid JSON for a game navigation planner. Be concise and safety-focused.",
        },
        { role: "user", content: buildPlannerPrompt(context) },
      ],
      true
    );
    return validatePlan(content, model);
  } catch (err) {
    console.error("[plan error]", err.message);
    return fallbackPlan(model, `Fallback: ${err.message}`);
  }
}

function buildReactPrompt(context) {
  return `Live game state — adjust navigation policy. A* pathfinding handles geometry; you tune caution.

STATE:
${JSON.stringify(context, null, 2)}

Output ONLY JSON:
{
  "reasoning": "one short sentence",
  "detourScale": 1.0,
  "suppressMultiplier": 1.0,
  "speedFactor": 0.85,
  "cautionHazards": []
}`;
}

async function handleReact(body) {
  const model = body.model || DEFAULT_MODEL;
  try {
    const content = await ollamaChat(
      model,
      [
        { role: "system", content: "Output only JSON. Be brief." },
        { role: "user", content: buildReactPrompt(body.context || {}) },
      ],
      true
    );
    return validatePlan(content, model);
  } catch (err) {
    return fallbackPlan(model, "Reactive fallback");
  }
}

async function handleHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error(`Ollama tags ${res.status}`);
    const data = await res.json();
    const names = (data.models || []).map((m) => m.name);
    return { ok: true, ollama: OLLAMA_URL, models: names };
  } catch (err) {
    return { ok: false, ollama: OLLAMA_URL, error: err.message };
  }
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      const health = await handleHealth();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/models") {
      const health = await handleHealth();
      const installed = new Set(health.models || []);
      sendJson(res, health.ok ? 200 : 503, {
        ok: health.ok,
        error: health.error,
        ollama: OLLAMA_URL,
        recommended: DEFAULT_MODEL,
        installed: health.models || [],
        chatModels: CHAT_MODELS.map((name) => ({
          name,
          installed: installed.has(name),
        })),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/agent/plan") {
      const body = await readBody(req);
      const plan = await handlePlan(body);
      sendJson(res, 200, plan);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/agent/react") {
      const body = await readBody(req);
      const plan = await handleReact(body);
      sendJson(res, 200, plan);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Ollama proxy http://127.0.0.1:${PORT} -> ${OLLAMA_URL}`);
  console.log(`Default model: ${DEFAULT_MODEL}`);
});
