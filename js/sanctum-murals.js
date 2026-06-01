import { mountLitMasterworks, themeForStage } from "./mural-gallery.js";

function sideX(side, wallX) {
  return side === "left" ? -wallX : wallX;
}

function sideRot(side) {
  return side === "left" ? Math.PI / 2 : -Math.PI / 2;
}

export function addSanctumMurals(scene, track) {
  const wallX = 10.55;
  const placements = [
    { z: -88, side: "left", artistIndex: 16, width: 1.15, height: 0.82, y: 2.2 },
    { z: -88, side: "right", artistIndex: 0, width: 1.85, height: 1.22, y: 2.45 },
    { z: -90, side: "left", artistIndex: 3, width: 2.35, height: 1.55, y: 2.58 },
    { z: -90, side: "right", artistIndex: 17, width: 1.05, height: 0.72, y: 2.08 },
    { z: -93, side: "left", artistIndex: 1, width: 1.35, height: 1.75, y: 2.58 },
    { z: -93, side: "right", artistIndex: 5, width: 1.65, height: 1.08, y: 2.32 },
    { z: -96, side: "left", artistIndex: 6, width: 1.55, height: 1.02, y: 2.25 },
    { z: -96, side: "right", artistIndex: 10, width: 2.45, height: 0.98, y: 2.2 },
    { z: -99, side: "left", artistIndex: 4, width: 1.7, height: 1.15, y: 2.38 },
    { z: -99, side: "right", artistIndex: 8, width: 1.12, height: 1.52, y: 2.52 },
    { z: -102, side: "left", artistIndex: 11, width: 2.15, height: 1.42, y: 2.48 },
    { z: -102, side: "right", artistIndex: 2, width: 1.22, height: 0.78, y: 2.1 },
    { z: -105, side: "left", artistIndex: 9, width: 0.95, height: 0.62, y: 2.0 },
    { z: -105, side: "right", artistIndex: 13, width: 1.95, height: 1.28, y: 2.42 },
    { z: -108, side: "left", artistIndex: 12, width: 1.45, height: 1.68, y: 2.55 },
    { z: -108, side: "right", artistIndex: 7, width: 2.25, height: 1.48, y: 2.52 },
    { z: -111, side: "left", artistIndex: 14, width: 1.08, height: 0.72, y: 2.12 },
    { z: -111, side: "right", artistIndex: 15, width: 1.85, height: 1.22, y: 2.45 },
  ];

  const lit = placements.map((p) => ({
    x: sideX(p.side, wallX),
    y: p.y,
    z: p.z,
    rotY: sideRot(p.side),
    width: p.width,
    height: p.height,
    artistIndex: p.artistIndex,
  }));

  mountLitMasterworks(scene, track, lit, "sanctum");
}

// Designed by Dang-Tue Hoang, AI Engineer
