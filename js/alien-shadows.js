import * as THREE from "three";

function makeShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 256);

  const body = ctx.createRadialGradient(64, 100, 8, 64, 120, 70);
  body.addColorStop(0, "rgba(0, 0, 0, 0.75)");
  body.addColorStop(0.5, "rgba(0, 0, 0, 0.45)");
  body.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(64, 110, 38, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.ellipse(40, 55, 14, 22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(88, 55, 14, 22, 0.3, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const shadowTexture = makeShadowTexture();

function makeShadowMesh(scene, track, floorY) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.85),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  );
  mesh.position.y = floorY + 1.05;
  mesh.renderOrder = 1;
  scene.add(mesh);
  if (track) track(mesh);
  return mesh;
}

/** Corridor shadows — slide along left/right walls only. */
export function createCorridorAlienShadows(scene, track, cfg, count = 6) {
  const shadows = [];
  const zMin = cfg.zEnd + 1;
  const zMax = cfg.zStart - 1;
  const wallX = cfg.wallX - 0.08;
  const floorY = cfg.floorY;

  for (let i = 0; i < count; i++) {
    const wall = i % 2 === 0 ? "left" : "right";
    const mesh = makeShadowMesh(scene, track, floorY);
    mesh.rotation.y = wall === "left" ? Math.PI / 2 : -Math.PI / 2;

    shadows.push({
      mesh,
      mode: "line",
      axis: "z",
      fixed: wall === "left" ? -wallX : wallX,
      pos: zMax - Math.random() * (zMax - zMin),
      min: zMin,
      max: zMax,
      speed: 0.6 + Math.random() * 1.4,
      dir: Math.random() > 0.5 ? 1 : -1,
      wobble: Math.random() * Math.PI * 2,
      floorY,
    });
  }

  return buildShadowSystem(shadows);
}

/** Perimeter shadows for square / circle / octagon / sphere galleries. */
export function createPerimeterAlienShadows(scene, track, cfg, count = 8) {
  const paths = cfg.shadowWallPaths;
  if (!paths?.length) return createCorridorAlienShadows(scene, track, cfg, count);

  const floorY = cfg.floorY;
  const shadows = [];

  for (let i = 0; i < count; i++) {
    const path = paths[i % paths.length];
    const mesh = makeShadowMesh(scene, track, floorY);
    const t = Math.random();

    if (path.type === "line") {
      const pos = path.min + t * (path.max - path.min);
      if (path.axis === "z") {
        mesh.rotation.y = path.fixed < 0 ? Math.PI / 2 : -Math.PI / 2;
        mesh.position.set(path.fixed, floorY + 1.05, pos);
      } else {
        mesh.rotation.y = path.fixed < cfg.room.centerZ ? 0 : Math.PI;
        mesh.position.set(pos, floorY + 1.05, path.fixed);
      }
      shadows.push({
        mesh,
        mode: "line",
        axis: path.axis,
        fixed: path.fixed,
        pos,
        min: path.min,
        max: path.max,
        speed: 0.7 + Math.random() * 1.3,
        dir: Math.random() > 0.5 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
        floorY,
      });
    } else {
      const angle = path.a0 + t * (path.a1 - path.a0);
      const x = Math.cos(angle) * path.r;
      const z = path.cz + Math.sin(angle) * path.r;
      mesh.rotation.y = angle + Math.PI / 2;
      mesh.position.set(x, floorY + 1.05, z);
      shadows.push({
        mesh,
        mode: "arc",
        cx: path.cx,
        cz: path.cz,
        r: path.r,
        angle,
        a0: path.a0,
        a1: path.a1,
        speed: 0.5 + Math.random() * 1.1,
        dir: Math.random() > 0.5 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
        floorY,
      });
    }
  }

  return buildShadowSystem(shadows);
}

function buildShadowSystem(shadows) {
  return {
    shadows,
    update(delta, time) {
      for (const s of shadows) {
        const wobbleY = Math.sin(time * 1.2 + s.wobble) * 0.08;
        if (s.mode === "line") {
          s.pos += s.dir * s.speed * delta;
          if (s.pos > s.max) {
            s.pos = s.max;
            s.dir = -1;
          }
          if (s.pos < s.min) {
            s.pos = s.min;
            s.dir = 1;
          }
          if (s.axis === "z") {
            s.mesh.position.set(s.fixed, s.floorY + 1.05 + wobbleY, s.pos);
          } else {
            s.mesh.position.set(s.pos, s.floorY + 1.05 + wobbleY, s.fixed);
          }
        } else {
          s.angle += s.dir * s.speed * 0.08 * delta;
          if (s.angle > s.a1) {
            s.angle = s.a1;
            s.dir = -1;
          }
          if (s.angle < s.a0) {
            s.angle = s.a0;
            s.dir = 1;
          }
          s.mesh.position.set(
            Math.cos(s.angle) * s.r,
            s.floorY + 1.05 + wobbleY,
            s.cz + Math.sin(s.angle) * s.r
          );
          s.mesh.rotation.y = s.angle + Math.PI / 2;
        }
        s.mesh.material.opacity = 0.4 + Math.sin(time * 2 + s.wobble) * 0.14;
      }
    },
    dispose() {
      for (const s of shadows) {
        if (s.mesh.parent) s.mesh.parent.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
      }
    },
  };
}

export function createGalleryAlienShadows(scene, track, cfg, count = 7) {
  if (cfg.room?.shape && cfg.room.shape !== "corridor") {
    return createPerimeterAlienShadows(scene, track, cfg, count);
  }
  return createCorridorAlienShadows(scene, track, cfg, count);
}

// Designed by Dang-Tue Hoang, AI Engineer
