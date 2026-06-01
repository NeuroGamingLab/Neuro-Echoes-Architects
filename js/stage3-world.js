import * as THREE from "three";
import { AMPULE_LABELS } from "./stage3-route.js";
import { addVaultMurals } from "./vault-murals.js";
import {
  addCorridorLighting,
  addStageFillLight,
  addStageHemisphereFill,
  addTunnelSegment,
} from "./stage-lighting.js";

function addBox(scene, materials, size, position, materialKey = "wall", receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials[materialKey]);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

function addGooPool(scene, track, x, z, radius = 1.8) {
  const pool = track(
    new THREE.Mesh(
      new THREE.CircleGeometry(radius, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0a1810,
        emissive: 0x1a5030,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.15,
        transparent: true,
        opacity: 0.92,
      })
    )
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.03, z);
  scene.add(pool);

  const glow = new THREE.PointLight(0x3dff8a, 0.45, 8, 2);
  glow.position.set(x, 0.5, z);
  scene.add(glow);
  track(glow);
}

function buildEngineerHead(scene, materials, track, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const skull = track(
    new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0x8a8078,
        roughness: 0.72,
        metalness: 0.08,
      })
    )
  );
  skull.scale.set(1.1, 1.35, 1.05);
  skull.position.y = 3.2;
  group.add(skull);

  const brow = track(
    new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 1.2), materials.trim)
  );
  brow.position.set(0, 4.1, 0.35);
  group.add(brow);

  const eyeGlow = new THREE.PointLight(0x58ffaa, 0.35, 12, 2);
  eyeGlow.position.set(0, 3.4, 1.8);
  group.add(eyeGlow);
  track(eyeGlow);

  scene.add(group);
  track(group);
  return group;
}

export function buildStage3World(scene, materials, world) {
  if (world.stage3?.built) return world.stage3;

  const meshes = [];
  const track = (mesh) => {
    meshes.push(mesh);
    return mesh;
  };

  // Dock tunnel from shuttle — enclosed corridor with lighting
  for (let z = -51; z >= -58; z -= 3) {
    addTunnelSegment(scene, materials, track, z, 2.3, 4.0);
  }
  track(addBox(scene, materials, [4.8, 4.2, 8], [0, 2.1, -55], "trim", false));

  addCorridorLighting(scene, track, {
    zStart: -52,
    zEnd: -84,
    step: 4,
    color: 0x88ffcc,
    intensity: 2.0,
    range: 18,
    y: 3.5,
  });

  addStageFillLight(scene, track, 0, 7, -62, 0x58ffaa, 2.2, 45);
  addStageFillLight(scene, track, 0, 6, -70, 0x58ffaa, 2.4, 50);
  addStageFillLight(scene, track, 0, 6, -78, 0x3dff8a, 2.0, 45);
  addStageHemisphereFill(scene, track, 8, -70, 0x58ffaa, 0x060e0a, 0.95);

  // Vault floor
  track(addBox(scene, materials, [18, 0.22, 28], [0, -0.02, -70], "floor"));

  // Vault walls — cathedral scale (emissive trim bands)
  for (const x of [-9.2, 9.2]) {
    track(addBox(scene, materials, [0.5, 9, 28], [x, 4.5, -70], "wall"));
    for (let z = -56; z >= -82; z -= 6) {
      const band = track(addBox(scene, materials, [0.12, 0.1, 4.5], [x * 0.96, 0.45, z], "strip", false));
      band.material = materials.strip.clone();
      band.material.emissiveIntensity = 1.4;
    }
  }
  track(addBox(scene, materials, [19, 9, 0.5], [0, 4.5, -84.2], "wall"));

  // Vault ceiling arches
  track(addBox(scene, materials, [18, 0.35, 28], [0, 8.8, -70], "trim", false));

  // Black goo channels along floor
  addGooPool(scene, track, -2, -64, 2.2);
  addGooPool(scene, track, 2.5, -71, 1.9);
  addGooPool(scene, track, -1.5, -77, 2.4);

  buildEngineerHead(scene, materials, track, 0, 0, -79);

  addVaultMurals(scene, track);

  const ampuleData = [
    { id: "catalyst", pos: [-3.5, 0, -66], color: 0x58ffaa },
    { id: "serum", pos: [3.5, 0, -72], color: 0x88ffcc },
    { id: "payload", pos: [-3.5, 0, -78], color: 0x3dff8a },
  ];

  for (const data of ampuleData) {
    track(addBox(scene, materials, [1.5, 0.3, 1.5], [data.pos[0], 0.15, data.pos[2]], "trim"));

    const pedestal = track(
      new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.8, 10), materials.pillar)
    );
    pedestal.position.set(data.pos[0], 1.5, data.pos[2]);
    scene.add(pedestal);

    const urn = track(
      new THREE.Mesh(
        new THREE.CapsuleGeometry(0.32, 0.85, 6, 12),
        new THREE.MeshStandardMaterial({
          color: 0x1a2820,
          emissive: data.color,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.4,
        })
      )
    );
    urn.position.set(data.pos[0], 3.35, data.pos[2]);
    urn.userData.type = "ampule";
    urn.userData.id = data.id;
    urn.userData.activated = false;
    scene.add(urn);

    const lip = track(
      new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.05, 8, 20),
        new THREE.MeshStandardMaterial({
          color: 0xc9a962,
          emissive: 0xc9a962,
          emissiveIntensity: 0.4,
          metalness: 0.6,
        })
      )
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.set(data.pos[0], 3.85, data.pos[2]);
    scene.add(lip);

    const glow = new THREE.PointLight(data.color, 0.5, 7, 2);
    glow.position.set(data.pos[0], 4, data.pos[2]);
    scene.add(glow);
    track(glow);

    world.interactables.push({
      mesh: urn,
      type: "ampule",
      id: data.id,
      radius: 2.4,
      prompt: `Secure ${AMPULE_LABELS[data.id]}`,
    });
  }

  const terminal = track(addBox(scene, materials, [1.1, 1.3, 0.35], [2.2, 0.9, -58], "trim"));
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    id: "vault-terminal",
    radius: 2.4,
    prompt: "Read containment log",
    message:
      "Containment breach logged. The Engineers stored creation and uncreation in these urns. Secure Catalyst, Serum, Payload — in that order — before the Sanctum will yield.",
  });

  // Level passage to stage 4 (no gravity drop)
  for (let z = -82; z >= -86; z -= 2) {
    track(addBox(scene, materials, [5, 0.2, 2.2], [0, -0.02, z], "floor"));
  }

  const vaultLight = new THREE.PointLight(0x58ffaa, 3.2, 60, 1.4);
  vaultLight.position.set(0, 7, -70);
  scene.add(vaultLight);
  track(vaultLight);

  const headLight = new THREE.SpotLight(0x88ffcc, 2.0, 28, Math.PI / 4.5, 0.35, 1.2);
  headLight.position.set(0, 8, -72);
  headLight.target.position.set(0, 3, -79);
  scene.add(headLight);
  scene.add(headLight.target);
  track(headLight);
  track(headLight.target);

  world.stage3 = { built: true, meshes, head: null, gooMeshes: [] };
  return world.stage3;
}

export function destroyStage3World(scene, world) {
  if (!world.stage3?.built) return;

  for (const mesh of world.stage3.meshes) {
    if (mesh?.parent) mesh.parent.remove(mesh);
    else scene.remove(mesh);
    if (mesh?.geometry?.dispose) mesh.geometry.dispose();
    if (mesh?.material?.dispose && mesh.material.isMaterial) mesh.material.dispose();
  }

  world.interactables = world.interactables.filter(
    (item) => item.type !== "ampule" && item.id !== "vault-terminal"
  );

  world.stage3 = null;
}

// Designed by Dang-Tue Hoang, AI Engineer
