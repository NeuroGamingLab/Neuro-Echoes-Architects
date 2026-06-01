/** Stages 5–14: gallery corridors with stairs, artist murals, relic objectives. */

import {
  getRoomShapeForIndex,
  buildShapedRoutePoints,
  buildMuralPlacements,
  buildShadowWallPaths,
  getRoomBounds,
} from "./gallery-room-shapes.js";

export const STAGE = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  ELEVEN: 11,
  TWELVE: 12,
  THIRTEEN: 13,
  FOURTEEN: 14,
};

export const TOTAL_STAGES = 14;
export const FIRST_GALLERY_STAGE = STAGE.FIVE;
export const LAST_STAGE = STAGE.FOURTEEN;

// Default relic set (used as a fallback and as Stage 5's set).
export const RELIC_ORDER = ["ward", "seal", "mark"];
export const RELIC_LABELS = { ward: "Ward Relic", seal: "Seal Relic", mark: "Mark Relic" };

const GALLERY_RELIC_SETS = [
  // Stage 5
  { order: ["ward", "seal", "mark"], labels: { ward: "Ward Relic", seal: "Seal Relic", mark: "Mark Relic" } },
  // Stage 6
  { order: ["cipher", "prism", "keystone"], labels: { cipher: "Cipher Relic", prism: "Prism Relic", keystone: "Keystone Relic" } },
  // Stage 7
  { order: ["lantern", "spiral", "thorn"], labels: { lantern: "Lantern Relic", spiral: "Spiral Relic", thorn: "Thorn Relic" } },
  // Stage 8
  { order: ["crown", "chalice", "shroud"], labels: { crown: "Crown Relic", chalice: "Chalice Relic", shroud: "Shroud Relic" } },
  // Stage 9
  { order: ["compass", "sigil", "ember"], labels: { compass: "Compass Relic", sigil: "Sigil Relic", ember: "Ember Relic" } },
  // Stage 10
  { order: ["talisman", "mirror", "shard"], labels: { talisman: "Talisman Relic", mirror: "Mirror Relic", shard: "Shard Relic" } },
  // Stage 11
  { order: ["diadem", "veil", "glyph"], labels: { diadem: "Diadem Relic", veil: "Veil Relic", glyph: "Glyph Relic" } },
  // Stage 12
  { order: ["conduit", "nexus", "rune"], labels: { conduit: "Conduit Relic", nexus: "Nexus Relic", rune: "Rune Relic" } },
  // Stage 13
  { order: ["chorus", "lattice", "omen"], labels: { chorus: "Chorus Relic", lattice: "Lattice Relic", omen: "Omen Relic" } },
  // Stage 14
  { order: ["horizon", "reliquary", "ascendant"], labels: { horizon: "Horizon Relic", reliquary: "Reliquary Relic", ascendant: "Ascendant Relic" } },
];

function relicSetForStage(stage) {
  const idx = Math.max(0, Math.min(GALLERY_RELIC_SETS.length - 1, stage - STAGE.FIVE));
  return GALLERY_RELIC_SETS[idx] || GALLERY_RELIC_SETS[0];
}

function relicSequenceText(set) {
  const parts = (set?.order || RELIC_ORDER).map((id) => {
    const label = set?.labels?.[id] || RELIC_LABELS[id] || id;
    return String(label).split(" ")[0] || id;
  });
  return parts.join(" \u2192 ");
}

const GALLERY_NAMES = [
  "Renaissance Ascent",
  "Baroque Descent",
  "Impressionist Rise",
  "Dutch Gallery Fall",
  "Romantic Climb",
  "Realist Descent",
  "Symbolist Ascent",
  "Modernist Drop",
  "Cubist Rise",
  "Surrealist Descent",
];

function makeGalleryStage(index) {
  const n = index + 5;
  const i = index;
  // Keep gallery decks well separated from Stage 4 (sanctum) so each stage
  // reads as a distinct physical area and the agent's movement bounds match the minimap.
  const zStart = -150 - i * 30;
  const zEnd = zStart - 26;
  const floorY = i % 2 === 0 ? 0 : 2.5;
  const centerZ = (zStart + zEnd) / 2;
  const shape = getRoomShapeForIndex(i);
  const isCorridor = shape === "corridor";
  const roomSize = 6.5 + (i % 4) * 0.85;

  const stairAtStart = i === 0 ? null : { dir: i % 2 === 0 ? "down" : "up", deltaY: 2.5, steps: 10 };
  const stairAtEnd = { dir: i % 2 === 0 ? "up" : "down", deltaY: 2.5, steps: 10 };
  const artistOffset = (i * 3) % 10;

  const cfg = {
    stage: n,
    name: GALLERY_NAMES[i],
    tagline: isCorridor
      ? `Gallery deck ${n - 4} — ascending stairwell.`
      : `${GALLERY_NAMES[i]} — ${shape} chamber.`,
    zStart,
    zEnd,
    floorY,
    stairAtStart,
    stairAtEnd,
    wallX: isCorridor ? 2.35 : roomSize,
    artistOffset,
    lightColor: i % 2 === 0 ? 0xfff0e0 : 0xe8f4ff,
    accentColor: i % 3 === 0 ? 0xc9a962 : i % 3 === 1 ? 0x9b7bff : 0x58d4ff,
    room: {
      shape,
      centerX: 0,
      centerZ,
      size: roomSize,
    },
  };

  const relicSet = relicSetForStage(n);
  cfg.relicOrder = relicSet.order;
  cfg.relicLabels = relicSet.labels;
  cfg.relicSequence = relicSequenceText(relicSet);

  if (!isCorridor) {
    cfg.muralPlacements = buildMuralPlacements(cfg);
    cfg.shadowWallPaths = buildShadowWallPaths(cfg);
  }

  return cfg;
}

export const GALLERY_STAGE_CONFIGS = Array.from({ length: 10 }, (_, i) => makeGalleryStage(i));

export function getGalleryConfig(stage) {
  return GALLERY_STAGE_CONFIGS.find((c) => c.stage === stage) ?? null;
}

export function getRelicOrderForGallery(stage) {
  return getGalleryConfig(stage)?.relicOrder || RELIC_ORDER;
}

export function getRelicLabelsForGallery(stage) {
  return getGalleryConfig(stage)?.relicLabels || RELIC_LABELS;
}

export function getRelicSequenceForGallery(stage) {
  const cfg = getGalleryConfig(stage);
  if (!cfg) return relicSequenceText(relicSetForStage(stage));
  return cfg.relicSequence || relicSequenceText({ order: cfg.relicOrder, labels: cfg.relicLabels });
}

/** Stage 5 = baseline gallery light; stages 6–14 ramp up progressively. */
export function getGalleryLightingProfile(stage) {
  const base = {
    corridorIntensity: 2.1,
    corridorStep: 3.5,
    corridorRange: 22,
    fillIntensity: 3.0,
    fillRange: 52,
    hemiIntensity: 1.1,
    stripEmissive: 1.6,
    wallWashSpread: 0,
    wallWashFactor: 0,
    relicGlow: 0.85,
    stairLight: 1.4,
    ceilingPanel: false,
    exposure: 1.75,
  };

  if (stage < STAGE.SIX) return base;

  const tier = stage - STAGE.SIX;
  const t = tier / (STAGE.FOURTEEN - STAGE.SIX);

  return {
    corridorIntensity: 2.3 + t * 2.4,
    corridorStep: Math.max(2.2, 3.5 - t * 1.2),
    corridorRange: 24 + t * 14,
    fillIntensity: 3.4 + t * 3.2,
    fillRange: 56 + t * 20,
    hemiIntensity: 1.25 + t * 1.25,
    stripEmissive: 1.75 + t * 1.85,
    wallWashSpread: 1.5 + t * 0.7,
    wallWashFactor: 0.65 + t * 0.4,
    relicGlow: 1.0 + t * 0.9,
    stairLight: 1.6 + t * 1.4,
    ceilingPanel: true,
    exposure: 1.85 + t * 0.5,
  };
}

export function isGalleryStage(stage) {
  return stage >= FIRST_GALLERY_STAGE && stage <= LAST_STAGE;
}

export function buildGalleryRoute(stage, activatedRelics = []) {
  const cfg = getGalleryConfig(stage);
  if (!cfg) return [];

  if (cfg.room.shape !== "corridor") {
    return buildShapedRoutePoints(cfg, stage).filter(
      (node) => !(node.action === "relic" && activatedRelics.includes(node.id))
    );
  }

  const zMid = (cfg.zStart + cfg.zEnd) / 2;
  const y = cfg.floorY;
  const order = cfg.relicOrder || RELIC_ORDER;
  const labels = cfg.relicLabels || RELIC_LABELS;
  const nodes = [
    { x: 0, z: cfg.zStart + 1, y, observe: `${cfg.name} — entry.` },
    {
      x: 1.8,
      z: cfg.zStart - 4,
      y,
      action: "terminal",
      id: `gallery-terminal-${stage}`,
      observe: "Reading gallery manifest.",
    },
    { x: -2.2, z: zMid + 5, y, action: "relic", id: order[0], observe: labels[order[0]] || order[0] },
    { x: 2.2, z: zMid, y, action: "relic", id: order[1], observe: labels[order[1]] || order[1] },
    { x: -2.2, z: zMid - 6, y, action: "relic", id: order[2], observe: labels[order[2]] || order[2] },
    { x: 0, z: cfg.zEnd + 2, y, observe: "Stairwell — next deck." },
  ];

  return nodes.filter((node) => !(node.action === "relic" && activatedRelics.includes(node.id)));
}

export function getStageMeta(stage) {
  if (isGalleryStage(stage)) {
    const cfg = getGalleryConfig(stage);
    const total = cfg?.relicOrder?.length || RELIC_ORDER.length;
    return {
      name: cfg?.name ?? `Gallery ${stage}`,
      objectiveLabel: "RELICS",
      objectiveTotal: total,
      completeMessage: cfg?.tagline ?? "Gallery deck cleared.",
    };
  }
  return null;
}

export function getMinimapForGallery(stage) {
  const cfg = getGalleryConfig(stage);
  if (!cfg) return null;

  const isCorridor = cfg.room.shape === "corridor";
  const bounds = isCorridor
    ? { xMin: -cfg.wallX - 4, xMax: cfg.wallX + 4, zMin: cfg.zEnd - 4, zMax: cfg.zStart + 4 }
    : getRoomBounds(cfg);

  const cz = cfg.room.centerZ;
  const relics = isCorridor
    ? {
        slot0: { x: -2.2, z: (cfg.zStart + cfg.zEnd) / 2 + 5 },
        slot1: { x: 2.2, z: (cfg.zStart + cfg.zEnd) / 2 },
        slot2: { x: -2.2, z: (cfg.zStart + cfg.zEnd) / 2 - 6 },
        log: { x: 1.8, z: cfg.zStart - 4 },
        stairs: { x: 0, z: cfg.zEnd + 2 },
      }
    : {
        slot0: { x: -cfg.room.size * 0.6, z: cz + cfg.room.size * 0.25 },
        slot1: { x: cfg.room.size * 0.6, z: cz },
        slot2: { x: 0, z: cz - cfg.room.size * 0.65 },
        log: { x: cfg.room.size * 0.5, z: cz + cfg.room.size * 0.45 },
        stairs: { x: 0, z: cz - cfg.room.size - 1 },
      };

  const order = cfg.relicOrder || RELIC_ORDER;
  const labels = cfg.relicLabels || RELIC_LABELS;
  const shortLabel = (id) => {
    const label = labels?.[id] || id;
    const first = String(label).trim().split(/\s+/)[0] || id;
    return first.slice(0, 1).toUpperCase() || "R";
  };

  return {
    bounds,
    rooms: [
      {
        label: cfg.name,
        x: bounds.xMin,
        z: bounds.zMin,
        w: bounds.xMax - bounds.xMin,
        h: bounds.zMax - bounds.zMin,
        kind: isCorridor ? "gallery" : cfg.room.shape,
      },
    ],
    markers: [
      { id: "log", label: "Log", x: relics.log.x, z: relics.log.z, color: "#c9a962", shape: "square" },
      { id: order[0], label: shortLabel(order[0]), x: relics.slot0.x, z: relics.slot0.z, color: "#58d4ff", shape: "diamond", kind: "objective" },
      { id: order[1], label: shortLabel(order[1]), x: relics.slot1.x, z: relics.slot1.z, color: "#9b7bff", shape: "diamond", kind: "objective" },
      { id: order[2], label: shortLabel(order[2]), x: relics.slot2.x, z: relics.slot2.z, color: "#79ffe8", shape: "diamond", kind: "objective" },
      { id: "stairs", label: "↕", x: relics.stairs.x, z: relics.stairs.z, color: "#ffffff", shape: "door" },
    ],
  };
}

// Designed by Dang-Tue Hoang, AI Engineer
