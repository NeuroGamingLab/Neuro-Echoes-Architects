/** Shared hazard zone math (matches hazard-murals.js behavior). */

export const HAZARD_DEFS = [
  { id: "lightning-21", z: 21, side: "left", type: "lightning", range: 14 },
  { id: "laser-14", z: 14, side: "right", type: "laser", range: 16 },
  { id: "laser-6", z: 6, side: "left", type: "laser", range: 15 },
  { id: "lightning-0", z: 0, side: "right", type: "lightning", range: 14 },
];

export function hazardDefFrom(hazard) {
  return (
    HAZARD_DEFS.find((d) => d.id === hazard.id) || {
      id: hazard.id,
      z: hazard.mesh?.position?.z ?? 0,
      x: hazard.mesh?.position?.x,
      muzzleX: hazard.muzzle?.x,
      side: hazard.side,
      type: hazard.type,
      range: hazard.range ?? 14,
    }
  );
}

export function hazardMuzzle(def) {
  if (def.muzzleX != null) {
    return { x: def.muzzleX, z: def.z ?? 0 };
  }
  return {
    x: def.side === "left" ? -2.75 : 2.75,
    z: def.z,
  };
}

export function hazardForward(def) {
  return def.side === "left" ? { x: 1, z: 0 } : { x: -1, z: 0 };
}

/** Safe crossing lane — corridor offset for Stage 1, center line for wide stages. */
export function safeLaneX(def) {
  const m = hazardMuzzle(def);
  if (Math.abs(m.x) > 4) return 0;
  return def.side === "left" ? 2.0 : -2.0;
}

/** Point in mural line-of-fire cone (horizontal). */
export function isInHazardCone(px, pz, def, extraMargin = 0) {
  const m = hazardMuzzle(def);
  const fwd = hazardForward(def);
  const dx = px - m.x;
  const dz = pz - m.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > def.range + extraMargin) return false;
  if (dist < 0.15) return true;
  const dot = (dx * fwd.x + dz * fwd.z) / dist;
  return dot > 0.55;
}

export function isInDangerZone(px, pz, hazard, extraMargin = 0.35) {
  if (!hazard || hazard.state === "disabled") return false;
  if (hazard.suppressMode === "agent-only") return false;
  const def = hazardDefFrom(hazard);
  return isInHazardCone(px, pz, def, extraMargin);
}

export function segmentCrossesDanger(x0, z0, x1, z1, hazards, steps = 12) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const z = z0 + (z1 - z0) * t;
    for (const h of hazards) {
      if (h.state === "disabled") continue;
      if (h.suppressMode === "agent-only") continue;
      if (isInDangerZone(x, z, h)) return h;
    }
  }
  return null;
}

export function getHazardStateSummary(hazards) {
  return hazards.map((h) => ({
    id: h.id,
    state: h.state,
    side: h.side,
    z: h.mesh.position.z,
    disabled: h.state === "disabled",
  }));
}

// Designed by Dang-Tue Hoang, AI Engineer
