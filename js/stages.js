import { buildScriptedRoute as buildStage1Route } from "./scripted-route.js";
import { buildStage2Route, BEACON_ORDER, BEACON_LABELS } from "./stage2-route.js";
import { buildStage3Route, AMPULE_ORDER, AMPULE_LABELS } from "./stage3-route.js";
import { buildStage4Route, CONSOLE_ORDER, CONSOLE_LABELS } from "./stage4-route.js";
import {
  STAGE,
  TOTAL_STAGES,
  FIRST_GALLERY_STAGE,
  LAST_STAGE,
  isGalleryStage,
  getGalleryConfig,
  buildGalleryRoute,
  getStageMeta as getGalleryStageMeta,
  getMinimapForGallery,
  getGalleryLightingProfile,
  getRelicOrderForGallery,
  getRelicLabelsForGallery,
  getRelicSequenceForGallery,
} from "./gallery-stages.js";

export {
  STAGE,
  TOTAL_STAGES,
  FIRST_GALLERY_STAGE,
  LAST_STAGE,
  BEACON_ORDER,
  BEACON_LABELS,
  AMPULE_ORDER,
  AMPULE_LABELS,
  CONSOLE_ORDER,
  CONSOLE_LABELS,
  isGalleryStage,
  getGalleryConfig,
  getMinimapForGallery,
  getGalleryLightingProfile,
};

export function getRelicOrderForStage(stage) {
  if (!isGalleryStage(stage)) return null;
  return getRelicOrderForGallery(stage);
}

export function getRelicLabelsForStage(stage) {
  if (!isGalleryStage(stage)) return null;
  return getRelicLabelsForGallery(stage);
}

export function getRelicSequenceForStage(stage) {
  if (!isGalleryStage(stage)) return null;
  return getRelicSequenceForGallery(stage);
}

export function buildRouteForStage(stage, activated = []) {
  if (isGalleryStage(stage)) return buildGalleryRoute(stage, activated);
  switch (stage) {
    case STAGE.FOUR:
      return buildStage4Route(activated);
    case STAGE.THREE:
      return buildStage3Route(activated);
    case STAGE.TWO:
      return buildStage2Route(activated);
    default:
      return buildStage1Route(activated);
  }
}

export function getStageMeta(stage) {
  if (isGalleryStage(stage)) return getGalleryStageMeta(stage);
  switch (stage) {
    case STAGE.FOUR:
      return {
        name: "Juggernaut Sanctum",
        objectiveLabel: "CONSOLES",
        objectiveTotal: CONSOLE_ORDER.length,
        completeMessage: "Ascent protocol engaged. Cryo pod launching.",
      };
    case STAGE.THREE:
      return {
        name: "Ampule Vault",
        objectiveLabel: "AMPULES",
        objectiveTotal: AMPULE_ORDER.length,
        completeMessage: "Containment secured. Sanctum lift open.",
      };
    case STAGE.TWO:
      return {
        name: "Architect's Bridge",
        objectiveLabel: "BEACONS",
        objectiveTotal: BEACON_ORDER.length,
        completeMessage: "Beacon chain restored. Shuttle inbound to vault.",
      };
    default:
      return {
        name: "Entry Chamber",
        objectiveLabel: "SIGILS",
        objectiveTotal: 3,
        completeMessage: "Star map unlocked. Airlock opening.",
      };
  }
}

export function getObjectiveOrderForStage(stage) {
  if (isGalleryStage(stage)) return getRelicOrderForGallery(stage);
  switch (stage) {
    case STAGE.FOUR:
      return CONSOLE_ORDER;
    case STAGE.THREE:
      return AMPULE_ORDER;
    case STAGE.TWO:
      return BEACON_ORDER;
    default:
      return ["sun", "moon", "eye"];
  }
}

// Designed by Dang-Tue Hoang, AI Engineer
