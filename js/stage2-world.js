import * as THREE from "three";
import { BEACON_LABELS } from "./stage2-route.js";
import { addBridgeMurals } from "./bridge-murals.js";
import { MUSTARD_FLOOR, MUSTARD_WALL } from "./world.js";

function addBox(scene, materials, size, position, materialKey = "wall", receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials[materialKey]);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

export function buildStage2World(scene, materials, world) {
  if (world.stage2?.built) return world.stage2;

  const meshes = [];
  const track = (mesh) => {
    meshes.push(mesh);
    return mesh;
  };

  // Void beneath the bridge
  const voidPlane = track(
    new THREE.Mesh(
      new THREE.PlaneGeometry(40, 50),
      new THREE.MeshBasicMaterial({ color: 0x020408, transparent: true, opacity: 0.95 })
    )
  );
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(0, -8, -36);
  scene.add(voidPlane);

  const voidGlow = track(
    new THREE.Mesh(
      new THREE.PlaneGeometry(18, 40),
      new THREE.MeshBasicMaterial({
        color: 0x1a2840,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      })
    )
  );
  voidGlow.rotation.x = -Math.PI / 2;
  voidGlow.position.set(0, -7.5, -36);
  scene.add(voidGlow);

  // Mustard bridge deck + side walls (shared materials)
  materials.floor.color.setHex(MUSTARD_FLOOR);
  materials.wall.color.setHex(MUSTARD_WALL);

  for (let z = -22; z >= -51; z -= 4) {
    track(addBox(scene, materials, [4.2, 0.18, 4.2], [0, -0.02, z], "floor"));
    for (const x of [-2.35, 2.35]) {
      track(addBox(scene, materials, [0.32, 4.2, 4.2], [x, 2.1, z], "wall"));
    }
  }

  track(addBox(scene, materials, [4.9, 4.2, 0.32], [0, 2.1, -22], "wall"));
  track(addBox(scene, materials, [4.9, 4.2, 0.32], [0, 2.1, -51], "wall"));

  // Glass side rails (on inner face of mustard walls)
  for (const x of [-2.05, 2.05]) {
    for (let z = -22; z >= -50; z -= 5) {
      const rail = track(addBox(scene, materials, [0.08, 1.1, 4.8], [x, 0.55, z], "trim"));
      rail.material = materials.strip.clone();
      rail.material.emissiveIntensity = 0.8;
    }
  }

  // Bridge ceiling
  track(addBox(scene, materials, [4.4, 0.25, 30], [0, 4.2, -36], "trim", false));

  // Bridge lights
  for (const z of [-24, -30, -36, -42, -48]) {
    const light = new THREE.PointLight(0x9b7bff, 1.6, 16, 1.6);
    light.position.set(0, 3.8, z);
    scene.add(light);
    meshes.push(light);
  }

  const bridgeFill = new THREE.PointLight(0x406080, 1.1, 50, 1.4);
  bridgeFill.position.set(0, 2, -34);
  scene.add(bridgeFill);
  meshes.push(bridgeFill);

  addBridgeMurals(scene, track);

  // Beacon pillars
  const beaconData = [
    { id: "echo", pos: [-1.6, 0, -28], color: 0x9b7bff },
    { id: "signal", pos: [1.6, 0, -36], color: 0x58d4ff },
    { id: "anchor", pos: [-1.6, 0, -43], color: 0x79ffe8 },
  ];

  for (const data of beaconData) {
    track(addBox(scene, materials, [1.4, 0.25, 1.4], [data.pos[0], 0.12, data.pos[2]], "trim"));

    const pillar = track(
      new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 3.6, 10), materials.pillar)
    );
    pillar.position.set(data.pos[0], 1.9, data.pos[2]);
    scene.add(pillar);

    const beacon = track(
      new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), materials.rune.clone())
    );
    beacon.material.emissive.set(data.color);
    beacon.material.color.set(data.color);
    beacon.position.set(data.pos[0], 3.85, data.pos[2]);
    beacon.userData.type = "beacon";
    beacon.userData.id = data.id;
    beacon.userData.activated = false;
    scene.add(beacon);

    const glow = new THREE.PointLight(data.color, 0.55, 7, 2);
    glow.position.set(data.pos[0], 4.1, data.pos[2]);
    scene.add(glow);
    meshes.push(glow);

    world.interactables.push({
      mesh: beacon,
      type: "beacon",
      id: data.id,
      radius: 2.4,
      prompt: `Tune ${BEACON_LABELS[data.id]}`,
    });
  }

  // Bridge terminal
  const terminal = track(addBox(scene, materials, [1.0, 1.2, 0.35], [1.4, 0.85, -24], "trim"));
  terminal.userData.type = "terminal";
  const termScreen = track(
    new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x9b7bff })
    )
  );
  termScreen.position.set(1.4, 1.0, -23.82);
  scene.add(termScreen);
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    id: "bridge-terminal",
    radius: 2.4,
    prompt: "Read bridge manifest",
    message:
      "Stage 2 manifest. Renaissance sketches line the alcoves. Restore the beacon chain — Echo, Signal, Anchor — to reach the Ampule Vault.",
  });

  // Extraction shuttle (dormant until all beacons lit)
  const shuttle = new THREE.Group();
  shuttle.position.set(0, 0.5, -49.5);

  const shuttleBody = track(
    new THREE.Mesh(
      new THREE.CapsuleGeometry(0.9, 2.4, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0x2a3840,
        emissive: 0x1a2830,
        emissiveIntensity: 0.4,
        roughness: 0.45,
        metalness: 0.55,
      })
    )
  );
  shuttleBody.rotation.x = Math.PI / 2;
  shuttleBody.position.y = 1.2;
  shuttle.add(shuttleBody);

  const shuttleRing = track(
    new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.06, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0x79ffe8,
        emissive: 0x79ffe8,
        emissiveIntensity: 0.35,
      })
    )
  );
  shuttleRing.rotation.x = Math.PI / 2;
  shuttleRing.position.y = 0.35;
  shuttle.add(shuttleRing);

  const pad = track(
    new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.12, 24),
      new THREE.MeshStandardMaterial({
        color: 0x1a2830,
        emissive: 0x304050,
        emissiveIntensity: 0.25,
        roughness: 0.7,
        metalness: 0.4,
      })
    )
  );
  pad.position.y = 0.06;
  shuttle.add(pad);

  scene.add(shuttle);

  const shuttleLight = new THREE.PointLight(0x79ffe8, 0.4, 14, 2);
  shuttleLight.position.set(0, 2.5, -49.5);
  scene.add(shuttleLight);
  meshes.push(shuttleLight);

  world.stage2 = {
    built: true,
    meshes,
    shuttle,
    shuttleBody,
    shuttleRing,
    pad,
    voidGlow,
  };

  return world.stage2;
}

export function destroyStage2World(scene, world) {
  if (!world.stage2?.built) return;

  if (world.stage2.shuttle) {
    scene.remove(world.stage2.shuttle);
  }

  for (const mesh of world.stage2.meshes) {
    if (mesh?.parent) mesh.parent.remove(mesh);
    else scene.remove(mesh);
    if (mesh?.geometry?.dispose) mesh.geometry.dispose();
    if (mesh?.material?.dispose && mesh.material.isMaterial) mesh.material.dispose();
  }

  world.interactables = world.interactables.filter(
    (item) => item.type !== "beacon" && item.id !== "bridge-terminal"
  );

  world.stage2 = null;
}

export function animateShuttleTransit(stage2, agent, onComplete) {
  if (!stage2?.shuttle) {
    onComplete?.();
    return;
  }

  const startZ = stage2.shuttle.position.z;
  const targetZ = -51;
  const agentStartZ = agent?.position.z ?? startZ;
  const start = performance.now();
  const duration = 2400;

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - (1 - t) ** 2;
    stage2.shuttle.position.z = THREE.MathUtils.lerp(startZ, targetZ, ease);
    stage2.shuttle.position.y = 0.5 - ease * 0.15;
    if (agent) {
      agent.position.z = THREE.MathUtils.lerp(agentStartZ, targetZ, ease);
      agent.position.x = THREE.MathUtils.lerp(agent.position.x, 0, ease * 0.85);
    }
    if (stage2.shuttleRing) {
      stage2.shuttleRing.material.emissiveIntensity = 0.75 + ease * 0.5;
    }
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}

export function animateShuttleLaunch(stage2, onComplete) {
  if (!stage2?.shuttle) {
    onComplete?.();
    return;
  }

  const startY = stage2.shuttle.position.y;
  const start = performance.now();
  const duration = 2800;

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - (1 - t) ** 3;
    stage2.shuttle.position.y = startY + ease * 6;
    stage2.shuttleRing.material.emissiveIntensity = 0.35 + ease * 1.2;
    stage2.shuttleBody.material.emissiveIntensity = 0.4 + ease * 0.8;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  }

  requestAnimationFrame(tick);
}

// Designed by Dang-Tue Hoang, AI Engineer
