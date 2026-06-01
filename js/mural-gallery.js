import { mountGalleryMural, canvasTexture } from "./mural-mount.js";
import { getMasterwork, drawMasterwork } from "./advanced-mural-art.js";

export const MURAL_THEMES = {
  sanctum: {
    frameColor: 0x181008,
    frameEmissive: 0x503018,
    keyLightColor: 0xfff4e8,
    accentLightColor: 0xff8844,
    spotIntensity: 2.4,
    keyIntensity: 1.75,
    fillIntensity: 1.0,
  },
  gallery: {
    frameColor: 0x1a1410,
    frameEmissive: 0x382818,
    keyLightColor: 0xfff8f0,
    accentLightColor: 0xc9a962,
    spotIntensity: 2.2,
    keyIntensity: 1.65,
    fillIntensity: 0.95,
  },
  galleryWarm: {
    frameColor: 0x181410,
    frameEmissive: 0x403020,
    keyLightColor: 0xfffff0,
    accentLightColor: 0xffaa66,
    spotIntensity: 2.3,
    keyIntensity: 1.7,
    fillIntensity: 1.0,
  },
  galleryCool: {
    frameColor: 0x101820,
    frameEmissive: 0x203040,
    keyLightColor: 0xf0f8ff,
    accentLightColor: 0x58d4ff,
    spotIntensity: 2.2,
    keyIntensity: 1.65,
    fillIntensity: 0.95,
  },
  stair: {
    frameColor: 0x1a1612,
    frameEmissive: 0x3a3020,
    keyLightColor: 0xfffaf0,
    accentLightColor: 0xffcc88,
    spotIntensity: 2.0,
    keyIntensity: 1.5,
    fillIntensity: 0.85,
  },
};

function hiResTexture(artistIndex) {
  return canvasTexture((ctx, w, h) => drawMasterwork(ctx, w, h, artistIndex), 640, 420);
}

/** Mount a masterwork mural with full gallery lighting. */
export function mountLitMasterwork(scene, track, placement, themeName = "gallery") {
  const theme = MURAL_THEMES[themeName] ?? MURAL_THEMES.gallery;
  const mw = getMasterwork(placement.artistIndex ?? placement.artist ?? 0);
  const texture = hiResTexture(placement.artistIndex ?? placement.artist ?? 0);

  return mountGalleryMural(scene, track, {
    texture,
    x: placement.x,
    y: placement.y,
    z: placement.z,
    rotY: placement.rotY,
    width: placement.width,
    height: placement.height,
    frameColor: theme.frameColor,
    frameEmissive: theme.frameEmissive,
    keyLightColor: theme.keyLightColor,
    accentLightColor: theme.accentLightColor,
    addAlcove: false,
    addLights: true,
    spotIntensity: theme.spotIntensity,
    keyIntensity: theme.keyIntensity,
    fillIntensity: theme.fillIntensity,
  });
}

export function mountLitMasterworks(scene, track, placements, themeName = "gallery") {
  for (const p of placements) {
    mountLitMasterwork(scene, track, p, themeName);
  }
}

export function themeForStage(stage) {
  if (stage === 4) return "sanctum";
  if (stage <= 7) return "galleryWarm";
  if (stage <= 11) return "gallery";
  return "galleryCool";
}

// Designed by Dang-Tue Hoang, AI Engineer
