import { STAGE, getGalleryConfig, isGalleryStage } from "./gallery-stages.js";
import { getRoomBounds } from "./gallery-room-shapes.js";

const STAGE1 = { xMin: -10, xMax: 10, zMin: -19, zMax: 28, corridorX: 2.85, corridorZMin: 2 };
const STAGE2 = { xMin: -8, xMax: 8, zMin: -52, zMax: -18 };
const STAGE3 = { xMin: -10, xMax: 10, zMin: -88, zMax: -48 };
const STAGE4 = { xMin: -12, xMax: 12, zMin: -116, zMax: -82 };

function galleryBounds(cfg) {
  if (cfg.room.shape === "corridor") {
    const inset = 0.45;
    return {
      xMin: -cfg.wallX + inset,
      xMax: cfg.wallX - inset,
      zMin: cfg.zEnd + 0.6,
      zMax: cfg.zStart - 0.6,
    };
  }
  const room = getRoomBounds(cfg);
  return {
    xMin: room.xMin + 0.5,
    xMax: room.xMax - 0.5,
    zMin: room.zMin + 0.5,
    zMax: room.zMax - 0.5,
  };
}

/** Walkable rectangle (+ corridor rules for stage 1) for the active stage. */
export function getMovementBounds(stage, world = null) {
  if (isGalleryStage(stage)) {
    const cfg = world?.galleryConfig ?? getGalleryConfig(stage);
    return cfg ? galleryBounds(cfg) : STAGE1;
  }
  switch (stage) {
    case STAGE.TWO:
      return STAGE2;
    case STAGE.THREE:
      return STAGE3;
    case STAGE.FOUR:
      return STAGE4;
    default:
      return STAGE1;
  }
}

function applyStage1Corridor(pos, bounds) {
  if (pos.z >= bounds.corridorZMin && Math.abs(pos.x) > bounds.corridorX) {
    pos.x = Math.sign(pos.x) * bounds.corridorX;
  }
}

/** Keep agent inside the playable floor for the current stage. */
export function clampAgentPosition(pos, stage, world = null) {
  const bounds = getMovementBounds(stage, world);
  pos.x = Math.max(bounds.xMin, Math.min(bounds.xMax, pos.x));
  pos.z = Math.max(bounds.zMin, Math.min(bounds.zMax, pos.z));
  if (bounds.corridorX != null) applyStage1Corridor(pos, bounds);
  return pos;
}

/** Push flee direction away from walls so evasion stays in-bounds. */
export function repelFromBounds(px, pz, vx, vz, stage, world = null) {
  const bounds = getMovementBounds(stage, world);
  const margin = 1.4;
  let rx = 0;
  let rz = 0;

  if (px < bounds.xMin + margin) rx += bounds.xMin + margin - px;
  if (px > bounds.xMax - margin) rx -= px - (bounds.xMax - margin);
  if (pz < bounds.zMin + margin) rz += bounds.zMin + margin - pz;
  if (pz > bounds.zMax - margin) rz -= pz - (bounds.zMax - margin);

  if (bounds.corridorX != null && pz >= bounds.corridorZMin) {
    const cx = bounds.corridorX - 0.25;
    if (px > cx) rx -= px - cx;
    if (px < -cx) rx += -cx - px;
  }

  if (Math.abs(rx) < 0.01 && Math.abs(rz) < 0.01) return { vx, vz };

  const blend = 0.55;
  const mx = vx + rx * blend;
  const mz = vz + rz * blend;
  const mag = Math.hypot(mx, mz) || 1;
  return { vx: (mx / mag) * Math.hypot(vx, vz), vz: (mz / mag) * Math.hypot(vx, vz) };
}

// Designed by Dang-Tue Hoang, AI Engineer
