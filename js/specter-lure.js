import {
  hazardDefFrom,
  isInHazardCone,
  safeLaneX,
} from "./hazard-geometry.js";
import { repelFromBounds } from "./movement-bounds.js";

function hazardDef(hazard) {
  return hazardDefFrom(hazard);
}

function canMuralPurgeSpecters(hazard) {
  return hazard && hazard.suppressMode !== "full";
}

function hazardLabel(def) {
  return def.type === "lightning" ? "Storm Eye" : "Beam Lens";
}

function nearestPursuerDist(pos, pursuers) {
  let nearest = Infinity;
  for (const p of pursuers) {
    nearest = Math.min(nearest, Math.hypot(pos.x - p.x, pos.z - p.z));
  }
  return nearest;
}

function pursuerBehindAgent(pos, pursuers) {
  return pursuers.some((p) => p.z > pos.z - 1.8);
}

/** Waypoint at the mural line — agent pauses here so the specter enters the cone. */
export function lureWaypointForHazard(def) {
  const laneX = safeLaneX(def);
  return {
    x: laneX,
    z: def.z,
    baitX: def.side === "left" ? laneX - 1.1 : laneX + 1.1,
  };
}

/** Best mural trap to kite specters toward (Stage 1 corridor). */
export function findSpecterLureTarget(pos, hazards, pursuers) {
  if (!pursuers?.length) return null;

  const nearest = nearestPursuerDist(pos, pursuers);
  if (nearest > 12 || nearest < 1.4) return null;
  if (!pursuerBehindAgent(pos, pursuers)) return null;

  let best = null;

  for (const h of hazards) {
    if (!canMuralPurgeSpecters(h)) continue;

    const def = hazardDef(h);
    const lure = lureWaypointForHazard(def);
    const lureDist = Math.hypot(pos.x - lure.x, pos.z - lure.z);
    const hazardAlongRoute = lure.z < pos.z + 4;
    const hazardReach = lureDist < 22;

    if (!hazardReach && !(hazardAlongRoute && lureDist < 28)) continue;

    let spectersInCone = 0;
    let spectersNearCone = 0;
    for (const p of pursuers) {
      if (isInHazardCone(p.x, p.z, def, 0.15)) spectersInCone += 1;
      if (isInHazardCone(p.x, p.z, def, 0.85)) spectersNearCone += 1;
    }

    const muralReady =
      h.state === "idle" ||
      h.state === "warning" ||
      h.state === "firing" ||
      (h.state === "disabled" && h.suppressMode === "agent-only");

    if (!muralReady) continue;

    let score = 0;
    score += hazardAlongRoute ? 14 : 4;
    score += Math.max(0, 12 - lureDist * 0.55);
    score += spectersInCone * 18;
    score += spectersNearCone * 8;
    score += nearest < 7 ? 6 : 0;
    if (h.state === "warning" || h.state === "firing") score += 10;

    if (!best || score > best.score) {
      best = { hazard: h, def, lure, score, nearest };
    }
  }

  return best;
}

/**
 * When chased, kite specters through a nearby defense mural cone.
 * Agent stays on the safe lane (immune during run-start suppression).
 */
export function evaluateSpecterLure(pos, pursuers, hazards, speed, stage = 1, world = null) {
  const target = findSpecterLureTarget(pos, hazards, pursuers);
  if (!target) return null;

  const { lure, def, nearest, hazard } = target;

  const dx = lure.x - pos.x;
  const dz = lure.z - pos.z;
  const dist = Math.hypot(dx, dz) || 1;

  const specterInCone = pursuers.some((p) => isInHazardCone(p.x, p.z, def, 0.85));
  const specterNearTrap = pursuers.some(
    (p) => isInHazardCone(p.x, p.z, def, 1.2) && Math.abs(p.z - def.z) < 7
  );
  const muralEngaging =
    hazard &&
    (hazard.state === "warning" || hazard.state === "firing") &&
    hazard.beamTarget?.type === "specter";

  // Hold on the safe lane while the mural charges — don't sprint past the trap.
  if ((muralEngaging && specterNearTrap) || (specterInCone && nearest < 8 && dist < 3.5)) {
    const baitTarget = lure.baitX ?? (def.side === "left" ? 0.9 : -0.9);
    const repelled = repelFromBounds(pos.x, pos.z, (baitTarget - pos.x) * 0.35, -0.2, stage, world);
    return {
      action: "lure",
      mode: "hold",
      nearestDist: nearest,
      vx: repelled.vx * speed * 0.22,
      vz: repelled.vz * speed * 0.12,
      status: `Holding at ${hazardLabel(def)} — mural engaging specter`,
      lure,
    };
  }

  let dirX = dx / dist;
  let dirZ = dz / dist;

  // Drift toward corridor center so the specter trails through the beam cone.
  const baitX = def.side === "left" ? -0.55 : 0.55;
  dirX += baitX;
  const mag = Math.hypot(dirX, dirZ) || 1;
  dirX /= mag;
  dirZ /= mag;

  const urgency = muralEngaging ? 0.55 : nearest < 4 ? 0.82 : nearest < 7 ? 0.92 : 1;
  const repelled = repelFromBounds(pos.x, pos.z, dirX, dirZ, stage, world);

  return {
    action: "lure",
    mode: nearest < 3.2 ? "blend" : "full",
    nearestDist: nearest,
    vx: repelled.vx * speed * urgency,
    vz: repelled.vz * speed * urgency,
    status: `Luring specter → ${hazardLabel(def)} (z${def.z})`,
    lure,
  };
}

export function scoreSpecterLurePosition(x, z, pos, hazards, pursuers) {
  if (!pursuers?.length) return 0;
  const nearest = nearestPursuerDist(pos, pursuers);
  if (nearest > 12) return 0;

  let bonus = 0;
  for (const h of hazards) {
    if (!canMuralPurgeSpecters(h)) continue;
    const def = hazardDef(h);
    const lure = lureWaypointForHazard(def);
    const toLure = Math.hypot(x - lure.x, z - lure.z);
    if (toLure < 2.5) bonus += 40;
    else if (toLure < 7) bonus += 22;
    else if (toLure < 14) bonus += 10;

    for (const p of pursuers) {
      if (isInHazardCone(p.x, p.z, def, 0.2)) bonus += 28;
      else if (isInHazardCone(p.x, p.z, def, 0.9)) bonus += 12;
    }
  }
  return bonus;
}

// Designed by Dang-Tue Hoang, AI Engineer
