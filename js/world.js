import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { addCorridorPaintings } from "./paintings.js";
import { createHazardMurals } from "./hazard-murals.js";

export const SIGIL_ORDER = ["sun", "moon", "eye"];
export const SIGIL_LABELS = { sun: "Solar Gate", moon: "Lunar Veil", eye: "Watcher's Eye" };

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080a0c);
  return scene;
}

export function clearSceneFog(scene) {
  scene.fog = null;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.7, 28);
  return camera;
}

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0x3a4850, 0.95);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x4a7080, 0x182028, 0.78);
  scene.add(hemi);

  const chamberGlow = new THREE.PointLight(0x58d4ff, 2.2, 45, 1.8);
  chamberGlow.position.set(0, 8, -8);
  scene.add(chamberGlow);

  const runeLight = new THREE.PointLight(0xc9a962, 1.5, 24, 1.8);
  runeLight.position.set(-6, 3, -4);
  scene.add(runeLight);

  const chamberFill = new THREE.PointLight(0x608090, 1.4, 50, 1.4);
  chamberFill.position.set(0, 5, 2);
  scene.add(chamberFill);
}

/** Shared wall/floor palette — all stages use materials from createMaterials(). */
export const MUSTARD_FLOOR = 0xe8c547;
export const MUSTARD_WALL = 0xc9a227;

export function createMaterials() {
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const ctx = floorCanvas.getContext("2d");
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(140, 100, 20, 0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  const floorTexture = new THREE.CanvasTexture(floorCanvas);
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(8, 8);

  return {
    floor: new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: MUSTARD_FLOOR,
      roughness: 0.85,
      metalness: 0.15,
    }),
    wall: new THREE.MeshStandardMaterial({
      color: MUSTARD_WALL,
      roughness: 0.88,
      metalness: 0.08,
    }),
    strip: new THREE.MeshStandardMaterial({
      color: 0x58d4ff,
      emissive: 0x58d4ff,
      emissiveIntensity: 1.2,
      roughness: 0.4,
      metalness: 0.2,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x2f3f46,
      roughness: 0.7,
      metalness: 0.35,
    }),
    pillar: new THREE.MeshStandardMaterial({
      color: 0x232f34,
      roughness: 0.75,
      metalness: 0.25,
    }),
    rune: new THREE.MeshStandardMaterial({
      color: 0xc9a962,
      emissive: 0xc9a962,
      emissiveIntensity: 0.65,
      roughness: 0.4,
      metalness: 0.5,
    }),
    hologram: new THREE.MeshBasicMaterial({
      color: 0x58d4ff,
      transparent: true,
      opacity: 0.75,
    }),
    door: new THREE.MeshStandardMaterial({
      color: 0x11181c,
      roughness: 0.55,
      metalness: 0.65,
    }),
  };
}

function addBox(scene, materials, size, position, materialKey = "wall", receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), materials[materialKey]);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = receiveShadow;
  scene.add(mesh);
  return mesh;
}

export function buildWorld(scene, materials) {
  const world = { interactables: [], door: null, starMap: null };

  // Corridor floor
  addBox(scene, materials, [6, 0.2, 34], [0, -0.1, 10], "floor");
  // Chamber floor
  addBox(scene, materials, [24, 0.2, 24], [0, -0.1, -8], "floor");

  // Corridor walls
  addBox(scene, materials, [0.4, 4, 34], [-3.2, 2, 10], "wall");
  addBox(scene, materials, [0.4, 4, 34], [3.2, 2, 10], "wall");
  addBox(scene, materials, [6.8, 4, 0.4], [0, 2, 27], "wall");

  // Chamber walls
  addBox(scene, materials, [0.4, 8, 24], [-12.2, 4, -8], "wall");
  addBox(scene, materials, [0.4, 8, 24], [12.2, 4, -8], "wall");
  addBox(scene, materials, [24.8, 8, 0.4], [0, 4, -20.2], "wall");

  // Ceiling panels
  addBox(scene, materials, [6, 0.3, 34], [0, 4.15, 10], "trim", false);
  addBox(scene, materials, [24, 0.3, 24], [0, 8.15, -8], "trim", false);

  // Corridor emergency strips + ceiling lights (visible path through the dark)
  for (const z of [24, 16, 8, 0, -4]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 0.18), materials.strip);
    strip.position.set(0, 3.95, z);
    scene.add(strip);

    const ceilingLight = new THREE.PointLight(0x79ffe8, 1.8, 18, 1.5);
    ceilingLight.position.set(0, 3.7, z);
    scene.add(ceilingLight);
  }

  // Soft fill so the corridor never goes fully black between lights
  const corridorFill = new THREE.PointLight(0x5080a0, 1.2, 48, 1.4);
  corridorFill.position.set(0, 3, 12);
  scene.add(corridorFill);

  addCorridorPaintings(scene);
  const hazards = createHazardMurals(scene);
  world.hazards = hazards;
  world.stageDefenseHazards = [];

  // Mural hint wall
  const mural = addBox(scene, materials, [4, 2.5, 0.2], [0, 2.2, -19.8], "trim");
  mural.userData.lore = true;

  const muralCanvas = document.createElement("canvas");
  muralCanvas.width = 512;
  muralCanvas.height = 256;
  const mctx = muralCanvas.getContext("2d");
  mctx.fillStyle = "#0f171b";
  mctx.fillRect(0, 0, 512, 256);
  mctx.strokeStyle = "#58d4ff";
  mctx.lineWidth = 3;
  mctx.font = "28px serif";
  mctx.fillStyle = "#c9a962";
  mctx.fillText("SUN  →  MOON  →  EYE", 72, 140);
  mctx.strokeRect(24, 24, 464, 208);
  const muralTexture = new THREE.CanvasTexture(muralCanvas);
  mural.material = new THREE.MeshStandardMaterial({
    map: muralTexture,
    emissive: 0x224455,
    emissiveIntensity: 1.1,
    emissiveMap: muralTexture,
    roughness: 0.8,
  });

  const hintOverhead = new THREE.SpotLight(0xffffff, 2.0, 12, Math.PI / 5, 0.3, 1.2);
  hintOverhead.position.set(0, 4.2, -19.2);
  hintOverhead.target.position.set(0, 2.2, -19.8);
  scene.add(hintOverhead);
  scene.add(hintOverhead.target);

  const hintFill = new THREE.PointLight(0xc9a962, 1.2, 8, 1.6);
  hintFill.position.set(0, 2.8, -19.4);
  scene.add(hintFill);

  // Sigil pillars
  const pillarData = [
    { id: "sun", pos: [-8, 0, -2], color: 0xffc857 },
    { id: "moon", pos: [0, 0, -14], color: 0xaecbfa },
    { id: "eye", pos: [8, 0, -2], color: 0xff7f6b },
  ];

  for (const data of pillarData) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.4, 16), materials.trim);
    base.position.set(data.pos[0], 0.2, data.pos[2]);
    base.castShadow = true;
    scene.add(base);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 4.2, 10), materials.pillar);
    pillar.position.set(data.pos[0], 2.3, data.pos[2]);
    pillar.castShadow = true;
    scene.add(pillar);

    const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), materials.rune.clone());
    sigil.material.emissive.set(data.color);
    sigil.material.color.set(data.color);
    sigil.position.set(data.pos[0], 4.2, data.pos[2]);
    sigil.userData.type = "sigil";
    sigil.userData.id = data.id;
    sigil.userData.activated = false;
    scene.add(sigil);

    const glow = new THREE.PointLight(data.color, 0.5, 6, 2);
    glow.position.set(data.pos[0], 4.5, data.pos[2]);
    scene.add(glow);

    world.interactables.push({
      mesh: sigil,
      type: "sigil",
      id: data.id,
      radius: 3.5,
      prompt: `Activate ${SIGIL_LABELS[data.id]}`,
    });
  }

  // Terminal lore
  const terminal = addBox(scene, materials, [1.2, 1.4, 0.4], [-2.2, 0.9, 22], "trim");
  terminal.userData.type = "terminal";
  const termScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.55),
    new THREE.MeshBasicMaterial({ color: 0x58d4ff })
  );
  termScreen.position.set(-2.2, 1.05, 21.75);
  scene.add(termScreen);
  world.interactables.push({
    mesh: terminal,
    type: "terminal",
    radius: 3,
    prompt: "Read expedition log",
    message:
      "Day 4. The builders mapped more than stars — they mapped consequence. Restore the sequence: Sun, Moon, Eye.",
  });

  // Star map hologram
  const starMap = new THREE.Group();
  starMap.position.set(0, 4.5, -8);
  const nodes = [
    [0, 0, 0],
    [-1.5, 0.8, 0.4],
    [1.6, -0.4, -0.2],
    [0.3, 1.2, -0.8],
    [-0.8, -1.1, 0.6],
    [1.1, 1.0, 0.5],
  ];
  const nodeMeshes = [];
  for (const [x, y, z] of nodes) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), materials.hologram.clone());
    star.position.set(x, y, z);
    starMap.add(star);
    nodeMeshes.push(star);
  }
  const lineGeo = new THREE.BufferGeometry();
  const pairs = [
    [0, 1], [0, 2], [0, 3], [1, 3], [2, 4], [3, 5], [1, 4], [2, 5],
  ];
  const positions = [];
  for (const [a, b] of pairs) {
    positions.push(...nodes[a], ...nodes[b]);
  }
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    lineGeo,
    new THREE.LineBasicMaterial({ color: 0x58d4ff, transparent: true, opacity: 0.55 })
  );
  starMap.add(lines);
  scene.add(starMap);
  world.starMap = { group: starMap, nodes: nodeMeshes, lines };

  // Exit door
  const doorFrame = addBox(scene, materials, [4.2, 5.2, 0.5], [0, 2.6, -19.7], "trim");
  doorFrame.visible = false;
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.35), materials.door);
  door.position.set(0, 2.3, -19.55);
  door.castShadow = true;
  scene.add(door);
  world.door = door;

  // Point light for star map
  const holoLight = new THREE.PointLight(0x58d4ff, 1.5, 16, 2);
  holoLight.position.set(0, 5, -8);
  scene.add(holoLight);

  return world;
}

export function createPlayer(scene, camera, domElement) {
  const controls = new PointerLockControls(camera, domElement);
  scene.add(controls.getObject());

  const flashlight = new THREE.SpotLight(0xf4fbff, 5.5, 42, Math.PI / 5.5, 0.42, 1.4);
  flashlight.position.set(0.15, -0.05, 0.1);
  flashlight.castShadow = false;
  camera.add(flashlight);

  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, 0, -1);
  camera.add(flashlightTarget);
  flashlight.target = flashlightTarget;

  // Near-field fill so walls/floor right beside you stay visible
  const helmetLight = new THREE.PointLight(0xb8d8e8, 1.4, 10, 1.8);
  helmetLight.position.set(0, 0, 0);
  camera.add(helmetLight);

  return { controls, flashlight, helmetLight };
}

export function createRaycaster() {
  return new THREE.Raycaster();
}

// Designed by Dang-Tue Hoang, AI Engineer
