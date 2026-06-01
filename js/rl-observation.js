/** Shared observation vector for RL server + training (48 floats). */

import { ACTIVE_SPECTER_COUNT } from "./adaptive-pursuers.js";
import { getMovementBounds } from "./movement-bounds.js";
import { hazardDefFrom, hazardMuzzle, isInHazardCone } from "./hazard-geometry.js";

export const OBS_SIZE = 48;
export const RL_ACTIONS = ["forward", "left", "right", "wait"];

const HAZARD_IDS = ["lightning-21", "laser-14", "laser-6", "lightning-0"];
const HAZARD_DEFS = [
  { id: "lightning-21", z: 21, side: "left", range: 14 },
  { id: "laser-14", z: 14, side: "right", range: 16 },
  { id: "laser-6", z: 6, side: "left", range: 15 },
  { id: "lightning-0", z: 0, side: "right", range: 14 },
];

const SIGIL_ORDER = ["sun", "moon", "eye"];

function norm(v, min, max) {
  return (v - min) / (max - min);
}

function hazardDef(h) {
  return hazardDefFrom(h);
}

function inCone(px, pz, def, hazard) {
  if (hazard?.state === "disabled" || hazard?.suppressMode === "agent-only") return 0;
  return isInHazardCone(px, pz, def, 0) ? 1 : 0;
}

function stateScalar(state) {
  const map = { idle: 0, warning: 0.33, firing: 0.66, cooldown: 0.85, disabled: 1 };
  return map[state] ?? 0;
}

export function buildObservation({
  position,
  yaw = 0,
  oxygen = 100,
  routeIndex = 0,
  routeLength = 1,
  goal = null,
  activatedSigils = [],
  hazards = [],
  pursuers = [],
  stage = 1,
}) {
  const obs = new Float32Array(OBS_SIZE);
  const px = position.x;
  const pz = position.z;
  const bounds = getMovementBounds(stage);

  obs[0] = norm(px, bounds.xMin, bounds.xMax);
  obs[1] = norm(pz, bounds.zMin, bounds.zMax);
  obs[2] = Math.sin(yaw);
  obs[3] = Math.cos(yaw);
  obs[4] = oxygen / 100;
  obs[5] = routeLength > 0 ? routeIndex / routeLength : 0;

  for (let i = 0; i < 3; i++) {
    obs[6 + i] = activatedSigils.includes(SIGIL_ORDER[i]) ? 1 : 0;
  }
  const nextIdx = SIGIL_ORDER.findIndex((s) => !activatedSigils.includes(s));
  obs[9] = nextIdx < 0 ? 1 : nextIdx / 3;

  if (goal) {
    const gx = goal.x ?? 0;
    const gz = goal.z ?? 0;
    const dx = gx - px;
    const dz = gz - pz;
    const dist = Math.hypot(dx, dz) || 1;
    obs[10] = dx / dist;
    obs[11] = dz / dist;
    obs[12] = Math.min(dist / 40, 1);
  }

  obs[13] = bounds.corridorX != null && Math.abs(px) <= bounds.corridorX ? 1 : 0;
  obs[14] =
    bounds.corridorX != null && Math.abs(px) <= bounds.xMax && pz < (bounds.corridorZMin ?? 2)
      ? 1
      : 0;

  let o = 15;
  for (let i = 0; i < 4; i++) {
    const h =
      hazards[i] ||
      hazards.find((x) => x.id === HAZARD_IDS[i]) ||
      { id: HAZARD_IDS[i], state: "idle", side: "left", z: 0 };
    const def = hazardDef(h);
    const m = hazardMuzzle(def);
    obs[o++] = stateScalar(h.state);
    obs[o++] = Math.min(Math.hypot(px - m.x, pz - def.z) / def.range, 1);
    obs[o++] = inCone(px, pz, def, h);
    obs[o++] = def.side === "left" ? 1 : 0;
    obs[o++] = h.state === "warning" || h.state === "firing" ? 1 : 0;
    obs[o++] = h.state === "disabled" || h.suppressMode === "agent-only" ? 1 : 0;
  }

  let minPursuer = 1;
  for (let i = 0; i < 4; i++) {
    const p = pursuers[i];
    const d = p ? Math.min(Math.hypot(px - p.x, pz - p.z) / 30, 1) : 1;
    obs[39 + i] = d;
    if (p) minPursuer = Math.min(minPursuer, d);
  }
  obs[43] = minPursuer;
  obs[44] = stage / 14;
  obs[45] = pursuers.filter(Boolean).length / Math.max(ACTIVE_SPECTER_COUNT, 1);
  obs[46] = 0;
  obs[47] = 0;

  return Array.from(obs);
}

export function observationMeta() {
  return { size: OBS_SIZE, actions: RL_ACTIONS, hazardIds: HAZARD_IDS };
}

// Designed by Dang-Tue Hoang, AI Engineer
