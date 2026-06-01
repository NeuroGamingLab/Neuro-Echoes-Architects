import * as THREE from "three";
import { mountLitMasterworks } from "./mural-gallery.js";

const STAIR_WALL_X = 1.52;

/** Build lit masterwork placements climbing a gallery stair run. */
export function buildStairMuralPlacements(cfg, stair, atZ, runSeed = 0) {
  if (!stair) return [];

  const { dir, deltaY, steps = 10 } = stair;
  const sign = dir === "up" ? 1 : -1;
  const stepRise = (deltaY / steps) * sign;
  const stepDepth = 1.1;
  const baseY = cfg.floorY;
  const startZ = atZ;
  const placements = [];
  let idx = 0;

  for (let i = 0; i < steps; i++) {
    const stepY = baseY + stepRise * (i + (dir === "up" ? 0 : 1));
    const z = startZ - i * stepDepth * (dir === "up" ? 1 : -1);
    const muralY = stepY + 1.55 + i * 0.04;

    for (const side of ["left", "right"]) {
      const x = side === "left" ? -STAIR_WALL_X : STAIR_WALL_X;
      const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;
      placements.push({
        x,
        y: muralY,
        z,
        rotY,
        width: 0.52 + (idx % 3) * 0.12,
        height: 0.48 + (idx % 2) * 0.14,
        artistIndex: (cfg.artistOffset + runSeed * 7 + idx + (side === "left" ? 0 : 9)) % 18,
      });
      idx++;
    }
  }

  // Landing murals at top and bottom of the flight
  const topY = baseY + deltaY * sign + 1.85;
  const topZ = startZ - (steps - 1) * stepDepth * (dir === "up" ? 1 : -1);
  const botY = baseY + 1.75;
  const botZ = startZ;

  for (const [z, y, seed] of [
    [botZ, botY, 0],
    [topZ, topY, 1],
  ]) {
    for (const side of ["left", "right"]) {
      placements.push({
        x: side === "left" ? -STAIR_WALL_X : STAIR_WALL_X,
        y,
        z,
        rotY: side === "left" ? Math.PI / 2 : -Math.PI / 2,
        width: 0.78,
        height: 0.92,
        artistIndex: (cfg.artistOffset + runSeed * 11 + seed * 5 + (side === "left" ? 3 : 12)) % 18,
      });
    }
  }

  return placements;
}

export function addStairMurals(scene, track, cfg, stair, atZ, runSeed = 0) {
  const placements = buildStairMuralPlacements(cfg, stair, atZ, runSeed);
  if (!placements.length) return;
  mountLitMasterworks(scene, track, placements, "stair");
}

export function addStairEnclosureWalls(scene, materials, track, cfg, stair, atZ) {
  if (!stair) return;

  const { dir, deltaY, steps = 10 } = stair;
  const sign = dir === "up" ? 1 : -1;
  const stepRise = (deltaY / steps) * sign;
  const stepDepth = 1.1;
  const baseY = cfg.floorY;
  const startZ = atZ;

  for (const x of [-STAIR_WALL_X - 0.08, STAIR_WALL_X + 0.08]) {
    for (let i = 0; i < steps; i++) {
      const y = baseY + stepRise * (i + (dir === "up" ? 0 : 1));
      const z = startZ - i * stepDepth * (dir === "up" ? 1 : -1);
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 2.6, stepDepth * 0.98),
        materials.wall
      );
      wall.position.set(x, y + 1.3, z);
      scene.add(wall);
      if (track) track(wall);

      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.07, stepDepth * 0.85),
        materials.strip
      );
      strip.position.set(x * 0.96, y + 0.35, z);
      scene.add(strip);
      if (track) track(strip);
    }
  }
}

// Designed by Dang-Tue Hoang, AI Engineer
