import { HAZARD_DEFS, isInHazardCone, safeLaneX } from "./hazard-geometry.js";

const BOUNDS = { xMin: -10, xMax: 10, zMin: -19, zMax: 28 };
const CELL = 0.45;

const MISSION_NODES = [
  { x: 0, z: 26, observe: "Entry scan." },
  { x: 0, z: 22 },
  { x: -2.2, z: 22, action: "terminal", observe: "Reading expedition log." },
  { x: 2.0, z: 20, observe: "Safe lane — pass Storm Eye." },
  { x: 0, z: 16 },
  { x: -2.0, z: 14, observe: "Safe lane — pass Beam Lens." },
  { x: 2.0, z: 8, observe: "Safe lane — pass Beam Lens (mid)." },
  { x: 0, z: -6, observe: "Chamber entry." },
  { x: -8, z: -2, action: "sigil", id: "sun", observe: "Activating Solar Gate." },
  { x: 0, z: -14, action: "sigil", id: "moon", observe: "Activating Lunar Veil." },
  { x: 8, z: -2, action: "sigil", id: "eye", observe: "Activating Watcher's Eye." },
  { x: 0, z: -17, observe: "Airlock approach." },
];

function cellKey(cx, cz) {
  return `${cx},${cz}`;
}

function worldToCell(x, z) {
  return {
    cx: Math.round((x - BOUNDS.xMin) / CELL),
    cz: Math.round((z - BOUNDS.zMin) / CELL),
  };
}

function cellToWorld(cx, cz) {
  return {
    x: BOUNDS.xMin + cx * CELL,
    z: BOUNDS.zMin + cz * CELL,
  };
}

function maxCellX() {
  return Math.round((BOUNDS.xMax - BOUNDS.xMin) / CELL);
}
function maxCellZ() {
  return Math.round((BOUNDS.zMax - BOUNDS.zMin) / CELL);
}

function isCellBlocked(cx, cz, hazards, llmPolicy) {
  const { x, z } = cellToWorld(cx, cz);
  if (x < BOUNDS.xMin || x > BOUNDS.xMax || z < BOUNDS.zMin || z > BOUNDS.zMax) return true;

  const corridor = Math.abs(x) <= 2.85;
  const chamber = Math.abs(x) <= 10 && z < 2;
  if (!corridor && !chamber) return true;

  for (const def of HAZARD_DEFS) {
    const hazard = hazards.find((h) => h.id === def.id);
    if (hazard?.state === "disabled") continue;

    const margin = llmPolicy?.cautionHazards?.includes(def.id) ? 0.55 : 0.35;
    if (isInHazardCone(x, z, def, margin)) return true;
  }
  return false;
}

function heuristic(ax, az, bx, bz) {
  return Math.abs(ax - bx) + Math.abs(az - bz);
}

function astar(startX, startZ, goalX, goalZ, hazards, llmPolicy) {
  const start = worldToCell(startX, startZ);
  const goal = worldToCell(goalX, goalZ);
  const mx = maxCellX();
  const mz = maxCellZ();

  if (isCellBlocked(goal.cx, goal.cz, hazards, llmPolicy)) {
    const lane = HAZARD_DEFS.map((d) => {
      const h = hazards.find((x) => x.id === d.id);
      if (h?.state === "disabled") return null;
      return { x: safeLaneX(d), z: d.z };
    }).filter(Boolean);
    let best = { x: goalX, z: goalZ };
    let bestD = Infinity;
    for (const p of lane) {
      const d = (p.x - goalX) ** 2 + (p.z - goalZ) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    goalX = best.x;
    goalZ = best.z;
    goal.cx = worldToCell(goalX, goalZ).cx;
    goal.cz = worldToCell(goalX, goalZ).cz;
  }

  const open = [{ cx: start.cx, cz: start.cz, g: 0, f: heuristic(start.cx, start.cz, goal.cx, goal.cz) }];
  const cameFrom = new Map();
  const gScore = new Map([[cellKey(start.cx, start.cz), 0]]);
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.cx === goal.cx && cur.cz === goal.cz) {
      const path = [];
      let k = cellKey(cur.cx, cur.cz);
      let node = { cx: cur.cx, cz: cur.cz };
      while (cameFrom.has(k)) {
        const w = cellToWorld(node.cx, node.cz);
        path.unshift({ x: w.x, z: w.z });
        node = cameFrom.get(k);
        k = cellKey(node.cx, node.cz);
      }
      const sw = cellToWorld(start.cx, start.cz);
      path.unshift({ x: sw.x, z: sw.z });
      return path;
    }

    for (const [dx, dz] of dirs) {
      const nx = cur.cx + dx;
      const nz = cur.cz + dz;
      if (nx < 0 || nz < 0 || nx > mx || nz > mz) continue;
      if (isCellBlocked(nx, nz, hazards, llmPolicy)) continue;

      const nk = cellKey(nx, nz);
      const tentative = (gScore.get(cellKey(cur.cx, cur.cz)) ?? Infinity) + (dx && dz ? 1.42 : 1);
      if (tentative >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, { cx: cur.cx, cz: cur.cz });
      gScore.set(nk, tentative);
      open.push({
        cx: nx,
        cz: nz,
        g: tentative,
        f: tentative + heuristic(nx, nz, goal.cx, goal.cz),
      });
    }
  }

  return [{ x: goalX, z: goalZ }];
}

export function buildSafeMissionRoute(startX, startZ, hazards, llmPolicy, activatedSigils = []) {
  const route = [];
  let sx = startX;
  let sz = startZ;

  for (const node of MISSION_NODES) {
    if (node.action === "sigil" && activatedSigils.includes(node.id)) continue;

    const gx = node.x;
    const gz = node.z;
    const segment = astar(sx, sz, gx, gz, hazards, llmPolicy);
    for (let i = 1; i < segment.length; i++) {
      route.push({ x: segment[i].x, z: segment[i].z, kind: "path" });
    }
    route.push({ ...node, kind: node.action ? "action" : node.observe ? "observe" : "path" });
    sx = gx;
    sz = gz;
  }

  const deduped = [];
  for (const p of route) {
    const last = deduped[deduped.length - 1];
    if (last && Math.hypot(last.x - p.x, last.z - p.z) < 0.35 && last.kind === p.kind && last.action === p.action) continue;
    deduped.push(p);
  }
  return deduped;
}

export { MISSION_NODES };

// Designed by Dang-Tue Hoang, AI Engineer
