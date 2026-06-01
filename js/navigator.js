import * as THREE from "three";
import { computeConfidence } from "./agent-memory.js";
import { buildRouteForStage } from "./stages.js";
import { recordNearMiss } from "./agent-memory.js";
import { resolveMovement, applyResolvedMovement, distAfterMove } from "./rl-navigation.js";
import { getPolicyMode } from "./rl-client.js";
import { clampAgentPosition } from "./movement-bounds.js";

/** Reference walk speed (Stage 1) — all stages use the same value. */
export const AGENT_SPEED = 3.6;
export const ARRIVE_DIST = 0.85;
export const INTERACT_DIST = 2.4;
export const ACT_PAUSE = 0.4;
export const OBSERVE_PAUSE = 0.1;

export function getAgentSpeed(_stage) {
  return AGENT_SPEED;
}

function horizontalDist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

function findInteractable(world, type, id, near = null) {
  if (type === "sigil") {
    return world.interactables.find((item) => item.type === "sigil" && item.id === id);
  }
  if (type === "beacon") {
    return world.interactables.find((item) => item.type === "beacon" && item.id === id);
  }
  if (type === "ampule") {
    return world.interactables.find((item) => item.type === "ampule" && item.id === id);
  }
  if (type === "console") {
    return world.interactables.find((item) => item.type === "console" && item.id === id);
  }
  if (type === "relic") {
    return world.interactables.find((item) => item.type === "relic" && item.id === id);
  }
  if (type === "terminal") {
    const terminals = world.interactables.filter((item) => item.type === "terminal");
    if (id) return terminals.find((item) => item.id === id);
    if (near) {
      let best = null;
      let bestDist = Infinity;
      for (const item of terminals) {
        const d = horizontalDist(near.x, near.z, item.mesh.position.x, item.mesh.position.z);
        if (d < bestDist) {
          bestDist = d;
          best = item;
        }
      }
      return best;
    }
    return terminals[0];
  }
  return world.interactables.find((item) => item.type === type);
}

function interactablePosition(item, fallback) {
  if (item?.mesh?.position) {
    return { x: item.mesh.position.x, y: item.mesh.position.y, z: item.mesh.position.z };
  }
  return { x: fallback.x, y: fallback.y ?? 0, z: fallback.z };
}

function navGoalPosition(goal, world) {
  if (goal.action) {
    const item = actionTarget(goal, world);
    return interactablePosition(item, goal);
  }
  return { x: goal.x, y: goal.y ?? 0, z: goal.z };
}

function canInteractAt(pos, item) {
  if (!item) return false;
  const target = interactablePosition(item, { x: 0, z: 0 });
  const dist = horizontalDist(pos.x, pos.z, target.x, target.z);
  const maxDist = Math.min(item.radius ?? INTERACT_DIST, INTERACT_DIST);
  return dist <= maxDist;
}

function actionTarget(goal, world) {
  if (!goal?.action) return null;
  if (goal.action === "sigil") return findInteractable(world, "sigil", goal.id);
  if (goal.action === "beacon") return findInteractable(world, "beacon", goal.id);
  if (goal.action === "ampule") return findInteractable(world, "ampule", goal.id);
  if (goal.action === "console") return findInteractable(world, "console", goal.id);
  if (goal.action === "relic") return findInteractable(world, "relic", goal.id);
  if (goal.action === "terminal") {
    return findInteractable(world, "terminal", goal.id, { x: goal.x, z: goal.z });
  }
  return findInteractable(world, goal.action);
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function runWaypointAction(goal, world, onInteract, pos) {
  if (!goal?.action || !onInteract) return false;
  const item = actionTarget(goal, world);
  if (!item || !canInteractAt(pos, item)) return false;
  onInteract(item);
  return true;
}

function nudgeTowardTarget(pos, goal, world) {
  const item = actionTarget(goal, world);
  const target = interactablePosition(item, goal);
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  if (dist <= ARRIVE_DIST) return false;
  const step = Math.min(dist, 1.2);
  pos.x += (dx / dist) * step;
  pos.z += (dz / dist) * step;
  return true;
}

function snapToTarget(pos, goal, world) {
  const item = actionTarget(goal, world);
  const target = interactablePosition(item, goal);
  pos.x = target.x;
  pos.z = target.z;
}

export function rebuildRoute(brain, agentPos, _hazards, activatedItems, stage = brain.stage ?? 1) {
  brain.stage = stage;
  brain.route = buildRouteForStage(stage, activatedItems);
  brain.routeIndex = 0;
  for (let i = 0; i < brain.route.length; i++) {
    const d = horizontalDist(agentPos.x, agentPos.z, brain.route[i].x, brain.route[i].z);
    if (d < ARRIVE_DIST * 2) {
      brain.routeIndex = Math.min(i + 1, brain.route.length - 1);
    } else {
      break;
    }
  }
  brain.navMode = "Scripted route";
  brain.stuckTimer = 0;
  brain.lastDist = Infinity;
}

export function createAgentBrain(memory, llmPolicy = null, stage = 1) {
  const policyMode = getPolicyMode();
  return {
    stage,
    route: buildRouteForStage(stage),
    routeIndex: 0,
    phase: "moving",
    timer: 0,
    status: "Ready",
    policy: policyMode === "llm" ? "Scripted mission route" : `Neuro-Adaptive (${policyMode})`,
    policyMode,
    confidence: computeConfidence(memory, 0),
    yaw: Math.PI,
    memory,
    llmPolicy,
    llmReasoning: llmPolicy?.reasoning || "",
    rlAction: null,
    warnedHazards: new Set(),
    navMode: policyMode === "llm" ? "Scripted route" : "RL + survival",
    stuckTimer: 0,
    lastDist: Infinity,
    missionFinished: false,
    actionStuckCount: 0,
  };
}

export function applyLlmPolicyToBrain(brain, llmPolicy) {
  brain.llmPolicy = llmPolicy;
  brain.llmReasoning = llmPolicy?.reasoning || "";
  if (brain.policyMode === "llm" && llmPolicy?.source === "ollama") {
    brain.policy = `Scripted route + Ollama (${llmPolicy.model})`;
  } else if (brain.policyMode === "hybrid") {
    brain.policy = `RL navigation + Ollama (${llmPolicy?.model || "offline"})`;
  }
}

export function resetAgentBrain(brain, memory, llmPolicy = brain.llmPolicy) {
  brain.route = [];
  brain.routeIndex = 0;
  brain.phase = "moving";
  brain.timer = 0;
  brain.memory = memory;
  brain.llmPolicy = llmPolicy;
  brain.stuckTimer = 0;
  brain.lastDist = Infinity;
  brain.missionFinished = false;
  brain.actionStuckCount = 0;
}

function currentGoal(brain) {
  if (!brain.route?.length) return null;
  if (brain.routeIndex >= brain.route.length) return null;
  return brain.route[brain.routeIndex];
}

function advanceRoute(brain) {
  if (brain.routeIndex < brain.route.length - 1) {
    brain.routeIndex += 1;
    brain.stuckTimer = 0;
    brain.lastDist = Infinity;
    return true;
  }
  brain.routeIndex = brain.route.length;
  return false;
}

function moveToward(pos, gx, gy, gz, speed, delta) {
  const dx = gx - pos.x;
  const dy = gy - pos.y;
  const dz = gz - pos.z;
  const dist = Math.hypot(dx, dy, dz) || 0.001;
  const step = Math.min(speed * delta, dist);
  pos.x += (dx / dist) * step;
  pos.y += (dy / dist) * step;
  pos.z += (dz / dist) * step;
  return Math.hypot(gx - pos.x, gz - pos.z);
}

function finishRoute(brain, onMissionComplete) {
  if (brain.missionFinished) return;
  brain.missionFinished = true;
  brain.routeIndex = brain.route.length;
  brain.phase = "done";
  brain.status = "Stage route complete…";
  onMissionComplete?.();
}

function handleArrival(brain, goal, world, onInteract, onMissionComplete, pos) {
  const total = brain.route.length;
  const stepNum = brain.routeIndex + 1;

  if (goal.action) {
    const item = actionTarget(goal, world);
    if (!canInteractAt(pos, item)) {
      brain.status = `[${stepNum}/${total}] Move closer to ${goal.observe || goal.action}…`;
      brain.phase = "moving";
      return false;
    }
    if (!runWaypointAction(goal, world, onInteract, pos)) {
      brain.status = `[${stepNum}/${total}] Aligning ${goal.observe || goal.action}…`;
      brain.phase = "moving";
      return false;
    }
    brain.status = `[${stepNum}/${total}] ${goal.observe || goal.action} ✓`;
    brain.phase = "acting";
    brain.timer = ACT_PAUSE;
    brain.didAct = true;
    brain.actionStuckCount = 0;
    return true;
  }

  if (goal.observe) {
    brain.phase = "observe";
    brain.timer = OBSERVE_PAUSE;
    brain.status = `[${stepNum}/${total}] ${goal.observe}`;
    return;
  }

  if (brain.routeIndex >= brain.route.length - 1) {
    finishRoute(brain, onMissionComplete);
    return;
  }

  advanceRoute(brain);
  brain.status = `[${stepNum}/${total}] OK — next`;
}

export function updateAgent({
  agentVisual,
  brain,
  world,
  delta,
  hazards: hazardsIn,
  onInteract,
  onStatus,
  onNearMiss,
  activatedSigils = [],
  activatedItems = [],
  onMissionComplete,
  onSuppress,
  pursuers = [],
}) {
  const pos = agentVisual.agent.position;
  const objectives = activatedItems.length ? activatedItems : activatedSigils;
  const hazards = hazardsIn ?? world.hazards ?? [];

  if (!brain.route?.length) {
    rebuildRoute(brain, pos, hazards, objectives, brain.stage ?? 1);
  }

  if (brain.phase === "done" || brain.missionFinished) {
    brain.status = "Stage route complete…";
    onStatus?.(brain);
    return;
  }

  for (const h of hazards) {
    if (h.state !== "warning" && h.state !== "firing") continue;
    // Murals firing at specters aren't a threat to the agent — don't log near misses.
    if (h.beamTarget?.type === "specter" || h.suppressMode === "agent-only") continue;

    const dist = horizontalDist(pos.x, pos.z, h.mesh.position.x, h.mesh.position.z);
    if (dist < 9 && !brain.warnedHazards.has(h.id)) {
      brain.warnedHazards.add(h.id);
      recordNearMiss(brain.memory, h.id);
      onNearMiss?.(h);
    }
  }

  const goal = currentGoal(brain);
  const total = brain.route.length;
  const stepNum = Math.min(brain.routeIndex + 1, total);

  if (!goal) {
    finishRoute(brain, onMissionComplete);
    onStatus?.(brain);
    return;
  }

  const navTarget = navGoalPosition(goal, world);

  brain.confidence = computeConfidence(brain.memory, brain.routeIndex / Math.max(total, 1));

  if (brain.phase === "acting") {
    brain.timer -= delta;
    if (brain.timer <= 0) {
      const sigilPending =
        goal.action === "sigil" && !activatedSigils.includes(goal.id);
      const beaconPending =
        goal.action === "beacon" && !activatedItems.includes(goal.id);
      const ampulePending =
        goal.action === "ampule" && !activatedItems.includes(goal.id);
      const consolePending =
        goal.action === "console" && !activatedItems.includes(goal.id);
      const relicPending =
        goal.action === "relic" && !activatedItems.includes(goal.id);
      if (sigilPending || beaconPending || ampulePending || consolePending || relicPending) {
        brain.phase = "moving";
        brain.status = `[${stepNum}/${total}] Retry ${goal.observe || goal.id}…`;
        brain.stuckTimer = 0;
      } else if (brain.routeIndex >= brain.route.length - 1) {
        finishRoute(brain, onMissionComplete);
      } else {
        advanceRoute(brain);
        brain.phase = "moving";
      }
    }
    onStatus?.(brain);
    return;
  }

  if (brain.phase === "observe") {
    brain.timer -= delta;
    if (brain.timer <= 0) {
      if (brain.routeIndex >= brain.route.length - 1) {
        finishRoute(brain, onMissionComplete);
      } else {
        advanceRoute(brain);
        brain.phase = "moving";
      }
    }
    onStatus?.(brain);
    return;
  }

  const prevX = pos.x;
  const prevZ = pos.z;
  const speed = getAgentSpeed(brain.stage);
  const objectiveDist = goal?.action
    ? horizontalDist(pos.x, pos.z, navTarget.x, navTarget.z)
    : Infinity;
  const directObjectiveApproach = goal?.action && objectiveDist < 8;

  if (directObjectiveApproach) {
    moveToward(pos, navTarget.x, navTarget.y, navTarget.z, speed, delta);
    clampAgentPosition(pos, brain.stage ?? 1, world);
    const targetYaw = Math.atan2(navTarget.x - pos.x, navTarget.z - pos.z);
    brain.yaw = lerpAngle(brain.yaw, targetYaw, Math.min(1, delta * 5));
  } else {
  const resolved = resolveMovement({
    brain,
    pos,
    navTarget,
    goal,
    hazards,
    pursuers,
    speed,
    delta,
    onSuppress,
    stage: brain.stage ?? 1,
    world,
  });

  if (resolved) {
    const goalDist = Math.hypot(navTarget.x - pos.x, navTarget.z - pos.z);
    const frozen =
      Math.abs(resolved.vx) < 0.02 &&
      Math.abs(resolved.vz) < 0.02 &&
      goalDist > ARRIVE_DIST * 1.5;

    if (frozen) {
      moveToward(pos, navTarget.x, navTarget.y, navTarget.z, speed * 0.55, delta);
      clampAgentPosition(pos, brain.stage ?? 1, world);
    } else {
      applyResolvedMovement(pos, resolved, delta, brain.stage ?? 1, world);
    }
    if (resolved.reasoning) brain.rlReasoning = resolved.reasoning;
    if (resolved.lure && resolved.label) brain.rlReasoning = resolved.label;
    if (resolved.rl && brain.rlAction?.reasoning && !resolved.lure) {
      brain.rlReasoning = brain.rlAction.reasoning;
    }
    const targetYaw = Math.atan2(resolved.vx || navTarget.x - pos.x, resolved.vz || navTarget.z - pos.z);
    brain.yaw = lerpAngle(brain.yaw, targetYaw, Math.min(1, delta * 5));
  } else {
    moveToward(pos, navTarget.x, navTarget.y, navTarget.z, speed, delta);
    clampAgentPosition(pos, brain.stage ?? 1, world);
    const targetYaw = Math.atan2(navTarget.x - pos.x, navTarget.z - pos.z);
    brain.yaw = lerpAngle(brain.yaw, targetYaw, Math.min(1, delta * 5));
  }
  }
  agentVisual.agent.rotation.y = brain.yaw;

  const dist = distAfterMove(pos, navTarget);
  const moved = Math.hypot(pos.x - prevX, pos.z - prevZ);

  if (dist <= ARRIVE_DIST) {
    handleArrival(brain, goal, world, onInteract, onMissionComplete, pos);
    brain.stuckTimer = 0;
    brain.lastDist = Infinity;
    onStatus?.(brain);
    return;
  }

  if (moved < 0.03 && dist > ARRIVE_DIST * 1.2) {
    brain.stuckTimer += delta;
  } else {
    brain.stuckTimer = 0;
    brain.actionStuckCount = 0;
  }
  brain.lastDist = dist;

  if (brain.stuckTimer > 2.5) {
    brain.stuckTimer = 0;
    if (goal.action) {
      brain.actionStuckCount += 1;
      if (brain.actionStuckCount >= 4) {
        snapToTarget(pos, goal, world);
        brain.actionStuckCount = 0;
      } else {
        nudgeTowardTarget(pos, goal, world);
      }
      const item = actionTarget(goal, world);
      const target = interactablePosition(item, goal);
      const remain = horizontalDist(pos.x, pos.z, target.x, target.z);
      brain.status = `[${stepNum}/${total}] Approaching ${goal.observe || goal.action} (${remain.toFixed(1)}m)`;
    } else {
      advanceRoute(brain);
      brain.status = `[${stepNum}/${total}] Skip blocked waypoint`;
    }
    onStatus?.(brain);
    return;
  }

  brain.status = `[${stepNum}/${total}] → ${goal.observe || `z${navTarget.z.toFixed(0)}`} (${dist.toFixed(1)}m)`;
  onStatus?.(brain);
}

// Designed by Dang-Tue Hoang, AI Engineer
