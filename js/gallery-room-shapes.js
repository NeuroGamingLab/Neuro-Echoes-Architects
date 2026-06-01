/** Room layout + geometry for gallery stages 6–14 (varied shapes). */

export const VARIANT_SHAPES = [
  "square",
  "circle",
  "octagon",
  "sphere",
  "square",
  "octagon",
  "circle",
  "octagon",
  "sphere",
];

export function getRoomShapeForIndex(index) {
  return index === 0 ? "corridor" : VARIANT_SHAPES[index - 1];
}

function relicPositionsForRoom(shape, y, cz, size) {
  if (shape === "corridor") return null;
  const s = size * 0.72;
  return {
    ward: [-s * 0.85, y, cz + s * 0.35],
    seal: [s * 0.85, y, cz - s * 0.15],
    mark: [-s * 0.55, y, cz - s * 0.75],
  };
}

function terminalPosForRoom(shape, y, cz, size, zStart) {
  if (shape === "corridor") return [1.8, y + 0.85, zStart - 4];
  return [size * 0.55, y + 0.85, cz + size * 0.55];
}

/** Route waypoints inside shaped rooms (not long corridors). */
export function buildShapedRoutePoints(cfg, stage) {
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const s = cfg.room.size;
  const name = cfg.name;
  const order = cfg.relicOrder || ["ward", "seal", "mark"];
  const labels = cfg.relicLabels || { ward: "Ward Relic", seal: "Seal Relic", mark: "Mark Relic" };
  const relicLabel = (id) => labels[id] || id;

  const entry = { x: 0, z: cz + s + 1.2, y, observe: `${name} — entry.` };
  const exit = { x: 0, z: cz - s - 1.2, y, observe: "Stairwell — next deck." };
  const terminal = {
    x: s * 0.55,
    z: cz + s * 0.45,
    y,
    action: "terminal",
    id: `gallery-terminal-${stage}`,
    observe: "Reading gallery manifest.",
  };

  const relics = relicPositionsForRoom(cfg.room.shape, y, cz, s);
  const slots = [relics.ward, relics.seal, relics.mark];
  const relicNode = (slotIdx) => ({
    x: slots[slotIdx][0],
    z: slots[slotIdx][2],
    y,
    action: "relic",
    id: order[slotIdx],
    observe: `${relicLabel(order[slotIdx])}.`,
  });
  const a = relicNode(0);
  const b = relicNode(1);
  const c = relicNode(2);

  if (cfg.room.shape === "circle" || cfg.room.shape === "sphere") {
    const r = s * 0.62;
    return [
      entry,
      terminal,
      { x: -r, z: cz + r * 0.3, y, action: "relic", id: order[0], observe: `${relicLabel(order[0])}.` },
      { x: r, z: cz, y, action: "relic", id: order[1], observe: `${relicLabel(order[1])}.` },
      { x: -r * 0.5, z: cz - r, y, action: "relic", id: order[2], observe: `${relicLabel(order[2])}.` },
      exit,
    ];
  }

  if (cfg.room.shape === "octagon") {
    const r = s * 0.58;
    return [
      entry,
      terminal,
      { x: -r, z: cz + r * 0.4, y, action: "relic", id: order[0], observe: `${relicLabel(order[0])}.` },
      { x: r, z: cz, y, action: "relic", id: order[1], observe: `${relicLabel(order[1])}.` },
      { x: 0, z: cz - r, y, action: "relic", id: order[2], observe: `${relicLabel(order[2])}.` },
      exit,
    ];
  }

  // square + default
  return [entry, terminal, a, b, c, exit];
}

/** Mural slots on perimeter walls for shaped rooms. */
export function buildMuralPlacements(cfg) {
  const y = cfg.floorY + 2.1;
  const cz = cfg.room.centerZ;
  const size = cfg.room.size;
  const shape = cfg.room.shape;
  const placements = [];
  let idx = 0;

  const pushMural = (x, z, rotY) => {
    placements.push({
      x,
      z,
      rotY,
      y: y + (idx % 2) * 0.28,
      artistIndex: (cfg.artistOffset + idx) % 18,
      width: 1.2 + (idx % 4) * 0.38,
      height: 0.88 + (idx % 3) * 0.32,
    });
    idx++;
  };

  if (shape === "square") {
    const h = size;
    for (let t = -h + 1.5; t <= h - 1.5; t += 2.8) {
      pushMural(-h, cz + t, Math.PI / 2);
      pushMural(h, cz + t, -Math.PI / 2);
    }
    for (let t = -h + 1.5; t <= h - 1.5; t += 2.8) {
      pushMural(t, cz - h, 0);
      pushMural(t, cz + h, Math.PI);
    }
    return placements;
  }

  if (shape === "circle" || shape === "sphere") {
    const r = size * 0.92;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      pushMural(x, z, a + Math.PI / 2);
    }
    return placements;
  }

  if (shape === "octagon") {
    const r = size * 0.88;
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      const mx = (Math.cos(a0) + Math.cos(a1)) * 0.5 * r;
      const mz = cz + (Math.sin(a0) + Math.sin(a1)) * 0.5 * r;
      const rot = Math.atan2(Math.sin(a0) + Math.sin(a1), Math.cos(a0) + Math.cos(a1)) + Math.PI / 2;
      pushMural(mx, mz, rot);
      const mx2 = mx + Math.cos(rot) * 0.01;
      const mz2 = mz + Math.sin(rot) * 0.01;
      pushMural(mx2, mz2, rot);
    }
    return placements;
  }

  return placements;
}

/** Wall paths for alien shadows — only along walls. */
export function buildShadowWallPaths(cfg) {
  const cz = cfg.room.centerZ;
  const size = cfg.room.size;
  const shape = cfg.room.shape;
  const inset = size * 0.92;

  if (shape === "corridor") return null;

  if (shape === "square") {
    const h = inset;
    return [
      { type: "line", axis: "z", fixed: -h, min: cz - h, max: cz + h, normal: "west" },
      { type: "line", axis: "z", fixed: h, min: cz - h, max: cz + h, normal: "east" },
      { type: "line", axis: "x", fixed: cz - h, min: -h, max: h, normal: "north" },
      { type: "line", axis: "x", fixed: cz + h, min: -h, max: h, normal: "south" },
    ];
  }

  if (shape === "circle" || shape === "sphere" || shape === "octagon") {
    const segments = shape === "octagon" ? 8 : 16;
    const r = inset;
    const paths = [];
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      paths.push({
        type: "arc",
        cx: 0,
        cz,
        r,
        a0,
        a1,
      });
    }
    return paths;
  }

  return null;
}

export function getRoomBounds(cfg) {
  const pad = 2;
  const cz = cfg.room.centerZ;
  const s = cfg.room.size + pad;
  return {
    xMin: -s,
    xMax: s,
    zMin: cz - s,
    zMax: cz + s,
  };
}

export function getRelicData(cfg, relicOrder = null) {
  const pos = relicPositionsForRoom(cfg.room.shape, cfg.floorY, cfg.room.centerZ, cfg.room.size);
  if (!pos) return null;
  const order = relicOrder && relicOrder.length >= 3 ? relicOrder : ["ward", "seal", "mark"];
  return [
    { id: order[0], pos: pos.ward, color: 0x58d4ff },
    { id: order[1], pos: pos.seal, color: 0x9b7bff },
    { id: order[2], pos: pos.mark, color: 0x79ffe8 },
  ];
}

export function getTerminalPosition(cfg) {
  const p = terminalPosForRoom(cfg.room.shape, cfg.floorY, cfg.room.centerZ, cfg.room.size, cfg.zStart);
  return { x: p[0], y: p[1] - 0.85, z: p[2] };
}

// Designed by Dang-Tue Hoang, AI Engineer
