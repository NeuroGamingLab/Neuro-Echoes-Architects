import * as THREE from "three";
import {
  getGalleryConfig,
  getGalleryLightingProfile,
  getRelicLabelsForGallery,
  getRelicOrderForGallery,
  getRelicSequenceForGallery,
} from "./gallery-stages.js";
import { addArtistMurals } from "./artist-murals.js";
import { createGalleryAlienShadows } from "./alien-shadows.js";
import { addCorridorLighting, addStageFillLight, addStageHemisphereFill } from "./stage-lighting.js";
import { buildShapedGalleryRoom, placeShapedRelics } from "./gallery-room-builder.js";
import { addStairMurals, addStairEnclosureWalls } from "./stair-murals.js";

function addBox(scene, materials, size, position, materialKey, track) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials[materialKey]);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (track) track(mesh);
  return mesh;
}

function buildStairRun(scene, materials, track, cfg, stair, atZ, runSeed = 0) {
  if (!stair) return;
  const { dir, deltaY, steps = 10 } = stair;
  const sign = dir === "up" ? 1 : -1;
  const stepRise = (deltaY / steps) * sign;
  const stepDepth = 1.1;
  const baseY = cfg.floorY;
  const startZ = atZ;

  addStairEnclosureWalls(scene, materials, track, cfg, stair, atZ);

  for (let i = 0; i < steps; i++) {
    const y = baseY + stepRise * (i + (dir === "up" ? 0 : 1));
    const z = startZ - i * stepDepth * (dir === "up" ? 1 : -1);
    addBox(scene, materials, [2.8, 0.18, stepDepth * 0.95], [0, y - 0.02, z], "floor", track);
    for (const x of [-1.45, 1.45]) {
      const riser = addBox(scene, materials, [0.12, Math.abs(stepRise) + 0.05, stepDepth], [x, y + stepRise / 2, z], "trim", track);
      riser.material = materials.strip.clone();
      riser.material.emissiveIntensity = 1.2;
    }
  }

  addStairMurals(scene, track, cfg, stair, atZ, runSeed);

  const railLight = new THREE.PointLight(cfg.accentColor, cfg.lighting?.stairLight ?? 1.4, 12, 1.8);
  railLight.position.set(0, baseY + deltaY * sign * 0.5 + 1.2, startZ - steps * stepDepth * 0.45);
  scene.add(railLight);
  if (track) track(railLight);
}

function buildCorridorGallery(scene, materials, track, world, cfg, light, stageNum) {
  const y = cfg.floorY;
  const halfW = cfg.wallX;
  const relicOrder = getRelicOrderForGallery(stageNum);
  const relicLabels = getRelicLabelsForGallery(stageNum);
  const relicSequence = getRelicSequenceForGallery(stageNum);

  if (cfg.stairAtStart) {
    buildStairRun(scene, materials, track, cfg, cfg.stairAtStart, cfg.zStart + 2, 0);
  }

  for (let z = cfg.zStart; z >= cfg.zEnd; z -= 2.5) {
    addBox(scene, materials, [halfW * 2 + 0.2, 0.2, 2.6], [0, y - 0.02, z], "floor", track);
  }

  for (const x of [-halfW, halfW]) {
    for (let z = cfg.zStart; z >= cfg.zEnd; z -= 2.5) {
      addBox(scene, materials, [0.32, 3.8, 2.6], [x, y + 1.9, z], "wall", track);
      if (z % 5 < 2.6) {
        const strip = addBox(scene, materials, [0.08, 0.08, 2.2], [x * 0.94, y + 0.4, z], "strip", track);
        strip.material = materials.strip.clone();
        strip.material.emissiveIntensity = light.stripEmissive;
      }
    }
  }

  if (light.ceilingPanel) {
    for (let z = cfg.zStart; z >= cfg.zEnd; z -= light.corridorStep) {
      const panel = track(
        new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 0.42),
          new THREE.MeshBasicMaterial({ color: cfg.lightColor, transparent: true, opacity: 0.96 })
        )
      );
      panel.rotation.x = Math.PI / 2;
      panel.position.set(0, y + 3.78, z);
      scene.add(panel);
    }
  }

  addBox(scene, materials, [halfW * 2 + 0.5, 0.25, cfg.zStart - cfg.zEnd + 4], [0, y + 3.85, (cfg.zStart + cfg.zEnd) / 2], "trim", track);

  if (cfg.stairAtEnd) {
    buildStairRun(scene, materials, track, { ...cfg, floorY: y }, cfg.stairAtEnd, cfg.zEnd - 1, 1);
  }

  addCorridorLighting(scene, track, {
    zStart: cfg.zStart,
    zEnd: cfg.zEnd,
    step: light.corridorStep,
    color: cfg.lightColor,
    intensity: light.corridorIntensity,
    range: light.corridorRange,
    y: y + 3.4,
    xSpread: light.wallWashSpread,
  });

  if (light.wallWashSpread > 0) {
    addCorridorLighting(scene, track, {
      zStart: cfg.zStart,
      zEnd: cfg.zEnd,
      step: light.corridorStep * 1.5,
      color: cfg.accentColor,
      intensity: light.corridorIntensity * light.wallWashFactor,
      range: light.corridorRange * 0.85,
      y: y + 1.6,
      xSpread: light.wallWashSpread,
    });
  }

  addStageFillLight(scene, track, 0, y + 6, (cfg.zStart + cfg.zEnd) / 2, cfg.accentColor, light.fillIntensity, light.fillRange);
  addStageHemisphereFill(scene, track, y + 5, (cfg.zStart + cfg.zEnd) / 2, cfg.lightColor, 0x101418, light.hemiIntensity);

  addArtistMurals(scene, track, cfg);

  const shadowSystem = createGalleryAlienShadows(scene, track, cfg, 7);

  const zMid = (cfg.zStart + cfg.zEnd) / 2;
  const relicData = [
    { id: relicOrder[0], pos: [-2.2, y, zMid + 5], color: 0x58d4ff },
    { id: relicOrder[1], pos: [2.2, y, zMid], color: 0x9b7bff },
    { id: relicOrder[2], pos: [-2.2, y, zMid - 6], color: 0x79ffe8 },
  ];

  for (const data of relicData) {
    addBox(scene, materials, [1.2, 0.22, 1.2], [data.pos[0], y + 0.11, data.pos[2]], "trim", track);
    const pedestal = track(
      new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 2.2, 8), materials.pillar)
    );
    pedestal.position.set(data.pos[0], y + 1.2, data.pos[2]);
    scene.add(pedestal);

    const node = track(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.85,
          roughness: 0.35,
          metalness: 0.5,
        })
      )
    );
    node.position.set(data.pos[0], y + 2.55, data.pos[2]);
    node.userData.type = "relic";
    node.userData.id = data.id;
    node.userData.activated = false;
    scene.add(node);

    const glow = new THREE.PointLight(data.color, light.relicGlow, 10, 2);
    glow.position.set(data.pos[0], y + 2.8, data.pos[2]);
    scene.add(glow);
    track(glow);

    world.interactables.push({
      mesh: node,
      type: "relic",
      id: data.id,
      radius: 2.4,
      prompt: `Attune ${relicLabels?.[data.id] || data.id}`,
    });
  }

  const terminal = addBox(scene, materials, [1.0, 1.2, 0.32], [1.8, y + 0.85, cfg.zStart - 4], "trim", track);
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    id: `gallery-terminal-${stageNum}`,
    radius: 2.4,
    prompt: "Read gallery manifest",
    message: `${cfg.name}: Famous works line the walls. Alien shadows slide along the stone — only the silhouettes move. Attune ${relicSequence}, then take the stairwell.`,
  });

  return shadowSystem;
}

export function buildGalleryStageWorld(scene, materials, world, stageNum) {
  const cfg = world.galleryConfig ?? getGalleryConfig(stageNum);
  if (!cfg) return null;
  world.galleryConfig = cfg;

  if (world.galleryStage?.stage === stageNum && world.galleryStage?.built) {
    return world.galleryStage;
  }

  destroyGalleryStageWorld(scene, world);

  const meshes = [];
  const track = (mesh) => {
    meshes.push(mesh);
    return mesh;
  };

  const light = getGalleryLightingProfile(stageNum);
  cfg.lighting = light;

  let shadowSystem;

  if (cfg.room.shape === "corridor") {
    shadowSystem = buildCorridorGallery(scene, materials, track, world, cfg, light, stageNum);
  } else {
    const relicOrder = getRelicOrderForGallery(stageNum);
    const relicLabels = getRelicLabelsForGallery(stageNum);
    const relicSequence = getRelicSequenceForGallery(stageNum);
    if (cfg.stairAtStart) buildStairRun(scene, materials, track, cfg, cfg.stairAtStart, cfg.zStart + 2, 0);
    buildShapedGalleryRoom(scene, materials, track, cfg, light);
    addArtistMurals(scene, track, cfg);
    shadowSystem = createGalleryAlienShadows(scene, track, cfg, 9);
    placeShapedRelics(scene, materials, track, world, cfg, light, relicOrder, relicLabels, relicSequence);
    if (cfg.stairAtEnd) buildStairRun(scene, materials, track, cfg, cfg.stairAtEnd, cfg.zEnd - 1, 1);
  }

  world.galleryStage = {
    built: true,
    stage: stageNum,
    meshes,
    shadowSystem,
    cfg,
  };

  return world.galleryStage;
}

export function destroyGalleryStageWorld(scene, world) {
  if (!world.galleryStage?.built) return;

  world.galleryStage.shadowSystem?.dispose();

  for (const mesh of world.galleryStage.meshes) {
    if (mesh?.parent) mesh.parent.remove(mesh);
    else scene.remove(mesh);
    if (mesh?.geometry?.dispose) mesh.geometry.dispose();
    if (mesh?.material?.dispose && mesh.material.isMaterial) mesh.material.dispose();
  }

  world.interactables = world.interactables.filter(
    (item) => item.type !== "relic" && !String(item.id || "").startsWith("gallery-terminal-")
  );

  world.galleryStage = null;
}

// Designed by Dang-Tue Hoang, AI Engineer
