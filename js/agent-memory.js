const STORAGE_KEY = "echoes-architects-agent-memory";

const HAZARD_IDS = ["lightning-21", "laser-14", "laser-6", "lightning-0"];

function defaultHazardStats() {
  return { deaths: 0, nearMisses: 0, suppressions: 0 };
}

export function createDefaultMemory() {
  const hazards = {};
  for (const id of HAZARD_IDS) hazards[id] = defaultHazardStats();
  return {
    version: 1,
    runs: 0,
    wins: 0,
    deaths: 0,
    oxygenFailures: 0,
    hazards,
    lastOutcome: null,
    lastHazardId: null,
  };
}

export function loadMemory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultMemory();
    const parsed = JSON.parse(raw);
    const mem = { ...createDefaultMemory(), ...parsed, hazards: { ...createDefaultMemory().hazards } };
    for (const id of HAZARD_IDS) {
      mem.hazards[id] = { ...defaultHazardStats(), ...(parsed.hazards?.[id] || {}) };
    }
    return mem;
  } catch {
    return createDefaultMemory();
  }
}

export function saveMemory(memory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function resetMemory() {
  localStorage.removeItem(STORAGE_KEY);
  return createDefaultMemory();
}

export function beginRun(memory) {
  memory.runs += 1;
  saveMemory(memory);
}

export function recordDeath(memory, hazardId = null) {
  memory.deaths += 1;
  memory.lastOutcome = "death";
  memory.lastHazardId = hazardId;
  if (hazardId && memory.hazards[hazardId]) {
    memory.hazards[hazardId].deaths += 1;
  }
  saveMemory(memory);
}

export function recordNearMiss(memory, hazardId) {
  if (!hazardId || !memory.hazards[hazardId]) return;
  memory.hazards[hazardId].nearMisses += 1;
  saveMemory(memory);
}

export function recordSuppression(memory, hazardId) {
  if (!hazardId || !memory.hazards[hazardId]) return;
  memory.hazards[hazardId].suppressions += 1;
  saveMemory(memory);
}

export function recordWin(memory) {
  memory.wins += 1;
  memory.lastOutcome = "win";
  memory.lastHazardId = null;
  saveMemory(memory);
}

export function recordOxygenFailure(memory) {
  memory.oxygenFailures += 1;
  memory.lastOutcome = "oxygen";
  memory.lastHazardId = null;
  saveMemory(memory);
}

function hazardRisk(memory, hazardId) {
  const h = memory.hazards[hazardId];
  if (!h) return 0;
  return h.deaths * 3 + h.nearMisses * 1.2 + Math.max(0, h.suppressions - h.deaths) * 0.15;
}

export function getSuppressRadius(hazardId, memory, llmPolicy = null) {
  const h = memory.hazards[hazardId];
  if (!h) return 3.4;
  const base = 3.4;
  let learned = base + h.deaths * 1.1 + h.nearMisses * 0.45;
  if (llmPolicy?.cautionHazards?.includes(hazardId)) learned += 0.6;
  if (llmPolicy?.suppressMultiplier) learned *= llmPolicy.suppressMultiplier;
  return Math.min(learned, 8);
}

export function getDetourOffset(hazardId, baseOffset, memory) {
  const h = memory.hazards[hazardId];
  if (!h) return baseOffset;
  const extra = Math.min(h.deaths * 0.22 + h.nearMisses * 0.08, 0.85);
  const sign = baseOffset >= 0 ? 1 : -1;
  return baseOffset + sign * extra;
}

export function getSpeedNearHazard(hazardId, memory) {
  const risk = hazardRisk(memory, hazardId);
  if (risk <= 0) return 1;
  return Math.max(0.55, 1 - Math.min(risk * 0.07, 0.42));
}

export function getLearnedWaypoints(baseWaypoints, memory, llmPolicy = null) {
  return baseWaypoints.map((wp) => {
    if (!wp.hazardId || wp.baseX == null) return { ...wp };
    let x = getDetourOffset(wp.hazardId, wp.baseX, memory);
    if (llmPolicy?.detourScale) {
      const sign = x >= 0 ? 1 : -1;
      const offset = Math.abs(x - wp.baseX);
      x = wp.baseX + sign * offset * llmPolicy.detourScale;
      if (llmPolicy.cautionHazards?.includes(wp.hazardId)) {
        x += sign * 0.25;
      }
      x = Math.max(-2.5, Math.min(2.5, x));
    }
    return { ...wp, x };
  });
}

export function computeConfidence(memory, waypointProgress = 0) {
  const winRate = memory.runs > 0 ? memory.wins / memory.runs : 0;
  const totalNear = Object.values(memory.hazards).reduce((s, h) => s + h.nearMisses, 0);
  const totalDeaths = Object.values(memory.hazards).reduce((s, h) => s + h.deaths, 0);
  const familiarity = memory.runs > 0 ? Math.min(memory.runs * 0.04, 0.22) : 0;
  const caution = totalDeaths > 0 ? Math.min(totalDeaths * 0.03, 0.12) : 0;
  const base = 0.55 + winRate * 0.28 + familiarity - caution * 0.5;
  return Math.min(0.96, base + waypointProgress * 0.12);
}

export function getPolicyLabel(memory) {
  const hot = HAZARD_IDS.filter((id) => hazardRisk(memory, id) > 2);
  if (memory.runs <= 1) return "Waypoint + hazard avoidance";
  if (hot.length === 0) return "Learned route (stable corridors)";
  return `Learned route (${hot.length} hot zone${hot.length > 1 ? "s" : ""})`;
}

export function getMemorySummary(memory) {
  const hotZones = HAZARD_IDS.filter((id) => memory.hazards[id].deaths > 0 || memory.hazards[id].nearMisses > 0);
  return {
    runs: memory.runs,
    wins: memory.wins,
    deaths: memory.deaths,
    hotZones: hotZones.length,
    lastOutcome: memory.lastOutcome,
    lastHazardId: memory.lastHazardId,
    isExperienced: memory.runs > 1,
  };
}

export function getStartScreenLearningText(memory) {
  const s = getMemorySummary(memory);
  if (s.runs === 0) {
    return "No prior runs stored. Hazard memory builds across runs; RL weights require training the PPO model separately.";
  }
  const winPct = s.runs > 0 ? Math.round((s.wins / s.runs) * 100) : 0;
  let text = `Memory loaded: ${s.runs} run${s.runs === 1 ? "" : "s"}, ${s.wins} success${s.wins === 1 ? "" : "es"} (${winPct}% win rate).`;
  text += " Run counter tracks hazard stats — not neural policy weights.";
  if (s.hotZones > 0) {
    text += ` ${s.hotZones} hazard zone${s.hotZones === 1 ? "" : "s"} flagged from past failures — wider detours and earlier suppression enabled.`;
  } else if (s.wins > 0) {
    text += " Prior successful routes inform confidence and pacing.";
  }
  if (s.lastOutcome === "death" && s.lastHazardId) {
    text += ` Last run ended at ${formatHazardName(s.lastHazardId)}.`;
  }
  return text;
}

export function formatHazardName(hazardId) {
  if (!hazardId) return "unknown hazard";
  const [type, z] = hazardId.split("-");
  return type === "lightning" ? `Storm Eye (z${z})` : `Beam Lens (z${z})`;
}

export function getHotZoneStatus(memory, hazardId) {
  const h = memory.hazards[hazardId];
  if (!h) return "";
  if (h.deaths >= 2) return "high risk (memorized deaths)";
  if (h.deaths === 1) return "elevated risk (1 death logged)";
  if (h.nearMisses >= 2) return "caution (near misses logged)";
  return "";
}

export { HAZARD_IDS };

// Designed by Dang-Tue Hoang, AI Engineer
