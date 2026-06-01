import * as THREE from "three";

/** Repeated ceiling + wall wash lights along a corridor (z decreases). */
export function addCorridorLighting(scene, track, options) {
  const {
    zStart,
    zEnd,
    step = 5,
    color = 0xffffff,
    intensity = 1.35,
    range = 16,
    y = 3.6,
    xSpread = 0,
  } = options;

  const lights = [];
  for (let z = zStart; z >= zEnd; z -= step) {
    const ceiling = new THREE.PointLight(color, intensity, range, 1.5);
    ceiling.position.set(0, y, z);
    scene.add(ceiling);
    if (track) track(ceiling);
    lights.push(ceiling);

    if (xSpread > 0) {
      for (const x of [-xSpread, xSpread]) {
        const wash = new THREE.PointLight(color, intensity * 0.45, range * 0.75, 1.8);
        wash.position.set(x, 1.8, z);
        scene.add(wash);
        if (track) track(wash);
        lights.push(wash);
      }
    }
  }
  return lights;
}

/** Enclosed tunnel segment with emissive trim so geometry reads in low light. */
export function addTunnelSegment(scene, materials, track, z, halfWidth = 2.25, height = 4.0) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth * 2, 0.2, 3.2),
    materials.floor
  );
  floor.position.set(0, -0.02, z);
  floor.receiveShadow = true;
  scene.add(floor);
  if (track) track(floor);

  for (const x of [-halfWidth, halfWidth]) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, height, 3.2),
      materials.wall
    );
    wall.position.set(x, height / 2, z);
    scene.add(wall);
    if (track) track(wall);

    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.08, 2.8),
      materials.strip
    );
    strip.position.set(x * 0.92, 0.55, z);
    scene.add(strip);
    if (track) track(strip);
  }

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(halfWidth * 2 + 0.4, 0.22, 3.2),
    materials.trim
  );
  ceiling.position.set(0, height, z);
  scene.add(ceiling);
  if (track) track(ceiling);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.35),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
  );
  panel.position.set(0, height - 0.08, z);
  scene.add(panel);
  if (track) track(panel);
}

export function addStageFillLight(scene, track, x, y, z, color, intensity = 1.8, range = 50) {
  const fill = new THREE.PointLight(color, intensity, range, 1.4);
  fill.position.set(x, y, z);
  scene.add(fill);
  if (track) track(fill);
  return fill;
}

export function addStageHemisphereFill(scene, track, y, z, sky = 0x58ffaa, ground = 0x081810, intensity = 0.85) {
  const hemi = new THREE.HemisphereLight(sky, ground, intensity);
  hemi.position.set(0, y, z);
  scene.add(hemi);
  if (track) track(hemi);
  return hemi;
}

// Designed by Dang-Tue Hoang, AI Engineer
