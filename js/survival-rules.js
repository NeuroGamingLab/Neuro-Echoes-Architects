import {
  isInDangerZone,
  safeLaneX,
  hazardDefFrom,
  segmentCrossesDanger,
} from "./hazard-geometry.js";
import { repelFromBounds } from "./movement-bounds.js";

function isSpecterDefense(hazard) {
  if (!hazard) return false;
  if (hazard.beamTarget?.type === "specter") return true;
  return hazard.suppressMode === "agent-only" && hazard.state !== "idle";
}

/** Agent-only / specter-targeting murals must not trigger agent survival suppress. */
function threatensAgent(hazard, px, pz, margin = 0.25) {
  if (isSpecterDefense(hazard)) return false;
  if (hazard.suppressMode === "agent-only") return false;
  return isInDangerZone(px, pz, hazard, margin);
}

/**
 * Mandatory survival layer — overrides navigation when traps threaten.
 * Returns highest-priority action or null to proceed.
 */
export function evaluateSurvival(pos, hazards, goal, onSuppress) {
  const px = pos.x;
  const pz = pos.z;

  for (const h of hazards) {
    if (h.state === "firing" && threatensAgent(h, px, pz, 0.5)) {
      const def = hazardDefFrom(h);
      const safeX = safeLaneX(def);
      return {
        action: "retreat",
        hazard: h,
        status: `EMERGENCY: in beam — retreating from ${h.id}`,
        retreatX: safeX,
      };
    }
  }

  for (const h of hazards) {
    if (isSpecterDefense(h)) continue;
    if ((h.state === "warning" || h.state === "firing") && threatensAgent(h, px, pz, 0.25)) {
      onSuppress?.(h);
      return {
        action: "hold",
        hazard: h,
        status: `SURVIVAL: suppressing ${h.id} (in danger zone)`,
        timer: 0.8,
      };
    }
  }

  for (const h of hazards) {
    if (isSpecterDefense(h)) continue;
    if (h.state === "warning" || h.state === "idle") {
      const dist = Math.hypot(px - h.mesh.position.x, pz - h.mesh.position.z);
      if (dist < 6 && h.state === "warning") {
        onSuppress?.(h);
        return {
          action: "hold",
          hazard: h,
          status: `SURVIVAL: pre-suppress ${h.id} (charging)`,
          timer: 0.5,
        };
      }
    }
  }

  if (goal) {
    const goalDist = Math.hypot(goal.x - px, goal.z - pz);
    const approachingObjective = goal.action && goalDist < 12;
    if (!approachingObjective) {
      const cross = segmentCrossesDanger(px, pz, goal.x, goal.z, hazards, 16);
      if (cross && cross.state !== "disabled" && !isSpecterDefense(cross)) {
        const def = hazardDefFrom(cross);
        const safeX = safeLaneX(def);
        if (Math.abs(px - safeX) > 0.8) {
          onSuppress?.(cross);
          return {
            action: "detour",
            hazard: cross,
            status: `SURVIVAL: steering to safe lane (${cross.id})`,
            detourX: safeX,
            detourZ: pz,
          };
        }
      }
    }
  }

  return null;
}

/** Flee alpha-pack specters when they get close — overrides goal-seeking. */
export function evaluateSpecterEvasion(pos, pursuers, goal, speed, stage = 1, world = null) {
  if (!pursuers?.length) return null;

  let nearestDist = Infinity;
  let fleeX = 0;
  let fleeZ = 0;
  let threatCount = 0;

  for (const p of pursuers) {
    const dx = pos.x - p.x;
    const dz = pos.z - p.z;
    const d = Math.hypot(dx, dz);
    nearestDist = Math.min(nearestDist, d);
    if (d < 8 && d > 0.05) {
      fleeX += dx / d;
      fleeZ += dz / d;
      threatCount += 1;
    }
  }

  if (!threatCount || nearestDist > 8) return null;

  const mag = Math.hypot(fleeX, fleeZ) || 1;
  fleeX /= mag;
  fleeZ /= mag;

  let vx = fleeX;
  let vz = fleeZ;

  if (goal) {
    const gx = goal.x - pos.x;
    const gz = goal.z - pos.z;
    const gd = Math.hypot(gx, gz) || 1;

    // Mission leads south — never flee north into the entry wall.
    if (gz < -0.5 && pos.z > goal.z) {
      if (vz > 0) vz *= 0.15;
      const south = Math.min(-gz / gd, 0.65);
      vz += south;
      const blendMag = Math.hypot(vx, vz) || 1;
      vx /= blendMag;
      vz /= blendMag;
    }

    if (nearestDist > 3.5) {
      const fleeWeight = nearestDist < 5 ? 0.82 : nearestDist < 6.5 ? 0.55 : 0.35;
      vx = fleeX * fleeWeight + (gx / gd) * (1 - fleeWeight);
      vz = fleeZ * fleeWeight + (gz / gd) * (1 - fleeWeight);
      const blendMag = Math.hypot(vx, vz) || 1;
      vx /= blendMag;
      vz /= blendMag;
    }
  }

  const urgency =
    nearestDist < 2.5 ? 1 : nearestDist < 5 ? 0.95 : nearestDist < 6.5 ? 0.75 : 0.55;

  const repelled = repelFromBounds(pos.x, pos.z, vx, vz, stage, world);
  const mode = nearestDist < 5 ? "full" : "blend";

  return {
    action: "flee",
    mode,
    vx: repelled.vx * speed * urgency,
    vz: repelled.vz * speed * urgency,
    status:
      nearestDist < 3
        ? `SPECTER EVADE — ghost ${nearestDist.toFixed(1)}m!`
        : `Steering from specter (${nearestDist.toFixed(1)}m)`,
  };
}

// Designed by Dang-Tue Hoang, AI Engineer
