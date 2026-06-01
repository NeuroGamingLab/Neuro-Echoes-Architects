import * as THREE from "three";
export {
  AGENT_SPEED,
  ARRIVE_DIST,
  createAgentBrain,
  applyLlmPolicyToBrain,
  resetAgentBrain,
  rebuildRoute,
  updateAgent,
} from "./navigator.js";

export function createAgentVisual(scene) {
  const agent = new THREE.Group();

  const suit = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 1.05, 6, 12),
    new THREE.MeshStandardMaterial({
      color: 0x6a7a84,
      roughness: 0.55,
      metalness: 0.45,
      emissive: 0x1a3040,
      emissiveIntensity: 0.25,
    })
  );
  suit.position.y = 1.05;
  suit.castShadow = true;

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3a4a52, metalness: 0.5, roughness: 0.6 })
  );
  pack.position.set(0, 1.15, -0.35);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.28, 0.32),
    new THREE.MeshStandardMaterial({
      color: 0x58d4ff,
      emissive: 0x58d4ff,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    })
  );
  visor.position.set(0, 1.42, 0.22);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.03, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0x79ffe8,
      emissive: 0x79ffe8,
      emissiveIntensity: 0.6,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;

  agent.add(suit, pack, visor, ring);

  const flashlight = new THREE.SpotLight(0xf4fbff, 4.5, 36, Math.PI / 5.5, 0.42, 1.4);
  flashlight.position.set(0.1, 1.4, 0.35);
  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, 1.35, -2);
  agent.add(flashlight);
  agent.add(flashlightTarget);
  flashlight.target = flashlightTarget;

  const helmetLight = new THREE.PointLight(0xb8d8e8, 1.2, 10, 1.8);
  helmetLight.position.set(0, 1.45, 0.2);
  agent.add(helmetLight);

  agent.position.set(0, 0, 28);
  scene.add(agent);

  return { agent, flashlight, helmetLight, visor, ring };
}

export function updateFollowCamera(agentVisual, brain, camera, delta) {
  const pos = agentVisual.agent.position;
  const yaw = brain.yaw;

  const behind = new THREE.Vector3(-Math.sin(yaw) * 6.2, 3.4, -Math.cos(yaw) * 6.2);
  const desired = pos.clone().add(behind);
  desired.y = Math.max(desired.y, 2.2);

  camera.position.lerp(desired, 1 - Math.exp(-4.5 * delta));

  const lookTarget = pos.clone();
  lookTarget.y += 1.35;
  camera.lookAt(lookTarget);
}

export function getAgentPosition(agentVisual) {
  const p = agentVisual.agent.position;
  return { x: p.x, y: 1.7, z: p.z };
}

// Designed by Dang-Tue Hoang, AI Engineer
