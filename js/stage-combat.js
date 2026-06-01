/** Specters + laser/lightning defense murals for all stages. */

import * as THREE from "three";
import { STAGE, getGalleryConfig, isGalleryStage } from "./gallery-stages.js";
import {
  createDefenseHazardMural,
  disposeDefenseHazardMural,
  resetHazardMurals,
  suppressAllHazards,
} from "./hazard-murals.js";

export function stageHasSpecters(stage) {
  return stage >= STAGE.ONE;
}

export function stageHasDefenseMurals(stage) {
  return stage >= STAGE.ONE;
}

function spreadAlongZ(zStart, zEnd, index, total = 4) {
  const t = (index + 1) / (total + 1);
  return zStart + (zEnd - zStart) * t;
}

function stage2Placements() {
  const y = 2.15;
  // Bridge is narrow; place defense murals just beyond the rail line.
  const wallX = 2.45;
  const muzzleX = 2.15;
  const zValues = [-26, -32, -38, -46];
  const types = ["lightning", "laser", "laser", "lightning"];
  const sides = ["left", "right", "left", "right"];

  return zValues.map((z, i) => {
    const side = sides[i];
    const onLeft = side === "left";
    return {
      id: `${types[i]}-b${Math.abs(z)}`,
      z,
      y,
      x: onLeft ? -wallX : wallX,
      muzzleX: onLeft ? -muzzleX : muzzleX,
      side,
      type: types[i],
      range: types[i] === "lightning" ? 14 : 15,
    };
  });
}

function stage3Placements() {
  const y = 2.15;
  // Vault walls sit around x≈±9.2; inset slightly so the texture plane is visible.
  const wallX = 9.05;
  const muzzleX = 8.75;
  const zValues = [-60, -68, -76, -82];
  const types = ["lightning", "laser", "laser", "lightning"];
  const sides = ["left", "right", "left", "right"];

  return zValues.map((z, i) => {
    const side = sides[i];
    const onLeft = side === "left";
    return {
      id: `${types[i]}-v${Math.abs(z)}`,
      z,
      y,
      x: onLeft ? -wallX : wallX,
      muzzleX: onLeft ? -muzzleX : muzzleX,
      side,
      type: types[i],
      range: types[i] === "lightning" ? 14 : 15,
    };
  });
}

function stage4Placements() {
  const y = 2.15;
  const wallX = 10.75;
  const muzzleX = 10.45;
  const zValues = [-90, -96, -102, -108];
  const types = ["lightning", "laser", "laser", "lightning"];
  const sides = ["left", "right", "left", "right"];

  return zValues.map((z, i) => {
    const side = sides[i];
    const onLeft = side === "left";
    return {
      id: `${types[i]}-${Math.abs(z)}`,
      z,
      y,
      x: onLeft ? -wallX : wallX,
      muzzleX: onLeft ? -muzzleX : muzzleX,
      side,
      type: types[i],
      range: types[i] === "lightning" ? 15 : 16,
    };
  });
}

function galleryCorridorPlacements(cfg) {
  const y = cfg.floorY + 2.15;
  const wallX = cfg.wallX + 0.55;
  const muzzleX = cfg.wallX + 0.38;
  const types = ["lightning", "laser", "laser", "lightning"];
  const sides = ["left", "right", "left", "right"];

  return types.map((type, i) => {
    const side = sides[i];
    const onLeft = side === "left";
    const z = spreadAlongZ(cfg.zStart, cfg.zEnd, i);
    return {
      id: `${type}-g${cfg.stage}-${Math.round(Math.abs(z))}`,
      z,
      y,
      x: onLeft ? -wallX : wallX,
      muzzleX: onLeft ? -muzzleX : muzzleX,
      side,
      type,
      range: type === "lightning" ? 14 : 15,
    };
  });
}

function galleryRoomPlacements(cfg) {
  const y = cfg.floorY + 2.15;
  const s = cfg.room.size * 0.88;
  const cz = cfg.room.centerZ;
  const types = ["lightning", "laser", "laser", "lightning"];
  const slots = [
    { x: -s, z: cz + 2.5, side: "left" },
    { x: s, z: cz - 1.5, side: "right" },
    { x: -s, z: cz - 4.5, side: "left" },
    { x: s, z: cz + 4.5, side: "right" },
  ];

  return slots.map((slot, i) => {
    const onLeft = slot.side === "left";
    const inset = 0.28;
    return {
      id: `${types[i]}-g${cfg.stage}-r${i}`,
      z: slot.z,
      y,
      x: onLeft ? slot.x - inset : slot.x + inset,
      muzzleX: onLeft ? slot.x + inset : slot.x - inset,
      side: slot.side,
      type: types[i],
      range: types[i] === "lightning" ? 14 : 15,
    };
  });
}

export function defenseHazardPlacements(stage, world = null) {
  if (stage === STAGE.FOUR) return stage4Placements();
  if (stage === STAGE.THREE) return stage3Placements();
  if (stage === STAGE.TWO) return stage2Placements();
  if (!isGalleryStage(stage)) return [];

  const cfg = world?.galleryConfig ?? getGalleryConfig(stage);
  if (!cfg) return [];
  if (cfg.room.shape === "corridor") return galleryCorridorPlacements(cfg);
  return galleryRoomPlacements(cfg);
}

export function clearStageDefenseHazards(scene, world) {
  if (!world?.stageDefenseHazards?.length) {
    world.stageDefenseHazards = [];
    return;
  }
  for (const h of world.stageDefenseHazards) {
    disposeDefenseHazardMural(scene, h);
  }
  world.stageDefenseHazards = [];
}

export function installStageDefenseHazards(scene, world, stage, { agentGraceMs = 45000 } = {}) {
  clearStageDefenseHazards(scene, world);
  if (!stageHasDefenseMurals(stage) || stage === STAGE.ONE) return [];

  const defs = defenseHazardPlacements(stage, world);
  const hazards = defs.map((def) => createDefenseHazardMural(scene, def));
  world.stageDefenseHazards = hazards;

  if (agentGraceMs > 0) {
    suppressAllHazards(hazards, agentGraceMs);
  } else {
    resetHazardMurals(hazards);
  }

  return hazards;
}

export function getCombatHazards(world, stage) {
  if (stage === STAGE.ONE) return world.hazards ?? [];
  if (stageHasDefenseMurals(stage)) return world.stageDefenseHazards ?? [];
  return [];
}

// Designed by Dang-Tue Hoang, AI Engineer
