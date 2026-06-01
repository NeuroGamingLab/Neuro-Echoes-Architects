import { isInDangerZone, segmentCrossesDanger } from "./hazard-geometry.js";
import { getMovementBounds } from "./movement-bounds.js";
import { scoreSpecterLurePosition } from "./specter-lure.js";

const ACTIONS = [
  { id: "forward", label: "advance" },
  { id: "left", label: "strafe left", dx: -0.5, dz: 0 },
  { id: "right", label: "strafe right", dx: 0.5, dz: 0 },
  { id: "wait", label: "hold position", dx: 0, dz: 0 },
];

function clampPos(x, z, stage = 1, world = null) {
  const bounds = getMovementBounds(stage, world);
  let cx = Math.max(bounds.xMin, Math.min(bounds.xMax, x));
  let cz = Math.max(bounds.zMin, Math.min(bounds.zMax, z));
  if (bounds.corridorX != null && cz >= bounds.corridorZMin && Math.abs(cx) > bounds.corridorX) {
    cx = Math.sign(cx) * bounds.corridorX;
  }
  return { x: cx, z: cz };
}

function scorePosition(x, z, goal, hazards, pursuers = [], agentPos = null) {
  if (!goal) return 0;
  let score = -Math.hypot(x - goal.x, z - goal.z);

  if (agentPos && pursuers.length) {
    score += scoreSpecterLurePosition(x, z, agentPos, hazards, pursuers);
  }

  for (const p of pursuers) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < 2) score -= 100;
    else if (d < 5) score -= 55;
    else if (d < 8) score -= 25;
  }

  for (const h of hazards) {
    if (h.suppressMode === "agent-only") continue;
    if (h.state === "disabled" && h.suppressMode !== "agent-only") continue;
    if (isInDangerZone(x, z, h, 0.4)) score -= 80;
    if (h.state === "warning") score -= 25;
    if (h.state === "firing") score -= 120;
  }

  const cross = segmentCrossesDanger(x, z, goal.x, goal.z, hazards, 8);
  if (cross && cross.suppressMode !== "agent-only") score -= 40;

  return score;
}

/**
 * Lightweight rollout: pick move with best score after 1-step lookahead.
 */
export function pickBestAction(pos, goal, hazards, speed, delta, pursuers = [], stage = 1, world = null) {
  if (!goal) return { vx: 0, vz: 0, label: "idle" };

  const dx = goal.x - pos.x;
  const dz = goal.z - pos.z;
  const dist = Math.hypot(dx, dz) || 1;
  const ux = dx / dist;
  const uz = dz / dist;

  let best = { vx: ux * speed, vz: uz * speed, score: -Infinity, label: "forward" };

  for (const act of ACTIONS) {
    let nx = pos.x;
    let nz = pos.z;
    if (act.id === "forward") {
      nx += ux * speed * delta * 3;
      nz += uz * speed * delta * 3;
    } else if (act.id === "wait") {
      nx = pos.x;
      nz = pos.z;
    } else {
      nx += (act.dx || 0) * speed * delta * 4;
      nz += (act.dz || 0) * speed * delta * 4;
    }
    const c = clampPos(nx, nz, stage, world);
    const score = scorePosition(c.x, c.z, goal, hazards, pursuers, pos);
    if (score > best.score) {
      best = {
        vx: act.id === "forward" ? ux * speed : (act.dx || 0) * speed * 0.6,
        vz: act.id === "forward" ? uz * speed : (act.dz || 0) * speed * 0.6,
        score,
        label: act.label,
      };
    }
  }

  return best;
}

// Designed by Dang-Tue Hoang, AI Engineer
