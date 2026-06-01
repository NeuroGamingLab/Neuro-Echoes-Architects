import { mountLitMasterworks, themeForStage } from "./mural-gallery.js";

export function addArtistMurals(scene, track, cfg) {
  const stage = cfg.stage ?? 5;
  const theme = themeForStage(stage);

  if (cfg.muralPlacements?.length) {
    const lit = cfg.muralPlacements.map((p, i) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      rotY: p.rotY,
      width: p.width,
      height: p.height,
      artistIndex: p.artistIndex ?? p.artist ?? (cfg.artistOffset + i) % 18,
    }));
    mountLitMasterworks(scene, track, lit, theme);
    return;
  }

  const placements = [];
  let idx = 0;
  for (let z = cfg.zStart - 2; z >= cfg.zEnd + 2; z -= 3.2) {
    placements.push({
      z,
      side: idx % 2 === 0 ? "left" : "right",
      artistIndex: (cfg.artistOffset + idx) % 18,
      width: 1.25 + (idx % 4) * 0.38,
      height: 0.9 + (idx % 3) * 0.32,
      y: cfg.floorY + 2.15 + (idx % 2) * 0.28,
    });
    idx++;
  }

  const wallX = cfg.wallX + 0.15;
  const lit = placements.map((p) => ({
    x: p.side === "left" ? -wallX : wallX,
    y: p.y,
    z: p.z,
    rotY: p.side === "left" ? Math.PI / 2 : -Math.PI / 2,
    width: p.width,
    height: p.height,
    artistIndex: p.artistIndex,
  }));

  mountLitMasterworks(scene, track, lit, theme);
}

// Designed by Dang-Tue Hoang, AI Engineer
