import * as THREE from "three";
import {
  SIGIL_ORDER,
  SIGIL_LABELS,
  createRenderer,
  createScene,
  createCamera,
  createLights,
  createMaterials,
  buildWorld,
  clearSceneFog,
} from "./world.js";
import { createMinimap } from "./minimap.js";
import {
  resetHazardMurals,
  updateHazardMurals,
  suppressHazard,
  suppressAllHazards,
} from "./hazard-murals.js";
import {
  createAgentVisual,
  createAgentBrain,
  applyLlmPolicyToBrain,
  rebuildRoute,
  updateAgent,
  updateFollowCamera,
  getAgentPosition,
} from "./ml-agent.js";
import { getHazardStateSummary } from "./hazard-geometry.js";
import {
  loadMemory,
  beginRun,
  recordDeath,
  recordWin,
  recordOxygenFailure,
  recordSuppression,
  resetMemory,
  getMemorySummary,
  getStartScreenLearningText,
  formatHazardName,
} from "./agent-memory.js";
import {
  STAGE,
  BEACON_ORDER,
  BEACON_LABELS,
  AMPULE_ORDER,
  AMPULE_LABELS,
  CONSOLE_ORDER,
  CONSOLE_LABELS,
  LAST_STAGE,
  isGalleryStage,
  getGalleryConfig,
  getGalleryLightingProfile,
  getStageMeta,
  getRelicOrderForStage,
  getRelicLabelsForStage,
  getRelicSequenceForStage,
} from "./stages.js";
import { buildStage2World, animateShuttleTransit } from "./stage2-world.js";
import { buildStage3World } from "./stage3-world.js";
import { buildStage4World, animateFinalAscent } from "./stage4-world.js";
import { buildGalleryStageWorld } from "./gallery-stage-world.js";
import { destroyStagesFrom } from "./stage-cleanup.js";
import {
  fetchAvailableModels,
  getSelectedModel,
  setSelectedModel,
  fetchAgentPlan,
  fetchReactivePlan,
  buildPlanContext,
  buildLiveContext,
  FALLBACK_PLAN,
} from "./llm-client.js";
import { createStageMusic } from "./stage-music.js";
import {
  checkRlHealth,
  fetchRlAction,
  fetchPursuerUpdate,
  getPolicyMode,
  setPolicyMode,
  POLICY_MODES,
} from "./rl-client.js";
import { buildObservation } from "./rl-observation.js";
import { createAdaptivePursuers, ACTIVE_SPECTER_COUNT } from "./adaptive-pursuers.js";
import {
  stageHasSpecters,
  stageHasDefenseMurals,
  installStageDefenseHazards,
  clearStageDefenseHazards,
  getCombatHazards,
} from "./stage-combat.js";

const canvas = document.getElementById("game-canvas");
const overlay = document.getElementById("overlay");
const hud = document.getElementById("hud");
const winScreen = document.getElementById("win-screen");
const loseScreen = document.getElementById("lose-screen");
const messageEl = document.getElementById("message");
const oxygenBar = document.getElementById("oxygen-bar");
const stageLabelEl = document.getElementById("stage-label");
const stageNameEl = document.getElementById("stage-name");
const objectiveLabelEl = document.getElementById("objective-label");
const objectiveCountEl = document.getElementById("objective-count");
const stageBanner = document.getElementById("stage-banner");
const stageBannerTitle = document.getElementById("stage-banner-title");
const stageBannerTagline = document.getElementById("stage-banner-tagline");
const winTitleEl = document.getElementById("win-title");
const winTaglineEl = document.getElementById("win-tagline");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const retryBtn = document.getElementById("retry-btn");
const loseEyebrow = document.getElementById("lose-eyebrow");
const loseTitle = document.getElementById("lose-title");
const loseTagline = document.getElementById("lose-tagline");
const damageFlash = document.getElementById("damage-flash");
const agentStatusEl = document.getElementById("agent-status");
const agentPolicyEl = document.getElementById("agent-policy");
const agentConfidenceEl = document.getElementById("agent-confidence");
const agentMemoryEl = document.getElementById("agent-memory");
const learningTextEl = document.getElementById("learning-text");
const clearMemoryBtn = document.getElementById("clear-memory-btn");
const winAttemptsEl = document.getElementById("win-attempts");
const ollamaModelSelect = document.getElementById("ollama-model");
const llmStatusEl = document.getElementById("llm-status");
const musicEnabledEl = document.getElementById("music-enabled");
const musicVolumeEl = document.getElementById("music-volume");
const musicTrackEl = document.getElementById("music-track");
const agentReasoningEl = document.getElementById("agent-reasoning");
const policyModeSelect = document.getElementById("policy-mode");
const rlStatusEl = document.getElementById("rl-status");
const minimapCanvas = document.getElementById("minimap");
const minimap = createMinimap(minimapCanvas);
const stageMusic = createStageMusic();

const renderer = createRenderer(canvas);
const scene = createScene();
const pursuerSystem = createAdaptivePursuers(scene);
const camera = createCamera();
createLights(scene);
const materials = createMaterials();
const world = buildWorld(scene, materials);
const agentVisual = createAgentVisual(scene);
let memory = loadMemory();
let brain = createAgentBrain(memory);
let lastHitHazardId = null;

let playing = false;
let oxygen = 100;
let activatedSigils = [];
let activatedBeacons = [];
let activatedAmpules = [];
let activatedConsoles = [];
let activatedRelics = [];
let currentStage = STAGE.ONE;
let gameOver = false;
let pulseTime = 0;
let autoRetryUntilWin = false;
let retryTimer = null;
let sessionAttempts = 0;
let pendingLlmPlan = null;
let lastFailureReason = null;
let currentLlmPlan = null;
let llmReady = false;
let rlReady = false;
let rlTick = 0;
let pursuerFetchTick = 0;
let pursuerHuntActive = false;
let rlBusy = false;
let reactiveTimer = 0;
let doorOpening = false;
let stageTransitioning = false;
const REACTIVE_INTERVAL = 8;

const RETRY_DELAY_MS = 3200;

const clock = new THREE.Clock();

function clearRetryTimer() {
  if (retryTimer) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function setMessage(text, duration = 2800) {
  messageEl.textContent = text;
  messageEl.classList.add("visible");
  window.clearTimeout(setMessage.timer);
  setMessage.timer = window.setTimeout(() => messageEl.classList.remove("visible"), duration);
}

function horizontalDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function updateMemoryHud() {
  const s = getMemorySummary(memory);
  agentMemoryEl.textContent = `Runs ${s.runs} · Wins ${s.wins} · Hot zones ${s.hotZones}`;
}

function getActiveObjectives() {
  if (isGalleryStage(currentStage)) return activatedRelics;
  switch (currentStage) {
    case STAGE.FOUR:
      return activatedConsoles;
    case STAGE.THREE:
      return activatedAmpules;
    case STAGE.TWO:
      return activatedBeacons;
    default:
      return activatedSigils;
  }
}

function updateStageHud() {
  const meta = getStageMeta(currentStage);
  if (stageLabelEl) stageLabelEl.textContent = `STAGE ${currentStage}`;
  if (stageNameEl) stageNameEl.textContent = meta.name;
  if (objectiveLabelEl) objectiveLabelEl.textContent = meta.objectiveLabel;
  const count = getActiveObjectives().length;
  if (objectiveCountEl) objectiveCountEl.textContent = `${count} / ${meta.objectiveTotal}`;
}

function getActiveHazardList() {
  return getCombatHazards(world, currentStage);
}

function syncSpectersForStage(stage, pos) {
  const on = stageHasSpecters(stage);
  pursuerSystem.setEnabled(on, stage, pos, world);
  if (!on) pursuerHuntActive = false;
}

function setStageMusic(stage) {
  stageMusic.setStage(stage);
  if (musicTrackEl) {
    musicTrackEl.textContent = stageMusic.getStageLabel(stage);
  }
  const stageNum = typeof stage === "number" ? stage : currentStage;
  syncSpectersForStage(stageNum, agentVisual?.agent?.position);
}

function syncMusicControls() {
  if (musicEnabledEl) musicEnabledEl.checked = stageMusic.enabled;
  if (musicVolumeEl) musicVolumeEl.value = String(Math.round(stageMusic.volume * 100));
}

async function ensureStageMusic() {
  if (!stageMusic.initialized) {
    await stageMusic.init();
    syncMusicControls();
  }
}

function showStageBanner(title, tagline, duration = 3200) {
  if (!stageBanner) return;
  if (stageBannerTitle) stageBannerTitle.textContent = title;
  if (stageBannerTagline) stageBannerTagline.textContent = tagline;
  stageBanner.classList.remove("hidden");
  requestAnimationFrame(() => stageBanner.classList.add("visible"));
  window.setTimeout(() => {
    stageBanner.classList.remove("visible");
    window.setTimeout(() => stageBanner.classList.add("hidden"), 650);
  }, duration);
}

function refreshStartScreenMemory() {
  learningTextEl.textContent = getStartScreenLearningText(memory);
  updateMemoryHud();
}

function updateAgentHud(state) {
  const step = state.route?.length
    ? `${(state.routeIndex ?? 0) + 1}/${state.route.length}`
    : "—";
  agentStatusEl.textContent = state.status;
  let policyLine = `${state.policy || state.navMode} · step ${step}`;
  const specters = getSpectersForMinimap();
  if (specters.length && agentVisual?.agent) {
    const pos = agentVisual.agent.position;
    const nearest = Math.min(...specters.map((s) => Math.hypot(pos.x - s.x, pos.z - s.z)));
    const hunt = specters.some((s) => s.hunting) ? "hunting" : "staging";
    policyLine += ` · specter ${nearest.toFixed(1)}m (${hunt})`;
  } else if (stageHasSpecters(currentStage) && !pursuerSystem.enabled) {
    policyLine += " · specters off";
  }
  agentPolicyEl.textContent = policyLine;
  agentConfidenceEl.style.width = `${Math.round(state.confidence * 100)}%`;
  if (state.llmReasoning && agentReasoningEl) {
    agentReasoningEl.textContent = state.llmReasoning;
  } else if (state.rlReasoning && agentReasoningEl && state.policyMode !== "llm") {
    agentReasoningEl.textContent = state.rlReasoning;
  }
  updateMemoryHud();
}

function usesRlPolicy(mode = getPolicyMode()) {
  return mode === "rl" || mode === "hybrid";
}

function syncPolicyControls() {
  if (policyModeSelect) policyModeSelect.value = getPolicyMode();
}

function populatePolicySelect() {
  if (!policyModeSelect) return;
  policyModeSelect.innerHTML = "";
  for (const m of POLICY_MODES) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    if (m.id === getPolicyMode()) opt.selected = true;
    policyModeSelect.appendChild(opt);
  }
}

async function refreshRlStatus() {
  const health = await checkRlHealth();
  rlReady = health.ok;
  if (rlStatusEl) {
    rlStatusEl.textContent = health.ok
      ? `RL server · ${health.modelLoaded ? "PPO loaded" : "rule policy"} · obs ${health.obsSize}`
      : `RL server offline (${health.error || "start :3002"}) — local pursuers only`;
    rlStatusEl.classList.toggle("online", health.ok);
    rlStatusEl.classList.toggle("offline", !health.ok);
  }
}

async function tickRlPolicy() {
  if (!playing || gameOver || !usesRlPolicy(brain.policyMode) || rlBusy) return;

  const pos = getAgentPosition(agentVisual);
  const goal = brain.route?.[brain.routeIndex];
  const navGoal = goal ? { x: goal.x ?? pos.x, z: goal.z ?? pos.z } : { x: pos.x, z: pos.z - 2 };

  const observation = buildObservation({
    position: pos,
    yaw: brain.yaw,
    oxygen,
    routeIndex: brain.routeIndex,
    routeLength: brain.route?.length || 1,
    goal: navGoal,
    activatedSigils,
    hazards: getHazardStateSummary(getActiveHazardList()),
    pursuers: getActivePursuers(),
    stage: currentStage,
  });

  rlBusy = true;
  try {
    const action = rlReady
      ? await fetchRlAction(observation, { stage: currentStage, policyMode: brain.policyMode })
      : { action: 0, actionName: "forward", source: "local", reasoning: "RL server offline — action search fallback" };
    brain.rlAction = action;
    if (action.reasoning && brain.policyMode === "rl") {
      brain.rlReasoning = `${action.source}: ${action.reasoning}`;
    }
  } catch {
    brain.rlAction = null;
  } finally {
    rlBusy = false;
  }
}

async function fetchPursuerState() {
  if (!rlReady || !usesRlPolicy(brain.policyMode)) return;
  const pos = getAgentPosition(agentVisual);
  try {
    pursuerSystem.serverUpdate = await fetchPursuerUpdate({
      stage: currentStage,
      agent: { x: pos.x, z: pos.z, vx: pursuerSystem.agentVel?.vx || 0, vz: pursuerSystem.agentVel?.vz || 0 },
      pursuers: getActivePursuers(),
    });
  } catch {
    pursuerSystem.serverUpdate = null;
  }
}

function getActivePursuers() {
  if (!stageHasSpecters(currentStage) || !pursuerSystem.enabled) return [];
  return pursuerSystem.getPositions();
}

function getSpectersForMinimap() {
  if (!stageHasSpecters(currentStage) || !pursuerSystem.enabled) return [];
  return pursuerSystem.getMapSpecters();
}

function getSpectersForHazards() {
  if (!stageHasSpecters(currentStage) || !pursuerSystem.enabled || !playing) return [];
  return pursuerSystem.getHuntableSpecters();
}

function onSpecterDestroyed(hazard, pursuer) {
  if (!pursuer) return;
  const ok = pursuerSystem.banishSpecter(pursuer, hazard);
  if (!ok) return;
  const mural = hazard.type === "lightning" ? "Storm Eye" : "Beam lens";
  const ghost = pursuer.roleLabel || "specter";
  setMessage(`${mural} purged ${ghost}!`, 3200);
  flashDamage();
}

function tickPursuers(delta) {
  if (!playing || gameOver || !pursuerSystem.enabled || !stageHasSpecters(currentStage)) return;

  const pos = getAgentPosition(agentVisual);
  const result = pursuerSystem.update(delta, pos, currentStage, pursuerSystem.serverUpdate);
  pursuerHuntActive = result.hunting === true;

  if (!result.hunting) return;

  if (result.caught) {
    oxygen = Math.max(0, oxygen - delta * 7);
    flashDamage();
    if (oxygen <= 0) loseGame("oxygen");
  } else if (result.nearest < 4) {
    oxygen = Math.max(0, oxygen - delta * 1.2);
  }
}

async function refreshLlmStatus() {
  try {
    const modelData = await fetchAvailableModels();
    await populateModelSelect(modelData);

    llmReady = modelData.ok;
    if (llmStatusEl) {
      const count = modelData.models.filter((m) => m.installed !== false).length;
      llmStatusEl.textContent = modelData.ok
        ? `Ollama connected · ${count} model(s) · ${getSelectedModel()}`
        : `Ollama offline — using fallback list (${modelData.error || "proxy unreachable"})`;
      llmStatusEl.classList.toggle("online", modelData.ok);
      llmStatusEl.classList.toggle("offline", !modelData.ok);
    }
  } catch (err) {
    console.error("refreshLlmStatus failed:", err);
    await populateModelSelect();
    if (llmStatusEl) {
      llmStatusEl.textContent = `Ollama status error — using fallback list (${err.message})`;
      llmStatusEl.classList.add("offline");
    }
  }
}

function renderModelOptionLabel(model) {
  let label = model.label;
  if (model.recommended) label += " ★";
  if (model.installed === false) label += " (not installed)";
  return label;
}

async function populateModelSelect(prefetched) {
  if (!ollamaModelSelect) return;

  if (!prefetched) {
    ollamaModelSelect.innerHTML = "";
    const loading = document.createElement("option");
    loading.textContent = "Loading models…";
    loading.disabled = true;
    loading.selected = true;
    ollamaModelSelect.appendChild(loading);
    ollamaModelSelect.disabled = true;
    prefetched = await fetchAvailableModels();
  }

  const { models, recommended } = prefetched;
  ollamaModelSelect.innerHTML = "";
  ollamaModelSelect.disabled = false;

  let selected = getSelectedModel();
  const selectable = models.filter((m) => m.installed !== false);
  if (!selectable.some((m) => m.id === selected)) {
    selected = selectable.find((m) => m.recommended)?.id || selectable[0]?.id || recommended;
    if (selected) setSelectedModel(selected);
  }

  for (const m of models) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = renderModelOptionLabel(m);
    opt.disabled = m.installed === false;
    if (m.id === selected) opt.selected = true;
    ollamaModelSelect.appendChild(opt);
  }
}

function applyPlanToBrain(plan) {
  currentLlmPlan = plan;
  applyLlmPolicyToBrain(brain, plan);
}

async function consultLlm(trigger, failureReason = null, hazardId = null) {
  const model = getSelectedModel();
  agentStatusEl.textContent = `Consulting Ollama (${model})…`;
  if (agentReasoningEl) agentReasoningEl.textContent = "A* route + Ollama policy synthesis…";
  if (llmStatusEl) llmStatusEl.textContent = `Planning with ${model}…`;

  try {
    const plan = await fetchAgentPlan(
      buildPlanContext({
        memory,
        sessionAttempts,
        runNumber: memory.runs,
        lastFailureReason: failureReason || memory.lastOutcome,
        lastHazardId: hazardId || memory.lastHazardId,
        trigger,
      }),
      model
    );
    applyPlanToBrain(plan);
    if (llmStatusEl) {
      llmStatusEl.textContent =
        plan.source === "ollama" ? `Ollama · ${model}` : `Fallback · ${model}`;
      llmStatusEl.classList.toggle("online", plan.source === "ollama");
    }
    if (agentReasoningEl) agentReasoningEl.textContent = plan.reasoning;
    return plan;
  } catch (err) {
    applyPlanToBrain(FALLBACK_PLAN);
    if (llmStatusEl) llmStatusEl.textContent = `LLM error: ${err.message}`;
    if (agentReasoningEl) agentReasoningEl.textContent = FALLBACK_PLAN.reasoning;
    return FALLBACK_PLAN;
  }
}

async function reactiveReplan() {
  if (!playing || gameOver || !llmReady) return;
  const model = getSelectedModel();
  const pos = getAgentPosition(agentVisual);
  try {
    const patch = await fetchReactivePlan(
      buildLiveContext({
        memory,
        position: pos,
        hazards: getHazardStateSummary(getActiveHazardList()),
        routeIndex: brain.routeIndex,
        routeLength: brain.route?.length || 0,
        activatedSigils,
        oxygen,
      }),
      model
    );
    if (patch && brain.llmPolicy) {
      brain.llmPolicy = { ...brain.llmPolicy, ...patch, model };
      brain.llmReasoning = patch.reasoning || brain.llmReasoning;
      brain.status = `Reactive Ollama: ${patch.reasoning?.slice(0, 60) || "policy tuned"}…`;
    }
  } catch {
    /* keep current policy */
  }
}

function activateSigil(item) {
  if (!item || item.mesh.userData.activated) return false;

  const pos = agentVisual.agent.position;
  const sx = item.mesh.position.x;
  const sz = item.mesh.position.z;
  const dist = Math.hypot(pos.x - sx, pos.z - sz);
  const maxDist = Math.min(item.radius ?? 2.4, 2.4);
  if (dist > maxDist) return false;

  const expected = SIGIL_ORDER[activatedSigils.length];
  if (item.id !== expected) {
    setMessage("Agent misaligned sigil. Structure rejects sequence.", 3200);
    oxygen = Math.max(0, oxygen - 8);
    flickerStarMap(0xff4444);
    return false;
  }

  item.mesh.userData.activated = true;
  item.mesh.material.emissiveIntensity = 1.4;
  item.mesh.scale.setScalar(1.35);
  activatedSigils.push(item.id);
  if (objectiveCountEl) objectiveCountEl.textContent = `${activatedSigils.length} / ${SIGIL_ORDER.length}`;
  setMessage(`Agent aligned ${SIGIL_LABELS[item.id]}.`);
  flickerStarMap(0x58d4ff);
  return true;
}

function activateBeacon(item) {
  if (!item || item.mesh.userData.activated) return false;

  const pos = agentVisual.agent.position;
  const bx = item.mesh.position.x;
  const bz = item.mesh.position.z;
  const dist = Math.hypot(pos.x - bx, pos.z - bz);
  const maxDist = Math.min(item.radius ?? 2.4, 2.4);
  if (dist > maxDist) return false;

  const expected = BEACON_ORDER[activatedBeacons.length];
  if (item.id !== expected) {
    setMessage("Beacon chain rejects out-of-order tuning.", 3200);
    oxygen = Math.max(0, oxygen - 6);
    return false;
  }

  item.mesh.userData.activated = true;
  item.mesh.material.emissiveIntensity = 1.5;
  item.mesh.scale.setScalar(1.3);
  activatedBeacons.push(item.id);
  if (objectiveCountEl) {
    objectiveCountEl.textContent = `${activatedBeacons.length} / ${BEACON_ORDER.length}`;
  }
  setMessage(`Beacon tuned: ${BEACON_LABELS[item.id]}.`);
  if (world.stage2?.shuttleRing) {
    world.stage2.shuttleRing.material.emissiveIntensity = 0.35 + activatedBeacons.length * 0.25;
  }
  return true;
}

function activateAmpule(item) {
  if (!item || item.mesh.userData.activated) return false;

  const pos = agentVisual.agent.position;
  const ax = item.mesh.position.x;
  const az = item.mesh.position.z;
  const dist = Math.hypot(pos.x - ax, pos.z - az);
  const maxDist = Math.min(item.radius ?? 2.4, 2.4);
  if (dist > maxDist) return false;

  const expected = AMPULE_ORDER[activatedAmpules.length];
  if (item.id !== expected) {
    setMessage("Containment rejects out-of-order urn handling.", 3200);
    oxygen = Math.max(0, oxygen - 10);
    return false;
  }

  item.mesh.userData.activated = true;
  item.mesh.material.emissiveIntensity = 1.4;
  item.mesh.scale.setScalar(1.25);
  activatedAmpules.push(item.id);
  if (objectiveCountEl) {
    objectiveCountEl.textContent = `${activatedAmpules.length} / ${AMPULE_ORDER.length}`;
  }
  setMessage(`Secured ${AMPULE_LABELS[item.id]}. Black fluid stabilizing.`);
  return true;
}

function activateConsole(item) {
  if (!item || item.mesh.userData.activated) return false;

  const pos = agentVisual.agent.position;
  const cx = item.mesh.position.x;
  const cz = item.mesh.position.z;
  const dist = Math.hypot(pos.x - cx, pos.z - cz);
  const maxDist = Math.min(item.radius ?? 2.4, 2.4);
  if (dist > maxDist) return false;

  const expected = CONSOLE_ORDER[activatedConsoles.length];
  if (item.id !== expected) {
    setMessage("Pilot dais rejects sequence. Helm → Drive → Ascent.", 3200);
    oxygen = Math.max(0, oxygen - 8);
    return false;
  }

  item.mesh.userData.activated = true;
  item.mesh.material.emissiveIntensity = 1.6;
  item.mesh.scale.setScalar(1.35);
  activatedConsoles.push(item.id);
  if (objectiveCountEl) {
    objectiveCountEl.textContent = `${activatedConsoles.length} / ${CONSOLE_ORDER.length}`;
  }
  setMessage(`Activated ${CONSOLE_LABELS[item.id]}.`);
  if (world.stage4?.holoRing) {
    world.stage4.holoRing.material.emissiveIntensity = 0.75 + activatedConsoles.length * 0.35;
  }
  return true;
}

function activateRelic(item) {
  if (!item || item.mesh.userData.activated) return false;

  const pos = agentVisual.agent.position;
  const rx = item.mesh.position.x;
  const rz = item.mesh.position.z;
  const dist = Math.hypot(pos.x - rx, pos.z - rz);
  const maxDist = Math.min(item.radius ?? 2.4, 2.4);
  if (dist > maxDist) return false;

  const relicOrder = getRelicOrderForStage(currentStage) || [];
  const relicLabels = getRelicLabelsForStage(currentStage) || {};
  const relicSequence = getRelicSequenceForStage(currentStage) || "Ward → Seal → Mark";

  const expected = relicOrder[activatedRelics.length];
  if (item.id !== expected) {
    setMessage(`Gallery rejects out-of-order attunement. ${relicSequence}.`, 3200);
    oxygen = Math.max(0, oxygen - 6);
    return false;
  }

  item.mesh.userData.activated = true;
  item.mesh.material.emissiveIntensity = 1.5;
  item.mesh.scale.setScalar(1.3);
  activatedRelics.push(item.id);
  if (objectiveCountEl) {
    objectiveCountEl.textContent = `${activatedRelics.length} / ${relicOrder.length || 3}`;
  }
  setMessage(`Attuned ${relicLabels[item.id] || item.id}.`);
  return true;
}

function completeMission() {
  if (gameOver || doorOpening || stageTransitioning) return;

  if (currentStage === STAGE.ONE) {
    if (activatedSigils.length >= SIGIL_ORDER.length) {
      openDoor();
    } else {
      setMessage(
        `Route complete but sigils incomplete (${activatedSigils.length}/3). Agent must reach each pillar.`,
        4000
      );
      window.setTimeout(() => {
        if (!gameOver && autoRetryUntilWin) startGame({ fromAutoRetry: true });
      }, 4200);
    }
    return;
  }

  if (currentStage === STAGE.TWO) {
    if (activatedBeacons.length >= BEACON_ORDER.length) {
      beginShuttleToVault();
    } else {
      setMessage(`Bridge route complete but beacons incomplete (${activatedBeacons.length}/3).`, 4000);
      window.setTimeout(() => {
        if (!gameOver && autoRetryUntilWin) startGame({ fromAutoRetry: true });
      }, 4200);
    }
    return;
  }

  if (currentStage === STAGE.THREE) {
    if (activatedAmpules.length >= AMPULE_ORDER.length) {
      beginStage4();
    } else {
      setMessage(`Vault route complete but ampules incomplete (${activatedAmpules.length}/3).`, 4000);
      window.setTimeout(() => {
        if (!gameOver && autoRetryUntilWin) startGame({ fromAutoRetry: true });
      }, 4200);
    }
    return;
  }

  if (currentStage === STAGE.FOUR) {
    if (activatedConsoles.length >= CONSOLE_ORDER.length) {
      beginGalleryStage(STAGE.FIVE);
    } else {
      setMessage(`Sanctum route complete but consoles incomplete (${activatedConsoles.length}/3).`, 4000);
      window.setTimeout(() => {
        if (!gameOver && autoRetryUntilWin) startGame({ fromAutoRetry: true });
      }, 4200);
    }
    return;
  }

  if (isGalleryStage(currentStage)) {
    const relicOrder = getRelicOrderForStage(currentStage) || [];
    if (activatedRelics.length >= relicOrder.length) {
      if (currentStage < LAST_STAGE) {
        beginGalleryStage(currentStage + 1);
      } else {
        beginFinalAscent();
      }
    } else {
      setMessage(
        `Gallery route complete but relics incomplete (${activatedRelics.length}/${relicOrder.length || 3}).`,
        4000
      );
      window.setTimeout(() => {
        if (!gameOver && autoRetryUntilWin) startGame({ fromAutoRetry: true });
      }, 4200);
    }
  }
}

function openDoor() {
  if (doorOpening || gameOver) return;
  doorOpening = true;
  setMessage("Star map unlocked. Airlock opening.", 4000);
  const startZ = world.door.position.z;
  const targetZ = startZ + 3.5;
  const start = performance.now();

  function slideDoor(now) {
    const t = Math.min((now - start) / 1800, 1);
    world.door.position.z = THREE.MathUtils.lerp(startZ, targetZ, t);
    if (t < 1) {
      requestAnimationFrame(slideDoor);
    } else {
      beginStage2();
    }
  }
  requestAnimationFrame(slideDoor);
}

function beginStage2() {
  if (currentStage === STAGE.TWO) return;

  stageTransitioning = true;
  currentStage = STAGE.TWO;
  doorOpening = false;
  buildStage2World(scene, materials, world);

  oxygen = Math.min(100, oxygen + 40);
  oxygenBar.style.width = `${oxygen}%`;
  oxygenBar.style.background = "linear-gradient(90deg, #3fd0ff, #79ffe8)";

  updateStageHud();
  minimap.setStage(STAGE.TWO);

  clearSceneFog(scene);
  renderer.toneMappingExposure = 1.75;

  showStageBanner("Stage 2", "Architect's Bridge — restore the beacon chain.");
  setMessage("Airlock open. Bridge spans the void. Tune Echo → Signal → Anchor.", 4500);
  setStageMusic(STAGE.TWO);

  brain.stage = STAGE.TWO;
  brain.yaw = Math.PI;
  brain.missionFinished = false;
  brain.phase = "moving";
  brain.routeIndex = 0;
  brain.route = [];
  brain.stuckTimer = 0;
  brain.actionStuckCount = 0;
  brain.rlAction = null;
  installStageDefenseHazards(scene, world, STAGE.TWO, { agentGraceMs: 600000 });
  syncSpectersForStage(STAGE.TWO, agentVisual.agent.position);
  rebuildRoute(brain, agentVisual.agent.position, getActiveHazardList(), activatedBeacons, STAGE.TWO);

  window.setTimeout(() => {
    stageTransitioning = false;
  }, 900);
}

function beginShuttleToVault() {
  if (gameOver || stageTransitioning) return;
  stageTransitioning = true;
  playing = false;
  setMessage("Beacon chain complete. Shuttle transiting to Ampule Vault.", 3500);

  animateShuttleTransit(world.stage2, agentVisual.agent, () => {
    beginStage3();
  });
}

function beginStage3() {
  if (currentStage === STAGE.THREE) return;

  stageTransitioning = true;
  currentStage = STAGE.THREE;
  buildStage3World(scene, materials, world);

  agentVisual.agent.position.set(0, 0, -51);
  brain.yaw = Math.PI;

  oxygen = Math.min(100, oxygen + 35);
  oxygenBar.style.width = `${oxygen}%`;
  oxygenBar.style.background = "linear-gradient(90deg, #3fd0ff, #79ffe8)";

  updateStageHud();
  minimap.setStage(STAGE.THREE);

  clearSceneFog(scene);
  renderer.toneMappingExposure = 1.8;

  showStageBanner("Stage 3", "Ampule Vault — secure the black-goo urns.");
  setMessage("Vault breach detected. Secure Catalyst → Serum → Payload.", 4500);
  setStageMusic(STAGE.THREE);

  brain.stage = STAGE.THREE;
  brain.missionFinished = false;
  brain.phase = "moving";
  brain.routeIndex = 0;
  brain.route = [];
  brain.stuckTimer = 0;
  brain.actionStuckCount = 0;
  installStageDefenseHazards(scene, world, STAGE.THREE, { agentGraceMs: 600000 });
  syncSpectersForStage(STAGE.THREE, agentVisual.agent.position);
  rebuildRoute(brain, agentVisual.agent.position, getActiveHazardList(), activatedAmpules, STAGE.THREE);
  playing = true;

  window.setTimeout(() => {
    stageTransitioning = false;
  }, 900);
}

function beginStage4() {
  if (currentStage === STAGE.FOUR) return;

  stageTransitioning = true;
  currentStage = STAGE.FOUR;
  buildStage4World(scene, materials, world);

  if (agentVisual.agent.position.z > -87) {
    agentVisual.agent.position.set(0, 0, -86);
  }
  brain.yaw = Math.PI;

  oxygen = Math.min(100, oxygen + 30);
  oxygenBar.style.width = `${oxygen}%`;

  updateStageHud();
  minimap.setStage(STAGE.FOUR);

  clearSceneFog(scene);
  renderer.toneMappingExposure = 1.85;

  showStageBanner("Stage 4", "Juggernaut Sanctum — awaken the pilot chair.");
  setMessage("Sanctum reached. Activate Helm → Drive → Ascent. Escape awaits.", 4500);
  setStageMusic(STAGE.FOUR);

  brain.stage = STAGE.FOUR;
  brain.missionFinished = false;
  brain.phase = "moving";
  brain.routeIndex = 0;
  brain.route = [];
  brain.stuckTimer = 0;
  brain.actionStuckCount = 0;
  installStageDefenseHazards(scene, world, STAGE.FOUR);
  syncSpectersForStage(STAGE.FOUR, agentVisual.agent.position);

  rebuildRoute(brain, agentVisual.agent.position, getActiveHazardList(), activatedConsoles, STAGE.FOUR);
  playing = true;

  window.setTimeout(() => {
    stageTransitioning = false;
  }, 900);
}

function beginGalleryStage(stage) {
  if (currentStage === stage) return;

  const cfg = getGalleryConfig(stage);
  if (!cfg) return;

  stageTransitioning = true;
  currentStage = stage;
  activatedRelics = [];
  world.galleryConfig = cfg;
  buildGalleryStageWorld(scene, materials, world, stage);

  if (cfg.room.shape === "corridor") {
    agentVisual.agent.position.set(0, cfg.floorY, cfg.zStart + 1);
  } else {
    agentVisual.agent.position.set(0, cfg.floorY, cfg.room.centerZ + cfg.room.size + 1.2);
  }
  brain.yaw = Math.PI;

  oxygen = Math.min(100, oxygen + 28);
  oxygenBar.style.width = `${oxygen}%`;

  updateStageHud();
  minimap.setStage(stage);

  const lightProfile = getGalleryLightingProfile(stage);
  clearSceneFog(scene);
  renderer.toneMappingExposure = lightProfile.exposure;

  showStageBanner(`Stage ${stage}`, `${cfg.name} — attune the relics, watch the walls.`);
  setMessage(
    `${cfg.name}: Alien shadows slide along the corridors. ${getRelicSequenceForStage(stage) || "Ward → Seal → Mark"}.`,
    4500
  );
  setStageMusic(stage);

  brain.stage = stage;
  brain.missionFinished = false;
  brain.phase = "moving";
  brain.routeIndex = 0;
  brain.route = [];
  brain.stuckTimer = 0;
  brain.actionStuckCount = 0;
  installStageDefenseHazards(scene, world, stage);
  syncSpectersForStage(stage, agentVisual.agent.position);

  rebuildRoute(brain, agentVisual.agent.position, getActiveHazardList(), activatedRelics, stage);
  playing = true;

  window.setTimeout(() => {
    stageTransitioning = false;
  }, 900);
}

function beginFinalAscent() {
  if (gameOver || stageTransitioning) return;
  stageTransitioning = true;
  playing = false;
  setMessage("Ascent protocol live. Cryo pod launching.", 3500);
  setStageMusic("ascension");

  if (!world.stage4?.built) {
    buildStage4World(scene, materials, world);
  }
  const cfg = getGalleryConfig(LAST_STAGE);
  if (cfg) {
    agentVisual.agent.position.set(0, cfg.floorY, cfg.zEnd);
  }

  animateFinalAscent(world.stage4, () => {
    winGame();
  });
}

function flickerStarMap(color) {
  for (const node of world.starMap.nodes) {
    node.material.color.set(color);
  }
  world.starMap.lines.material.color.set(color);
}

function winGame() {
  autoRetryUntilWin = false;
  clearRetryTimer();
  recordWin(memory);
  if (winAttemptsEl) winAttemptsEl.textContent = String(sessionAttempts);
  if (winTitleEl) winTitleEl.textContent = "Cryo Pod Away";
  if (winTaglineEl) {
    winTaglineEl.textContent = `The agent crossed all fourteen stages — from the entry chamber through ten gallery decks with stairwells and artist murals — and escaped aboard the cryo pod after ${sessionAttempts} attempt(s) this session.`;
  }
  gameOver = true;
  playing = false;
  stageTransitioning = false;
  setStageMusic("win");
  hud.classList.add("hidden");
  winScreen.classList.remove("hidden");
  refreshStartScreenMemory();
}

function scheduleAutoRetry(reason, hazardId = null) {
  const attempt = sessionAttempts + 1;
  const delaySec = (RETRY_DELAY_MS / 1000).toFixed(1);
  const lossDetail =
    reason === "hazard"
      ? `Destroyed at ${formatHazardName(hazardId || lastHitHazardId)}.`
      : "Oxygen depleted.";

  lastFailureReason = reason;
  pendingLlmPlan = consultLlm("auto_retry", reason, hazardId || lastHitHazardId);

  loseScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  agentStatusEl.textContent = `${lossDetail} Ollama replanning… retry in ${delaySec}s (attempt ${attempt})`;
  setMessage(
    `${lossDetail} Ollama updating policy for attempt ${attempt}…`,
    RETRY_DELAY_MS
  );
  refreshStartScreenMemory();

  retryTimer = window.setTimeout(async () => {
    retryTimer = null;
    if (autoRetryUntilWin) await startGame({ fromAutoRetry: true });
  }, RETRY_DELAY_MS);
}

function loseGame(reason = "oxygen", hazardId = null) {
  if (reason === "hazard") {
    recordDeath(memory, hazardId || lastHitHazardId);
  } else {
    recordOxygenFailure(memory);
  }

  gameOver = true;
  playing = false;
  refreshStartScreenMemory();

  if (autoRetryUntilWin) {
    scheduleAutoRetry(reason, hazardId);
    return;
  }

  hud.classList.add("hidden");
  if (stageMusic.initialized) setStageMusic("lose");

  if (reason === "hazard") {
    const name = formatHazardName(hazardId || lastHitHazardId);
    loseEyebrow.textContent = "Defense Grid Active";
    loseTitle.textContent = "Agent Destroyed";
    loseTagline.textContent = `The agent was destroyed at ${name}. This failure was saved to memory for the next run.`;
  } else {
    loseEyebrow.textContent = "Life Support Critical";
    loseTitle.textContent = "Agent Oxygen Depleted";
    loseTagline.textContent = "The autonomous suit ran out of air. Pacing memory updated for future runs.";
  }

  loseScreen.classList.remove("hidden");
}

function flashDamage() {
  damageFlash.classList.add("active");
  window.setTimeout(() => damageFlash.classList.remove("active"), 450);
}

function onHazardHit(hazard) {
  lastHitHazardId = hazard.id;
  flashDamage();
  setMessage(
    hazard.type === "lightning" ? "Storm Eye destroyed agent!" : "Beam lens destroyed agent!",
    1200
  );
  window.setTimeout(() => loseGame("hazard", hazard.id), 350);
}

function onAgentSuppress(hazard) {
  if (hazard.beamTarget?.type === "specter" || hazard.suppressMode === "agent-only") return;
  suppressHazard(hazard);
  recordSuppression(memory, hazard.id);
}

function onNearMiss(hazard) {
  setMessage(`Near miss logged at ${formatHazardName(hazard.id)} — memory updated.`, 2200);
}

function agentInteract(item) {
  if (gameOver || !item) return;
  if (item.type === "sigil") {
    activateSigil(item);
    return;
  }
  if (item.type === "beacon") {
    activateBeacon(item);
    return;
  }
  if (item.type === "ampule") {
    activateAmpule(item);
    return;
  }
  if (item.type === "console") {
    activateConsole(item);
    return;
  }
  if (item.type === "relic") {
    activateRelic(item);
    return;
  }
  if (item.type === "terminal") {
    const pos = agentVisual.agent.position;
    const tx = item.mesh.position.x;
    const tz = item.mesh.position.z;
    if (Math.hypot(pos.x - tx, pos.z - tz) > Math.min(item.radius ?? 2.4, 2.4)) return;
    setMessage(item.message, 5000);
  }
}

function resetWorldState() {
  activatedSigils = [];
  activatedBeacons = [];
  activatedAmpules = [];
  activatedConsoles = [];
  activatedRelics = [];
  currentStage = STAGE.ONE;
  oxygen = 100;
  gameOver = false;
  playing = false;
  doorOpening = false;
  stageTransitioning = false;
  if (objectiveCountEl) objectiveCountEl.textContent = "0 / 3";
  oxygenBar.style.width = "100%";
  oxygenBar.style.background = "linear-gradient(90deg, #3fd0ff, #79ffe8)";
  world.door.position.set(0, 2.3, -19.55);
  flickerStarMap(0x58d4ff);
  resetHazardMurals(world.hazards);
  clearStageDefenseHazards(scene, world);
  destroyStagesFrom(scene, world, 2);
  minimap.setStage(STAGE.ONE);
  clearSceneFog(scene);
  renderer.toneMappingExposure = 1.65;
  updateStageHud();
  memory = loadMemory();
  lastHitHazardId = null;
  agentVisual.agent.position.set(0, 0, 28);
  agentVisual.agent.rotation.y = Math.PI;
  camera.position.set(0, 4, 34);
  camera.lookAt(0, 1.4, 28);

  for (const item of world.interactables) {
    if (
      item.type === "sigil" ||
      item.type === "beacon" ||
      item.type === "ampule" ||
      item.type === "console" ||
      item.type === "relic"
    ) {
      item.mesh.userData.activated = false;
      item.mesh.scale.setScalar(1);
      item.mesh.material.emissiveIntensity = 0.65;
    }
  }

  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
}

function resetGame() {
  clearRetryTimer();
  autoRetryUntilWin = false;
  sessionAttempts = 0;
  resetWorldState();
  brain = createAgentBrain(memory);
  updateAgentHud(brain);
  refreshStartScreenMemory();
  overlay.classList.remove("hidden");
  hud.classList.add("hidden");
  if (stageMusic.initialized) setStageMusic("menu");
}

async function startGame({ fromAutoRetry = false, enableAutoRetry = true } = {}) {
  clearRetryTimer();
  resetWorldState();
  beginRun(memory);
  sessionAttempts += 1;

  if (enableAutoRetry) autoRetryUntilWin = true;

  await ensureStageMusic();
  setStageMusic(STAGE.ONE);

  overlay.classList.add("hidden");
  hud.classList.remove("hidden");
  gameOver = false;

  suppressAllHazards(world.hazards);

  brain = createAgentBrain(memory, null, STAGE.ONE);
  pursuerHuntActive = false;
  syncSpectersForStage(STAGE.ONE, agentVisual.agent.position);

  if (brain.policyMode === "rl") {
    brain.rlReasoning =
      ACTIVE_SPECTER_COUNT === 1
        ? "Pure RL — solo Chaser specter (debug mode)"
        : "Pure RL — alpha-pack pursuers active";
    applyPlanToBrain({ ...FALLBACK_PLAN, reasoning: "RL navigation — no LLM planner" });
  } else if (pendingLlmPlan) {
    try {
      const plan = await pendingLlmPlan;
      applyPlanToBrain(plan);
    } catch {
      applyPlanToBrain(FALLBACK_PLAN);
    }
    pendingLlmPlan = null;
  } else if (brain.policyMode !== "rl") {
    consultLlm(fromAutoRetry ? "auto_retry" : "run_start", lastFailureReason, lastHitHazardId).catch(
      () => applyPlanToBrain(FALLBACK_PLAN)
    );
  } else {
    applyPlanToBrain(FALLBACK_PLAN);
  }

  rebuildRoute(brain, agentVisual.agent.position, getActiveHazardList(), activatedSigils, STAGE.ONE);
  playing = true;
  updateStageHud();

  const runNum = memory.runs;
  setMessage(
    fromAutoRetry
      ? `Attempt ${sessionAttempts} · run #${runNum} — agent moving.`
      : usesRlPolicy(brain.policyMode) && ACTIVE_SPECTER_COUNT === 1
        ? `Run #${runNum} — solo specter debug · traps suppressed.`
        : `Run #${runNum} — traps suppressed. Agent navigating.`,
    3500
  );
  updateAgentHud(brain);
}

function updateOxygen(delta) {
  if (!playing || gameOver) return;
  oxygen -= delta * 0.35;
  oxygenBar.style.width = `${Math.max(0, oxygen)}%`;
  if (oxygen <= 25) oxygenBar.style.background = "linear-gradient(90deg, #ff6b5a, #ffb347)";
  if (oxygen <= 0) loseGame("oxygen");
}

function updateWorldAnimations(delta) {
  pulseTime += delta;
  world.starMap.group.rotation.y += delta * 0.25;
  const pulse = 0.65 + Math.sin(pulseTime * 2.2) * 0.2;
  for (const node of world.starMap.nodes) {
    node.material.opacity = pulse;
  }

  if (playing && !gameOver) {
    agentVisual.ring.rotation.z += delta * 0.8;
    agentVisual.visor.material.emissiveIntensity = 0.75 + Math.sin(pulseTime * 3) * 0.2;
  }

  if (world.stage2?.voidGlow) {
    world.stage2.voidGlow.material.opacity = 0.28 + Math.sin(pulseTime * 1.4) * 0.08;
  }
  if (world.stage2?.shuttleRing && activatedBeacons.length >= BEACON_ORDER.length) {
    world.stage2.shuttleRing.rotation.z += delta * 0.6;
  }
  if (world.stage4?.holoRing) {
    world.stage4.holoRing.rotation.z += delta * 0.35;
  }
  if (isGalleryStage(currentStage) && world.galleryStage?.shadowSystem) {
    world.galleryStage.shadowSystem.update(delta, pulseTime);
  }

  stageMusic.update(delta);
}

function updateHazards(delta) {
  if (gameOver || hud.classList.contains("hidden") || !stageHasDefenseMurals(currentStage)) return;
  const pos = getAgentPosition(agentVisual);
  updateHazardMurals(
    getActiveHazardList(),
    new THREE.Vector3(pos.x, pos.y, pos.z),
    delta,
    onHazardHit,
    {
      pursuers: getSpectersForHazards(),
      onSpecterHit: onSpecterDestroyed,
    }
  );
}

function updateMinimap() {
  if (hud.classList.contains("hidden")) return;
  const pos = agentVisual.agent.position;
  minimap.update(
    pos.x,
    pos.z,
    brain.yaw,
    getActiveObjectives(),
    currentStage,
    getSpectersForMinimap()
  );
}

function animate() {
  requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);
  // Wall-clock delta for agent — same on every stage (no FPS-based slowdown in vault/sanctum)
  const agentDelta = Math.min(rawDelta, 0.25);

  if (playing && !gameOver && !stageTransitioning) {
    reactiveTimer += delta;
    rlTick += delta;
    if (reactiveTimer >= REACTIVE_INTERVAL && brain.policyMode !== "rl") {
      reactiveTimer = 0;
      reactiveReplan();
    }
    if (rlTick >= 0.15) {
      rlTick = 0;
      tickRlPolicy();
    }
    pursuerFetchTick += delta;
    if (pursuerFetchTick >= 0.45) {
      pursuerFetchTick = 0;
      fetchPursuerState();
    }

    tickPursuers(agentDelta);
    updateHazards(agentDelta);
    updateAgent({
      agentVisual,
      brain,
      world,
      delta: agentDelta,
      hazards: getActiveHazardList(),
      onInteract: agentInteract,
      onStatus: updateAgentHud,
      onNearMiss,
      onSuppress: onAgentSuppress,
      activatedSigils,
      activatedItems: getActiveObjectives(),
      onMissionComplete: completeMission,
      pursuers: getActivePursuers(),
    });
    updateFollowCamera(agentVisual, brain, camera, delta);
  } else if (!gameOver && (doorOpening || currentStage >= STAGE.TWO)) {
    updateFollowCamera(agentVisual, brain, camera, delta);
  }

  updateOxygen(delta);
  updateWorldAnimations(delta);
  if (!(playing && !gameOver && !stageTransitioning)) {
    updateHazards(delta);
  }
  updateMinimap();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

startBtn.addEventListener("click", async () => {
  sessionAttempts = 0;
  startBtn.disabled = true;
  try {
    await ensureStageMusic();
    await startGame({ enableAutoRetry: true });
  } catch (err) {
    console.error("startGame failed:", err);
    setMessage(`Failed to start: ${err.message}`, 5000);
    overlay.classList.remove("hidden");
    hud.classList.add("hidden");
  }
  startBtn.disabled = false;
});
restartBtn.addEventListener("click", async () => {
  winScreen.classList.add("hidden");
  sessionAttempts = 0;
  await startGame({ enableAutoRetry: true });
});
retryBtn.addEventListener("click", async () => {
  loseScreen.classList.add("hidden");
  await startGame({ enableAutoRetry: false });
});

if (ollamaModelSelect) {
  ollamaModelSelect.addEventListener("change", () => {
    setSelectedModel(ollamaModelSelect.value);
    if (llmStatusEl) {
      const prefix = llmReady ? "Ollama connected" : "Ollama offline — fallback list";
      llmStatusEl.textContent = `${prefix} · ${getSelectedModel()}`;
    }
  });
}

if (musicEnabledEl) {
  musicEnabledEl.addEventListener("change", async () => {
    await ensureStageMusic();
    stageMusic.setEnabled(musicEnabledEl.checked);
  });
}

if (musicVolumeEl) {
  musicVolumeEl.addEventListener("input", async () => {
    await ensureStageMusic();
    stageMusic.setVolume(Number(musicVolumeEl.value) / 100);
  });
}

syncMusicControls();
populatePolicySelect();
syncPolicyControls();

if (policyModeSelect) {
  policyModeSelect.addEventListener("change", () => {
    setPolicyMode(policyModeSelect.value);
    if (brain) brain.policyMode = getPolicyMode();
  });
}

clearMemoryBtn?.addEventListener("click", () => {
  clearRetryTimer();
  autoRetryUntilWin = false;
  memory = resetMemory();
  brain = createAgentBrain(memory);
  refreshStartScreenMemory();
});

window.addEventListener("resize", onResize);

refreshStartScreenMemory();
refreshLlmStatus();
refreshRlStatus();
updateStageHud();
animate();

// Designed by Dang-Tue Hoang, AI Engineer
