import * as THREE from "three";
import { getMovementBounds } from "./movement-bounds.js";

const ROLES = ["chaser", "ambusher", "blocker", "patrol"];

/** Set to 1 for solo-specter ML testing; 4 for full alpha-pack. */
export const ACTIVE_SPECTER_COUNT = 4;
const ROLE_COLORS = [0xff2244, 0xff55cc, 0xaa66ff, 0x44ddff];
const ROLE_EYE = [0xff6677, 0xff99dd, 0xcc88ff, 0x88eeff];
const ROLE_LABELS = {
  chaser: "Chaser",
  ambusher: "Ambusher",
  blocker: "Blocker",
  patrol: "Patrol",
};

/** Classic ghost silhouette — lathe body, not a capsule suit. */
function ghostBodyGeometry(roleIndex) {
  const scale = roleIndex === 2 ? 1.12 : roleIndex === 3 ? 0.92 : 1;
  const points = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const y = t * 1.75 * scale;
    let r = 0.42 * scale * Math.pow(Math.sin(t * Math.PI), 0.82);
    if (t < 0.18) r *= 0.55 + t * 2.5;
    if (t > 0.62) r *= Math.pow(1 - (t - 0.62) / 0.38, 0.55);
    points.push(new THREE.Vector2(Math.max(r, 0.02), y));
  }
  return new THREE.LatheGeometry(points, 20);
}

function makeGhostVisual(roleIndex) {
  const group = new THREE.Group();
  const accent = ROLE_COLORS[roleIndex];
  const eyeColor = ROLE_EYE[roleIndex];

  const body = new THREE.Mesh(
    ghostBodyGeometry(roleIndex),
    new THREE.MeshStandardMaterial({
      color: 0x0a0612,
      emissive: accent,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.78,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  );
  body.position.y = 0.55;
  body.castShadow = false;
  group.add(body);

  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  innerGlow.position.set(0, 1.05, 0.05);
  group.add(innerGlow);

  const eyeY = 1.18;
  const eyeSpread = roleIndex === 1 ? 0.16 : 0.13;
  const eyes = [];
  for (const side of [-1, 1]) {
    const socket = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x050508 })
    );
    socket.position.set(side * eyeSpread, eyeY, 0.28);
    group.add(socket);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 6, 6),
      new THREE.MeshBasicMaterial({
        color: eyeColor,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    pupil.position.set(side * eyeSpread, eyeY, 0.36);
    group.add(pupil);
    eyes.push(pupil);
  }

  const shroudPanels = [];
  for (let i = 0; i < 5; i++) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 1.05, 1, 4),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const angle = (i / 5) * Math.PI * 2;
    panel.position.set(Math.sin(angle) * 0.38, 0.75, Math.cos(angle) * 0.38);
    panel.rotation.y = angle;
    group.add(panel);
    shroudPanels.push(panel);
  }

  const wispRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.018, 6, 28),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  wispRing.rotation.x = Math.PI / 2;
  wispRing.position.y = 0.95;
  group.add(wispRing);

  const tailWisps = [];
  for (let i = 0; i < 3; i++) {
    const wisp = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.55, 4),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    wisp.position.set((i - 1) * 0.14, 0.12, -0.08 - i * 0.04);
    wisp.rotation.x = Math.PI;
    group.add(wisp);
    tailWisps.push(wisp);
  }

  const hauntLight = new THREE.PointLight(accent, 1.6, 7, 2);
  hauntLight.position.set(0, 1.0, 0.2);
  group.add(hauntLight);

  group.userData.visual = {
    body,
    innerGlow,
    eyes,
    shroudPanels,
    wispRing,
    tailWisps,
    hauntLight,
    accent,
  };

  return group;
}

function makeHuntLine(color) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 1, 0),
  ]);
  const mat = new THREE.LineDashedMaterial({
    color,
    transparent: true,
    opacity: 0.38,
    dashSize: 0.45,
    gapSize: 0.28,
    linewidth: 1,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

function animateGhost(p, delta) {
  const v = p.mesh.userData.visual;
  if (!v) return;

  const t = p.phase;
  const hover = 0.22 + Math.sin(t * 2.8) * 0.14;
  const baseY = p.floorY ?? 0;
  p.mesh.position.y = baseY + hover;

  v.body.rotation.z = Math.sin(t * 1.6) * 0.06;
  v.innerGlow.scale.setScalar(0.9 + Math.sin(t * 4) * 0.15);

  for (let i = 0; i < v.eyes.length; i++) {
    v.eyes[i].material.opacity = 0.65 + Math.sin(t * 5 + i) * 0.35;
  }

  for (let i = 0; i < v.shroudPanels.length; i++) {
    const panel = v.shroudPanels[i];
    panel.rotation.z = Math.sin(t * 2.2 + i * 1.1) * 0.35;
    panel.material.opacity = 0.1 + Math.sin(t * 3 + i) * 0.08;
  }

  v.wispRing.rotation.z += delta * (1.2 + (p.role === "chaser" ? 0.8 : 0.2));
  v.hauntLight.intensity = 1.2 + Math.sin(t * 3.5) * 0.5;

  for (let i = 0; i < v.tailWisps.length; i++) {
    const w = v.tailWisps[i];
    w.rotation.z = Math.sin(t * 3 + i * 0.9) * 0.25;
    w.scale.y = 0.8 + Math.sin(t * 4 + i) * 0.35;
  }
}

/** Local alpha-pack coordinator (mirrors Python pursuer_coordinator). */
function localPursuerTargets(pursuers, agentPos, agentVel, stage) {
  const speed = 2.05 + stage * 0.06;
  return pursuers.map((p, i) => {
    const role = ROLES[i];
    let tx = agentPos.x;
    let tz = agentPos.z;

    if (role === "ambusher") {
      tx = agentPos.x + (agentVel?.vx ?? 0) * 2.5;
      tz = agentPos.z + (agentVel?.vz ?? 0) * 2.5 + 3;
    } else if (role === "blocker") {
      tx = agentPos.x * 0.35;
      tz = agentPos.z - 4;
    } else if (role === "patrol") {
      tx = agentPos.x + Math.sin(p.phase) * 5;
      tz = agentPos.z + 6;
    }

    const dx = tx - p.x;
    const dz = tz - p.z;
    const dist = Math.hypot(dx, dz) || 1;
    return {
      vx: (dx / dist) * speed,
      vz: (dz / dist) * speed,
      role,
      targetX: tx,
      targetZ: tz,
    };
  });
}

/** Spawn Z behind agent along mission axis (progress → lower Z). */
function spawnSpecterZ(az, i, bounds) {
  let spawnZ = az + 8 + i * 2.2;
  if (spawnZ > bounds.zMax - 0.5) {
    spawnZ = bounds.zMax - 0.6 - i * 0.35;
  }
  if (spawnZ <= az + 1.5) {
    spawnZ = az - 12 - i * 2.2;
  }
  return Math.max(bounds.zMin + 0.6, Math.min(bounds.zMax - 0.6, spawnZ));
}

function syncPursuerMesh(p) {
  if (!p?.mesh) return;
  const baseY = p.floorY ?? 0;
  p.mesh.position.set(p.x, baseY, p.z);
  if (p.active && !p.banished) {
    p.mesh.visible = true;
    p.mesh.scale.setScalar(1);
    if (p.line) p.line.visible = true;
  }
}

export function createAdaptivePursuers(scene) {
  const pursuers = ROLES.map((role, i) => {
    const mesh = makeGhostVisual(i);
    const line = makeHuntLine(ROLE_COLORS[i]);
    scene.add(mesh);
    scene.add(line);
    return {
      id: `pursuer-${i}`,
      role,
      roleLabel: ROLE_LABELS[role],
      mesh,
      line,
      x: -4 + i * 2.5,
      z: 24 - i,
      phase: i * 1.2,
      active: false,
      banished: false,
      banishedUntil: 0,
      vx: 0,
      vz: 0,
    };
  });

  return {
    pursuers,
    enabled: false,
    serverUpdate: null,
    lastAgentPos: { x: 0, z: 28 },
    agentVel: { vx: 0, vz: 0 },
    warmupTimer: 0,

    /** Spawn specters behind the agent along the mission axis (progress → −Z). */
    setEnabled(on, stage = 1, agentPos = null, world = null) {
      this.enabled = on;
      const ax = agentPos?.x ?? 0;
      const az = agentPos?.z ?? 28;
      const floorY = agentPos?.y ?? 0;
      this.lastAgentPos = { x: ax, z: az };
      this.warmupTimer = on ? 4 : 0;

      const bounds = getMovementBounds(stage, world);

      for (let i = 0; i < this.pursuers.length; i++) {
        const p = this.pursuers[i];
        const inPack = on && i < ACTIVE_SPECTER_COUNT;
        p.active = inPack;
        p.floorY = floorY;
        if (inPack) {
          p.x = ax + (i - (ACTIVE_SPECTER_COUNT - 1) / 2) * 1.6;
          p.z = spawnSpecterZ(az, i, bounds);
          p.banished = false;
          p.banishedUntil = 0;
          p.dissolveFlash = 0;
          syncPursuerMesh(p);
        } else {
          p.mesh.visible = false;
          p.line.visible = false;
        }
      }
    },

    getPositions() {
      return this.getMapSpecters().map((p) => ({ x: p.x, z: p.z, role: p.role }));
    },

    /** Active specters for minimap + navigation (ignores hunt warmup). */
    getMapSpecters() {
      if (!this.enabled) return [];
      const hunting = this.warmupTimer <= 0;
      return this.pursuers
        .filter((p) => p.active && !p.banished)
        .map((p) => ({
          x: p.x,
          z: p.z,
          role: p.role,
          roleLabel: p.roleLabel,
          hunting,
        }));
    },

    /** Live specter refs for mural beam collision (includes position, banished flag). */
    getHuntableSpecters() {
      return this.pursuers.filter((p) => p.active && !p.banished);
    },

    banishSpecter(pursuer, hazard = null) {
      if (!pursuer?.active || pursuer.banished) return false;
      pursuer.banished = true;
      pursuer.banishedUntil = performance.now() + 22000;
      pursuer.mesh.visible = false;
      pursuer.line.visible = false;
      pursuer.mesh.scale.setScalar(0.01);
      pursuer.dissolveFlash = 1;
      pursuer.lastHazard = hazard?.type || null;
      return true;
    },

    respawnSpecter(pursuer, agentPos, stage = 1, world = null) {
      if (!pursuer) return;
      const ax = agentPos?.x ?? 0;
      const az = agentPos?.z ?? 28;
      const bounds = getMovementBounds(stage, world);
      const i = this.pursuers.indexOf(pursuer);
      pursuer.banished = false;
      pursuer.banishedUntil = 0;
      pursuer.dissolveFlash = 0;
      let spawnZ = spawnSpecterZ(az, i, bounds);
      pursuer.x = ax + (i - (ACTIVE_SPECTER_COUNT - 1) / 2) * 1.6;
      pursuer.z = spawnZ;
      pursuer.floorY = agentPos?.y ?? 0;
      pursuer.mesh.scale.setScalar(1);
      syncPursuerMesh(pursuer);
      pursuer.mesh.traverse((c) => {
        if (c.material?.opacity != null) c.material.opacity = Math.min(1, c.material.opacity || 0.78);
      });
    },

    applyServerUpdate(update) {
      if (!update?.pursuers) return;
      for (let i = 0; i < this.pursuers.length; i++) {
        const remote = update.pursuers[i];
        const p = this.pursuers[i];
        if (!remote || !p.active || p.banished) continue;
        p.x += remote.vx * 0.12;
        p.z += remote.vz * 0.12;
        p.roleLabel = remote.role || p.roleLabel;
      }
    },

    update(delta, agentPos, stage = 1, serverUpdate = null) {
      if (!this.enabled) return { caught: false, nearest: Infinity, hunting: false };

      this.agentVel = {
        vx: (agentPos.x - this.lastAgentPos.x) / Math.max(delta, 0.001),
        vz: (agentPos.z - this.lastAgentPos.z) / Math.max(delta, 0.001),
      };
      this.lastAgentPos = { x: agentPos.x, z: agentPos.z };

      if (this.warmupTimer > 0) {
        this.warmupTimer -= delta;
        if (agentPos.z <= 23) this.warmupTimer = 0;
      }
      const hunting = this.warmupTimer <= 0;

      let nearest = Infinity;
      let caught = false;

      for (let i = 0; i < this.pursuers.length; i++) {
        const p = this.pursuers[i];
        if (!p.active) continue;

        const now = performance.now();
        if (p.banished && now >= p.banishedUntil) {
          this.respawnSpecter(p, agentPos, stage, null);
        }
        if (p.banished) continue;

        p.phase += delta;

        if (hunting) {
          const moves = serverUpdate?.pursuers
            ? serverUpdate.pursuers
            : localPursuerTargets(this.pursuers, agentPos, this.agentVel, stage);
          const m = moves[i] || moves[0];
          p.vx = m.vx;
          p.vz = m.vz;
          p.x += m.vx * delta;
          p.z += m.vz * delta;
        }

        p.floorY = agentPos.y ?? 0;
        p.mesh.position.set(p.x, p.floorY, p.z);
        p.mesh.rotation.y = hunting
          ? Math.atan2(agentPos.x - p.x, agentPos.z - p.z)
          : p.mesh.rotation.y;
        animateGhost(p, delta);

        const dist = Math.hypot(agentPos.x - p.x, agentPos.z - p.z);
        nearest = Math.min(nearest, dist);
        if (hunting && dist < 0.95) caught = true;

        const ghostY = p.mesh.position.y + 1.05;
        const points = [
          new THREE.Vector3(p.x, ghostY, p.z),
          new THREE.Vector3(agentPos.x, 1.35, agentPos.z),
        ];
        p.line.geometry.setFromPoints(points);
        p.line.computeLineDistances();
      }

      return { caught, nearest, hunting };
    },

    dispose(scene) {
      for (const p of this.pursuers) {
        scene.remove(p.mesh);
        scene.remove(p.line);
        p.mesh.traverse((c) => {
          c.geometry?.dispose?.();
          if (c.material?.dispose && c.material.isMaterial) c.material.dispose();
        });
        p.line.geometry?.dispose?.();
        p.line.material?.dispose?.();
      }
    },
  };
}

export { ROLES, ROLE_LABELS };

// Designed by Dang-Tue Hoang, AI Engineer
