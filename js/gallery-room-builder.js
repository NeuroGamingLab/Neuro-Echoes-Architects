import * as THREE from "three";
import { addStageFillLight, addStageHemisphereFill } from "./stage-lighting.js";
import { getRelicData, getTerminalPosition } from "./gallery-room-shapes.js";

function addBox(scene, materials, size, position, materialKey, track) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials[materialKey]);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (track) track(mesh);
  return mesh;
}

function addRoomLighting(scene, track, cfg, light) {
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const s = cfg.room.size;

  addStageFillLight(scene, track, 0, y + 7, cz, cfg.accentColor, light.fillIntensity * 1.15, light.fillRange);
  addStageHemisphereFill(scene, track, y + 6, cz, cfg.lightColor, 0x101418, light.hemiIntensity * 1.2);

  const grid = [
    [0, cz],
    [-s * 0.45, cz + s * 0.35],
    [s * 0.45, cz - s * 0.35],
    [-s * 0.35, cz - s * 0.4],
    [s * 0.35, cz + s * 0.4],
  ];
  for (const [x, z] of grid) {
    const pl = new THREE.PointLight(cfg.lightColor, light.corridorIntensity * 0.85, light.corridorRange, 1.4);
    pl.position.set(x, y + 3.6, z);
    scene.add(pl);
    if (track) track(pl);
  }

  if (light.ceilingPanel) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.4),
        new THREE.MeshBasicMaterial({ color: cfg.lightColor, transparent: true, opacity: 0.96 })
      );
      panel.rotation.x = Math.PI / 2;
      panel.position.set(Math.cos(a) * s * 0.35, y + 3.85, cz + Math.sin(a) * s * 0.35);
      scene.add(panel);
      if (track) track(panel);
    }
  }
}

function buildSquareRoom(scene, materials, track, cfg) {
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const h = cfg.room.size;

  addBox(scene, materials, [h * 2 + 0.4, 0.22, h * 2 + 0.4], [0, y - 0.02, cz], "floor", track);
  addBox(scene, materials, [h * 2 + 0.8, 0.28, h * 2 + 0.8], [0, y + 4.0, cz], "trim", track);
  addBox(scene, materials, [0.35, 3.9, h * 2 + 0.5], [-h, y + 1.95, cz], "wall", track);
  addBox(scene, materials, [0.35, 3.9, h * 2 + 0.5], [h, y + 1.95, cz], "wall", track);
  addBox(scene, materials, [h * 2 + 0.5, 3.9, 0.35], [0, y + 1.95, cz - h], "wall", track);
  addBox(scene, materials, [h * 2 + 0.5, 3.9, 0.35], [0, y + 1.95, cz + h], "wall", track);
}

function buildCircleRoom(scene, materials, track, cfg) {
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const r = cfg.room.size;

  const floor = track(
    new THREE.Mesh(new THREE.CylinderGeometry(r + 0.2, r + 0.2, 0.22, 32), materials.floor)
  );
  floor.position.set(0, y - 0.02, cz);
  scene.add(floor);

  const ceiling = track(
    new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.26, 32), materials.trim)
  );
  ceiling.position.set(0, y + 4.0, cz);
  scene.add(ceiling);

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const wx = Math.cos(a) * r;
    const wz = cz + Math.sin(a) * r;
    const wall = addBox(scene, materials, [0.32, 3.9, 1.4], [wx, y + 1.95, wz], "wall", track);
    wall.rotation.y = -a + Math.PI / 2;
  }
}

function buildOctagonRoom(scene, materials, track, cfg) {
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const r = cfg.room.size * 0.92;

  const floor = track(
    new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.22, 8), materials.floor)
  );
  floor.position.set(0, y - 0.02, cz);
  scene.add(floor);

  const ceiling = track(
    new THREE.Mesh(new THREE.CylinderGeometry(r + 0.2, r + 0.2, 0.26, 8), materials.trim)
  );
  ceiling.position.set(0, y + 4.0, cz);
  scene.add(ceiling);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const wx = Math.cos(a) * r * 0.96;
    const wz = cz + Math.sin(a) * r * 0.96;
    const wall = addBox(scene, materials, [0.34, 3.9, r * 0.55], [wx, y + 1.95, wz], "wall", track);
    wall.rotation.y = -a + Math.PI / 2;
  }
}

function buildSphereRoom(scene, materials, track, cfg) {
  buildCircleRoom(scene, materials, track, cfg);
  const y = cfg.floorY;
  const cz = cfg.room.centerZ;
  const r = cfg.room.size;

  const dome = track(
    new THREE.Mesh(
      new THREE.SphereGeometry(r + 0.5, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2.15),
      new THREE.MeshStandardMaterial({
        color: 0x1a1820,
        emissive: 0x302840,
        emissiveIntensity: 0.65,
        roughness: 0.82,
        side: THREE.BackSide,
      })
    )
  );
  dome.position.set(0, y + 4.0, cz);
  scene.add(dome);
}

export function buildShapedGalleryRoom(scene, materials, track, cfg, light) {
  const shape = cfg.room.shape;
  if (shape === "square") buildSquareRoom(scene, materials, track, cfg);
  else if (shape === "circle") buildCircleRoom(scene, materials, track, cfg);
  else if (shape === "octagon") buildOctagonRoom(scene, materials, track, cfg);
  else if (shape === "sphere") buildSphereRoom(scene, materials, track, cfg);
  addRoomLighting(scene, track, cfg, light);
}

export function placeShapedRelics(scene, materials, track, world, cfg, light, relicOrder, relicLabels, relicSequence) {
  const relicData = getRelicData(cfg, relicOrder);
  if (!relicData) return;

  for (const data of relicData) {
    const y = data.pos[1];
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

    const glow = new THREE.PointLight(data.color, light.relicGlow * 1.2, 10, 2);
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

  const tp = getTerminalPosition(cfg);
  const terminal = addBox(scene, materials, [1.0, 1.2, 0.32], [tp.x, tp.y + 0.85, tp.z], "trim", track);
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    id: `gallery-terminal-${cfg.stage}`,
    radius: 2.4,
    prompt: "Read gallery manifest",
    message: `${cfg.name}: ${cfg.room.shape} gallery chamber. Alien shadows slide along the walls. Attune ${relicSequence || "Ward \u2192 Seal \u2192 Mark"}.`,
  });
}

// Designed by Dang-Tue Hoang, AI Engineer
