import { destroyStage2World } from "./stage2-world.js";
import { destroyStage3World } from "./stage3-world.js";
import { destroyStage4World } from "./stage4-world.js";
import { destroyGalleryStageWorld } from "./gallery-stage-world.js";
import { clearStageDefenseHazards } from "./stage-combat.js";

export function destroyStagesFrom(scene, world, fromStage = 2) {
  clearStageDefenseHazards(scene, world);
  destroyGalleryStageWorld(scene, world);
  if (fromStage <= 4) destroyStage4World(scene, world);
  if (fromStage <= 3) destroyStage3World(scene, world);
  if (fromStage <= 2) destroyStage2World(scene, world);
}

// Designed by Dang-Tue Hoang, AI Engineer
