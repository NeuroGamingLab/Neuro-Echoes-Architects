import * as THREE from "three";
import { CONSOLE_LABELS } from "./stage4-route.js";
import { addSanctumMurals } from "./sanctum-murals.js";
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

export function buildStage4World(scene, materials, world) {
  if (world.stage4?.built) return world.stage4;

  const meshes = [];
  const track = (mesh) => {
    meshes.push(mesh);
    return mesh;
  };

  // Entry tunnel from vault
  for (let z = -86; z >= -92; z -= 3) {
    addTunnelSegment(scene, materials, track, z, 2.45, 4.2);
  }

  addCorridorLighting(scene, track, {
    zStart: -88,
    zEnd: -112,
    step: 4,
    color: 0xffcc88,
    intensity: 2.0,
    range: 18,
    y: 3.8,
  });

  addStageFillLight(scene, track, 0, 7, -94, 0xffaa66, 2.2, 48);
  addStageFillLight(scene, track, 0, 6, -100, 0xff8844, 2.6, 55);
  addStageFillLight(scene, track, 0, 6, -108, 0xff6622, 2.0, 45);
  addStageHemisphereFill(scene, track, 9, -100, 0xffaa66, 0x120804, 0.9);

  // Sanctum dome floor — level with agent path
  track(addBox(scene, materials, [22, 0.22, 30], [0, -0.02, -100], "floor"));

  // Dome walls (octagonal feel via segments)
  for (const x of [-11, 11]) {
    track(addBox(scene, materials, [0.55, 10, 30], [x, 4.5, -100], "wall"));
    for (let z = -88; z >= -112; z -= 6) {
      const band = track(addBox(scene, materials, [0.14, 0.1, 4.5], [x * 0.96, 0.45, z], "strip", false));
      band.material = materials.strip.clone();
      band.material.emissive.set(0xff8844);
      band.material.emissiveIntensity = 1.35;
    }
  }
  track(addBox(scene, materials, [23, 10, 0.55], [0, 4.5, -115.5], "wall"));

  // Dome ceiling
  const dome = track(
    new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
      new THREE.MeshStandardMaterial({
        color: 0x2a2018,
        emissive: 0x502818,
        emissiveIntensity: 0.85,
        roughness: 0.8,
        side: THREE.BackSide,
      })
    )
  );
  dome.position.set(0, 9, -100);
  scene.add(dome);

  addSanctumMurals(scene, track);

  // Pilot chair — Juggernaut helm
  const chair = new THREE.Group();
  chair.position.set(0, 0, -104);

  const seat = track(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.45, 2.4),
      new THREE.MeshStandardMaterial({
        color: 0x2a2018,
        emissive: 0x301808,
        emissiveIntensity: 0.35,
        roughness: 0.5,
        metalness: 0.45,
      })
    )
  );
  seat.position.y = 1.1;
  chair.add(seat);

  const back = track(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x3a2a20,
        emissive: 0x502818,
        emissiveIntensity: 0.45,
        roughness: 0.45,
        metalness: 0.5,
      })
    )
  );
  back.position.set(0, 2.5, -0.95);
  chair.add(back);

  const holoRing = track(
    new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.07, 10, 40),
      new THREE.MeshStandardMaterial({
        color: 0xff8844,
        emissive: 0xff6622,
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.88,
      })
    )
  );
  holoRing.rotation.x = Math.PI / 2;
  holoRing.position.y = 3.2;
  chair.add(holoRing);

  scene.add(chair);

  const chairLight = new THREE.PointLight(0xff8844, 1.0, 14, 1.8);
  chairLight.position.set(0, 4, -104);
  scene.add(chairLight);
  track(chairLight);

  // Console pylons
  const consoleData = [
    { id: "helm", pos: [-4, 0, -94], color: 0xffaa66 },
    { id: "drive", pos: [4, 0, -100], color: 0xff7744 },
    { id: "ascent", pos: [0, 0, -106], color: 0xffcc88 },
  ];

  for (const data of consoleData) {
    track(addBox(scene, materials, [1.2, 0.25, 1.2], [data.pos[0], 0.12, data.pos[2]], "trim"));

    const pylon = track(
      new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.4, 8), materials.pillar)
    );
    pylon.position.set(data.pos[0], 1.35, data.pos[2]);
    scene.add(pylon);

    const node = track(
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({
          color: data.color,
          emissive: data.color,
          emissiveIntensity: 0.7,
          roughness: 0.3,
          metalness: 0.55,
        })
      )
    );
    node.position.set(data.pos[0], 2.85, data.pos[2]);
    node.userData.type = "console";
    node.userData.id = data.id;
    node.userData.activated = false;
    scene.add(node);

    const glow = new THREE.PointLight(data.color, 0.55, 6, 2);
    glow.position.set(data.pos[0], 3.1, data.pos[2]);
    scene.add(glow);
    track(glow);

    world.interactables.push({
      mesh: node,
      type: "console",
      id: data.id,
      radius: 2.4,
      prompt: `Activate ${CONSOLE_LABELS[data.id]}`,
    });
  }

  const terminal = track(addBox(scene, materials, [1.1, 1.3, 0.35], [-2, 0.9, -88], "trim"));
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    id: "sanctum-terminal",
    radius: 2.4,
    prompt: "Read flight primers",
    message:
      "Juggernaut flight primers. The chair waits for Helm, Drive, Ascent — then the cryo cradle will carry you out of this tomb.",
  });

  // Cryo escape pod
  const pod = new THREE.Group();
  pod.position.set(0, 0, -111);

  const podBody = track(
    new THREE.Mesh(
      new THREE.CapsuleGeometry(1.1, 3.2, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x2a3840,
        emissive: 0x1a3040,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.55,
      })
    )
  );
  podBody.rotation.x = Math.PI / 2;
  podBody.position.y = 1.4;
  pod.add(podBody);

  const podWindow = track(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 20),
      new THREE.MeshStandardMaterial({
        color: 0x58d4ff,
        emissive: 0x58d4ff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85,
      })
    )
  );
  podWindow.rotation.y = Math.PI / 2;
  podWindow.position.set(0, 1.5, 1.05);
  pod.add(podWindow);

  scene.add(pod);

  const sanctumFill = new THREE.PointLight(0xffaa66, 2.6, 60, 1.4);
  sanctumFill.position.set(0, 7, -100);
  scene.add(sanctumFill);
  track(sanctumFill);

  world.stage4 = {
    built: true,
    meshes,
    chair,
    holoRing,
    pod,
    podBody,
  };

  return world.stage4;
}

export function destroyStage4World(scene, world) {
  if (!world.stage4?.built) return;

  if (world.stage4.chair) scene.remove(world.stage4.chair);
  if (world.stage4.pod) scene.remove(world.stage4.pod);

  for (const mesh of world.stage4.meshes) {
    if (mesh?.parent) mesh.parent.remove(mesh);
    else scene.remove(mesh);
    if (mesh?.geometry?.dispose) mesh.geometry.dispose();
    if (mesh?.material?.dispose && mesh.material.isMaterial) mesh.material.dispose();
  }

  world.interactables = world.interactables.filter(
    (item) => item.type !== "console" && item.id !== "sanctum-terminal"
  );

  world.stage4 = null;
}

export function animateFinalAscent(stage4, onComplete) {
  if (!stage4?.pod) {
    onComplete?.();
    return;
  }

  const startY = stage4.pod.position.y;
  const start = performance.now();
  const duration = 3200;

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - (1 - t) ** 3;
    stage4.pod.position.y = startY + ease * 8;
    if (stage4.holoRing) {
      stage4.holoRing.rotation.z += 0.04;
      stage4.holoRing.material.emissiveIntensity = 0.75 + ease * 1.5;
    }
    if (stage4.podBody) {
      stage4.podBody.material.emissiveIntensity = 0.5 + ease * 1.0;
    }
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}

// Designed by Dang-Tue Hoang, AI Engineer
