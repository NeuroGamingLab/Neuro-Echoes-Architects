import { pickBestAction } from "./action-search.js";
import { evaluateSurvival, evaluateSpecterEvasion } from "./survival-rules.js";
import { evaluateSpecterLure } from "./specter-lure.js";
import { RL_ACTIONS } from "./rl-observation.js";
import { clampAgentPosition } from "./movement-bounds.js";
import { stageHasSpecters, stageHasDefenseMurals } from "./stage-combat.js";

function horizontalDist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

function applyVelocity(pos, vx, vz, delta) {
  pos.x += vx * delta;
  pos.z += vz * delta;
}

/** Map RL action id → velocity toward goal. */
export function actionToVelocity(actionId, pos, goal, hazards, speed) {
  const act = RL_ACTIONS[actionId] ?? "forward";
  if (!goal) return { vx: 0, vz: 0, label: "idle" };

  const dx = goal.x - pos.x;
  const dz = goal.z - pos.z;
  const dist = Math.hypot(dx, dz) || 1;
  const ux = dx / dist;
  const uz = dz / dist;

  switch (act) {
    case "left":
      return { vx: -speed * 0.55, vz: uz * speed * 0.5, label: "RL strafe left" };
    case "right":
      return { vx: speed * 0.55, vz: uz * speed * 0.5, label: "RL strafe right" };
    case "wait":
      return { vx: 0, vz: 0, label: "RL hold" };
    default:
      return { vx: ux * speed, vz: uz * speed, label: "RL advance" };
  }
}

/**
 * Navigation stack: survival → specter lure → specter evasion → RL action.
 */
export function resolveMovement({
  brain,
  pos,
  navTarget,
  goal,
  hazards,
  pursuers = [],
  speed,
  delta,
  onSuppress,
  stage = 1,
  world = null,
}) {
  const combatStage = stageHasDefenseMurals(stage);
  const survival = combatStage
    ? evaluateSurvival({ x: pos.x, z: pos.z }, hazards, navTarget, onSuppress)
    : null;

  if (survival) {
    if (survival.action === "retreat") {
      return {
        vx: Math.sign(survival.retreatX - pos.x) * speed * 0.8,
        vz: 0,
        label: survival.status,
        survival: true,
      };
    }
    if (survival.action === "detour") {
      return {
        vx: Math.sign(survival.detourX - pos.x) * speed * 0.7,
        vz: Math.sign(survival.detourZ - pos.z) * speed * 0.5,
        label: survival.status,
        survival: true,
      };
    }
    if (survival.action === "hold") {
      const gx = navTarget.x - pos.x;
      const gz = navTarget.z - pos.z;
      const gd = Math.hypot(gx, gz) || 1;
      return {
        vx: (gx / gd) * speed * 0.4,
        vz: (gz / gd) * speed * 0.4,
        label: survival.status,
        survival: true,
      };
    }
    return { vx: 0, vz: 0, label: survival.status, survival: true };
  }

  const specterStage = stageHasSpecters(stage);
  const lure = specterStage
    ? evaluateSpecterLure(
        { x: pos.x, z: pos.z },
        pursuers,
        hazards,
        speed,
        stage,
        world
      )
    : null;

  const specter = specterStage
    ? evaluateSpecterEvasion(
        { x: pos.x, z: pos.z },
        pursuers,
        navTarget,
        speed,
        stage,
        world
      )
    : null;

  const useRl = brain.policyMode === "rl" || brain.policyMode === "hybrid";
  let baseMove = null;

  if (useRl && brain.rlAction != null) {
    baseMove = actionToVelocity(brain.rlAction.action, pos, navTarget, hazards, speed);
    const goalDist = Math.hypot(navTarget.x - pos.x, navTarget.z - pos.z);
    if (
      brain.rlAction.actionName === "wait" &&
      goalDist > 2.5 &&
      Math.abs(baseMove.vx) < 0.01 &&
      Math.abs(baseMove.vz) < 0.01
    ) {
      baseMove = actionToVelocity(0, pos, navTarget, hazards, speed);
      baseMove.label = "RL advance (wait override)";
    }
    baseMove.rl = true;
    baseMove.reasoning = brain.rlAction.reasoning;
  } else if (useRl) {
    const search = pickBestAction(pos, navTarget, hazards, speed, delta, pursuers, stage, world);
    baseMove = { vx: search.vx, vz: search.vz, label: search.label, search: true };
  }

  const panicFlee = specter && lure && lure.nearestDist < 3.2;

  if (lure && !panicFlee) {
    if (lure.mode === "hold") {
      return {
        vx: lure.vx,
        vz: lure.vz,
        label: lure.status,
        lure: true,
      };
    }
    if (lure.mode === "blend" && specter) {
      const w = 0.35;
      return {
        vx: lure.vx * (1 - w) + specter.vx * w,
        vz: lure.vz * (1 - w) + specter.vz * w,
        label: lure.status,
        lure: true,
      };
    }
    if (lure.mode === "blend" && baseMove) {
      const w = 0.55;
      return {
        vx: lure.vx * w + baseMove.vx * (1 - w),
        vz: lure.vz * w + baseMove.vz * (1 - w),
        label: lure.status,
        lure: true,
        ...("reasoning" in baseMove ? { reasoning: baseMove.reasoning } : {}),
      };
    }
    return {
      vx: lure.vx,
      vz: lure.vz,
      label: lure.status,
      lure: true,
    };
  }

  if (specter) {
    if (specter.mode === "blend" && baseMove) {
      const w = 0.45;
      return {
        vx: specter.vx * w + baseMove.vx * (1 - w),
        vz: specter.vz * w + baseMove.vz * (1 - w),
        label: specter.status,
        specter: true,
        ...("reasoning" in baseMove ? { reasoning: baseMove.reasoning } : {}),
      };
    }
    return {
      vx: specter.vx,
      vz: specter.vz,
      label: specter.status,
      specter: true,
    };
  }

  if (baseMove) {
    return baseMove;
  }

  return null;
}

export function applyResolvedMovement(pos, move, delta, stage = 1, world = null) {
  if (!move) return false;
  applyVelocity(pos, move.vx, move.vz, delta);
  clampAgentPosition(pos, stage, world);
  return true;
}

export function distAfterMove(pos, target) {
  return horizontalDist(pos.x, pos.z, target.x, target.z);
}

// Designed by Dang-Tue Hoang, AI Engineer
