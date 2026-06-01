import * as THREE from "three";

/** Mount a wall mural with frame + optional gallery lighting. Murals use BasicMaterial so they stay visible in dark stages. */
export function mountGalleryMural(scene, track, options) {
  const {
    texture,
    x,
    y,
    z,
    rotY,
    width,
    height,
    emissive = 0x4a3868,
    emissiveIntensity = 1.25,
    frameColor = 0x1a1820,
    frameEmissive = 0x2a2840,
    keyLightColor = 0xfff6ea,
    accentLightColor = 0xc9a962,
    addAlcove = false,
    alcoveDepth = 0.12,
    addLights = true,
    spotIntensity = 2.0,
    keyIntensity = 1.4,
    fillIntensity = 0.85,
  } = options;

  // Self-lit mural — visible even when dynamic light limits are exceeded
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
  });

  const wallNormal = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
  const surfaceOffset = wallNormal.clone().multiplyScalar(0.07);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z).add(surfaceOffset);
  mesh.rotation.y = rotY;
  mesh.renderOrder = 2;
  scene.add(mesh);
  if (track) track(mesh);

  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    emissive: frameEmissive,
    emissiveIntensity: 0.55,
    roughness: 0.48,
    metalness: 0.5,
  });

  const frameGroup = new THREE.Group();
  frameGroup.position.copy(mesh.position);
  frameGroup.rotation.y = rotY;
  const t = 0.065;
  const frameParts = [
    [width + t * 2, t, 0.06, 0, height / 2 + t / 2],
    [width + t * 2, t, 0.06, 0, -height / 2 - t / 2],
    [t, height, 0.06, -width / 2 - t / 2, 0],
    [t, height, 0.06, width / 2 + t / 2, 0],
  ];
  for (const [fw, fh, fd, ox, oy] of frameParts) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), frameMat);
    part.position.set(ox, oy, -0.02);
    frameGroup.add(part);
  }
  scene.add(frameGroup);
  if (track) track(frameGroup);

  if (addAlcove) {
    // Recess into the wall: width × height face matches mural; depth goes along wall normal.
    const alcove = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.28, height + 0.4, alcoveDepth),
      frameMat
    );
    const intoWall = wallNormal.clone().multiplyScalar(-(alcoveDepth * 0.5 + 0.05));
    alcove.position.copy(mesh.position).add(intoWall);
    alcove.rotation.y = rotY;
    scene.add(alcove);
    if (track) track(alcove);
  }

  if (!addLights) return mesh;

  const towardCenter = new THREE.Vector3(0, y, z).sub(new THREE.Vector3(x, y, z)).normalize();
  const lightX = x + towardCenter.x * 0.35;
  const lightZ = z + towardCenter.z * 0.35;

  const overhead = new THREE.SpotLight(0xffffff, spotIntensity, 16, Math.PI / 5, 0.32, 1.0);
  overhead.position.set(lightX, y + height / 2 + 1.1, lightZ);
  overhead.target.position.set(x, y, z);
  scene.add(overhead);
  scene.add(overhead.target);
  if (track) {
    track(overhead);
    track(overhead.target);
  }

  const keyLight = new THREE.PointLight(keyLightColor, keyIntensity, 11, 1.35);
  keyLight.position.set(lightX, y + height * 0.12, lightZ);
  scene.add(keyLight);
  if (track) track(keyLight);

  const fillLight = new THREE.PointLight(accentLightColor, fillIntensity, 9, 1.5);
  fillLight.position.set(x, y + height * 0.05, z);
  scene.add(fillLight);
  if (track) track(fillLight);

  return mesh;
}

export function canvasTexture(drawFn, w = 512, h = 340) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  drawFn(canvas.getContext("2d"), w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Designed by Dang-Tue Hoang, AI Engineer
