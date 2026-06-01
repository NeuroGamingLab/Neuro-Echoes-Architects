import * as THREE from "three";
import { HAZARD_DEFS, isInHazardCone } from "./hazard-geometry.js";

function paintHazardBase(ctx, w, h, label, accent) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1a0808");
  grad.addColorStop(1, "#0a1014");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.fillStyle = "rgba(255, 80, 60, 0.15)";
  ctx.fillRect(24, 24, w - 48, h - 48);
}

function paintLightningMural(ctx, w, h) {
  paintHazardBase(ctx, w, h, "WRATH", "#ff6b5a");
  ctx.strokeStyle = "#ffee88";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#58d4ff";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(w / 2, 50);
  ctx.lineTo(w / 2 - 30, 110);
  ctx.lineTo(w / 2 + 10, 110);
  ctx.lineTo(w / 2 - 20, 190);
  ctx.lineTo(w / 2 + 35, 190);
  ctx.lineTo(w / 2, 260);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(w / 2, 55, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffaa88";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText("DEFENSE: STORM EYE", 130, h - 34);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#ff6b5a";
  ctx.fillText("AUTOMATED SENTINEL", 168, h - 16);
}

function paintLaserMural(ctx, w, h) {
  paintHazardBase(ctx, w, h, "BEAM", "#58d4ff");
  ctx.fillStyle = "#224455";
  ctx.fillRect(w / 2 - 40, 90, 80, 80);
  ctx.strokeStyle = "#58d4ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(w / 2 - 40, 90, 80, 80);

  ctx.strokeStyle = "#79ffe8";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(w / 2, 170);
  ctx.lineTo(w / 2, 270);
  ctx.stroke();

  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(w / 2, 130, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#79ffe8";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText("DEFENSE: BEAM LENS", 138, h - 34);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#ff6b5a";
  ctx.fillText("AUTOMATED SENTINEL", 168, h - 16);
}

function createHazardTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (type === "lightning") paintLightningMural(ctx, canvas.width, canvas.height);
  else paintLaserMural(ctx, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBeamMesh(type) {
  if (type === "lightning") {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(21);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const core = new THREE.Line(geo, mat);
    const glowMat = new THREE.LineBasicMaterial({
      color: 0x58d4ff,
      transparent: true,
      opacity: 0.45,
    });
    const glow = new THREE.Line(geo, glowMat);
    const group = new THREE.Group();
    group.add(core);
    group.add(glow);
    group.visible = false;
    return { group, core, glow, geo, type: "lightning" };
  }

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1, 8),
    new THREE.MeshBasicMaterial({
      color: 0x79ffe8,
      transparent: true,
      opacity: 0.85,
    })
  );
  beam.visible = false;
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 1, 8),
    new THREE.MeshBasicMaterial({
      color: 0x58d4ff,
      transparent: true,
      opacity: 0.25,
    })
  );
  glow.visible = false;
  const group = new THREE.Group();
  group.add(beam);
  group.add(glow);
  return { group, beam, glow, type: "laser" };
}

function jitterPoint(base, spread, seed) {
  const n = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return base + (n - 0.5) * spread;
}

function updateLightningBeam(beam, origin, target) {
  const positions = beam.geo.attributes.position.array;
  const segments = 6;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(origin.x, target.x, t);
    const y = THREE.MathUtils.lerp(origin.y, target.y, t);
    const z = THREE.MathUtils.lerp(origin.z, target.z, t);
    const idx = i * 3;
    positions[idx] = i === 0 || i === segments ? x : jitterPoint(x, 0.35, i + t * 10);
    positions[idx + 1] = i === 0 || i === segments ? y : jitterPoint(y, 0.25, i + t * 7);
    positions[idx + 2] = i === 0 || i === segments ? z : jitterPoint(z, 0.35, i + t * 5);
  }
  beam.geo.attributes.position.needsUpdate = true;
  beam.group.position.set(0, 0, 0);
}

function updateLaserBeam(beam, origin, target) {
  const mid = origin.clone().add(target).multiplyScalar(0.5);
  const length = origin.distanceTo(target);
  beam.group.position.copy(mid);
  beam.group.lookAt(target);
  beam.group.rotateX(Math.PI / 2);
  beam.beam.scale.set(1, length, 1);
  beam.glow.scale.set(1, length, 1);
}

function isEntityInBeam(origin, target, entityPos, beamRadius) {
  const line = target.clone().sub(origin);
  const len = line.length();
  if (len < 0.01) return false;
  line.normalize();
  const toEntity = entityPos.clone().sub(origin);
  const proj = toEntity.dot(line);
  if (proj < 0 || proj > len) return false;
  const closest = origin.clone().add(line.multiplyScalar(proj));
  return closest.distanceTo(entityPos) <= beamRadius;
}

function hazardForwardVec(h) {
  return h.side === "left" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
}

function hazardDefFor(h) {
  return (
    HAZARD_DEFS.find((d) => d.id === h.id) || {
      id: h.id,
      z: h.mesh?.position?.z ?? 0,
      side: h.side,
      type: h.type,
      range: h.range ?? 14,
    }
  );
}

function isSpecterInSight(h, pos) {
  const toTarget = pos.clone().sub(h.muzzle);
  const dist = toTarget.length();
  const flat = toTarget.clone();
  flat.y = 0;
  const flatLen = flat.length();
  if (flatLen < 0.1 || dist > h.range + 2) return false;
  flat.normalize();
  return hazardForwardVec(h).dot(flat) > 0.45;
}

function isPosInSight(h, pos) {
  return isSpecterInSight(h, pos);
}

function specterInTrapCone(h, pursuer) {
  const def = hazardDefFor(h);
  if (!isInHazardCone(pursuer.x, pursuer.z, def, 1.35)) return false;
  if (Math.abs(pursuer.z - def.z) > 10) return false;
  return true;
}

/** Exposure-based purge — reliable kill when specter stays in the trap cone. */
function updateSpecterTrapExposure(h, pursuers, delta, onSpecterHit) {
  if (!onSpecterHit || h.suppressMode === "full") return false;

  let exposed = null;
  for (const p of pursuers) {
    if (!p.active || p.banished) continue;
    if (specterInTrapCone(h, p)) exposed = p;
  }

  if (!exposed) {
    h.trapExposure = 0;
    return false;
  }

  if (h.state === "disabled" && h.suppressMode === "agent-only") {
    h.state = "warning";
    h.timer = 0.18;
    h.beamTarget = {
      type: "specter",
      ref: exposed,
      pos: new THREE.Vector3(exposed.x, 1.05, exposed.z),
    };
    h.material.emissiveIntensity = 1.1;
    h.material.emissive.set(0x88ddff);
  }

  h.trapExposure = (h.trapExposure || 0) + delta;

  if (h.trapExposure >= 0.22) {
    onSpecterHit(h, exposed);
    h.trapExposure = 0;
    h.state = "cooldown";
    h.timer = h.cooldownTime * 0.5;
    h.beamTarget = null;
    h.beam.group.visible = false;
    return true;
  }

  return false;
}

function tryPurgeSpecters(h, pursuers, onSpecterHit, allowWarning = false) {
  if (!onSpecterHit) return false;
  for (const p of pursuers) {
    if (p.banished) continue;
    const inCone = specterInTrapCone(h, p);
    const inBeam =
      h.state === "firing" &&
      h.beamTarget?.pos &&
      isEntityInBeam(
        h.muzzle,
        h.beamTarget.pos,
        new THREE.Vector3(p.x, 1.05, p.z),
        h.beamRadius + (h.type === "lightning" ? 0.75 : 0.55)
      );
    const warningKill = allowWarning && h.state === "warning" && h.timer < 0.08 && inCone;
    const firingKill = h.state === "firing" && (inCone || inBeam);

    if (warningKill || firingKill) {
      onSpecterHit(h, p);
      return true;
    }
  }
  return false;
}

function specterAimPoint(pursuer) {
  const lead = 0.35;
  return new THREE.Vector3(
    pursuer.x + (pursuer.vx ?? 0) * lead,
    1.05,
    pursuer.z + (pursuer.vz ?? 0) * lead
  );
}

function collectBeamTargets(h, playerPos, pursuers, agentImmune) {
  const targets = [];

  for (const p of pursuers) {
    if (p.banished) continue;
    const body = new THREE.Vector3(p.x, 1.05, p.z);
    if (isPosInSight(h, body)) {
      targets.push({
        type: "specter",
        pos: specterAimPoint(p),
        ref: p,
        dist: h.muzzle.distanceTo(body),
      });
    }
  }

  if (!agentImmune) {
    const agentTarget = playerPos.clone();
    agentTarget.y = 1.4;
    if (isPosInSight(h, agentTarget)) {
      targets.push({
        type: "player",
        pos: agentTarget,
        ref: null,
        dist: h.muzzle.distanceTo(agentTarget),
      });
    }
  }

  targets.sort((a, b) => a.dist - b.dist);
  return targets;
}

function pickBeamTarget(h, playerPos, pursuers, agentImmune) {
  const targets = collectBeamTargets(h, playerPos, pursuers, agentImmune);
  if (!targets.length) return null;
  const specter = targets.find((t) => t.type === "specter");
  if (specter) return specter;
  return targets[0];
}

function applyDisabledVisual(h) {
  h.material.emissiveIntensity = 0.25;
  h.material.emissive.set(0x113322);
  h.beam.group.visible = false;
  if (h.beam.beam) h.beam.beam.visible = false;
  if (h.beam.glow) h.beam.glow.visible = false;
  h.warnLight.intensity = 0;
}

function applyIdleVisual(h, now) {
  h.material.emissiveIntensity = 0.55 + Math.sin(now * 0.002) * 0.08;
  h.material.emissive.set(h.type === "lightning" ? 0x441111 : 0x113344);
  h.warnLight.intensity = 0;
  h.beam.group.visible = false;
}

export function createHazardMurals(scene) {
  const defs = [
    { id: "lightning-21", z: 21, side: "left", type: "lightning", range: 14 },
    { id: "laser-14", z: 14, side: "right", type: "laser", range: 16 },
    { id: "laser-6", z: 6, side: "left", type: "laser", range: 15 },
    { id: "lightning-0", z: 0, side: "right", type: "lightning", range: 14 },
  ];
  return defs.map((def) => createDefenseHazardMural(scene, def));
}

export function createDefenseHazardMural(scene, def) {
  const width = 1.85;
  const height = 1.15;
  const texture = createHazardTexture(def.type);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: def.type === "lightning" ? 0x441111 : 0x113344,
    emissiveIntensity: 0.6,
    emissiveMap: texture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  const defaultX = def.side === "left" ? -2.92 : 2.92;
  const x = def.x ?? defaultX;
  const y = def.y ?? 2.15;
  const rotY = def.rotY ?? (def.side === "left" ? Math.PI / 2 : -Math.PI / 2);
  mesh.position.set(x, y, def.z);
  mesh.rotation.y = rotY;
  scene.add(mesh);

  const defaultMuzzleX = def.side === "left" ? -2.75 : 2.75;
  const muzzle = new THREE.Vector3(def.muzzleX ?? defaultMuzzleX, y, def.z);

  const beam = createBeamMesh(def.type);
  scene.add(beam.group);

  const warnLight = new THREE.PointLight(0xff4444, 0, 6, 2);
  warnLight.position.set((def.muzzleX ?? defaultMuzzleX) + (def.side === "left" ? 0.25 : -0.25), y + 0.45, def.z);
  scene.add(warnLight);

  return {
    id: def.id ?? `${def.type}-${def.z}`,
    type: def.type,
    mesh,
    material,
    muzzle,
    beam,
    warnLight,
    side: def.side,
    range: def.range ?? 14,
    state: "idle",
    timer: 0,
    disabledUntil: 0,
    chargeTime: def.type === "lightning" ? 1.1 : 1.4,
    fireTime: def.type === "lightning" ? 0.35 : 0.75,
    cooldownTime: 3.5,
    beamRadius: def.type === "lightning" ? 0.9 : 0.55,
    detectAngle: 0.62,
    prompt: `Suppress ${def.type === "lightning" ? "Storm Eye" : "Beam Lens"}`,
    suppressMode: "none",
    beamTarget: null,
    trapExposure: 0,
  };
}

export function disposeDefenseHazardMural(scene, hazard) {
  if (!hazard) return;
  scene.remove(hazard.mesh);
  scene.remove(hazard.beam?.group);
  scene.remove(hazard.warnLight);
  hazard.mesh.geometry?.dispose();
  hazard.material?.map?.dispose();
  hazard.material?.dispose();
  if (hazard.beam?.geo) hazard.beam.geo.dispose();
  hazard.beam?.core?.material?.dispose();
  hazard.beam?.glow?.material?.dispose();
  hazard.beam?.beam?.geometry?.dispose();
  hazard.beam?.beam?.material?.dispose();
  hazard.warnLight?.dispose();
}

export function resetHazardMurals(hazards) {
  for (const h of hazards) {
    h.state = "idle";
    h.timer = 0;
    h.disabledUntil = 0;
    h.suppressMode = "none";
    h.beamTarget = null;
    h.trapExposure = 0;
    h.material.emissiveIntensity = 0.6;
    h.material.emissive.set(h.type === "lightning" ? 0x441111 : 0x113344);
    h.beam.group.visible = false;
    if (h.beam.beam) h.beam.beam.visible = false;
    if (h.beam.glow) h.beam.glow.visible = false;
    h.warnLight.intensity = 0;
  }
}

export function suppressHazard(hazard) {
  hazard.state = "disabled";
  hazard.timer = 0;
  hazard.disabledUntil = performance.now() + 18000;
  hazard.suppressMode = "full";
  applyDisabledVisual(hazard);
}

/** Disable all defense murals at run start so the corridor is traversable. */
export function suppressAllHazards(hazards, durationMs = 120000) {
  const now = performance.now();
  for (const h of hazards) {
    h.state = "disabled";
    h.timer = 0;
    h.disabledUntil = now + durationMs;
    h.suppressMode = "agent-only";
    applyDisabledVisual(h);
  }
}

export function updateHazardMurals(hazards, playerPos, delta, onHit, options = {}) {
  const { pursuers = [], onSpecterHit = null } = options;
  const now = performance.now();

  for (const h of hazards) {
    if (updateSpecterTrapExposure(h, pursuers, delta, onSpecterHit)) {
      continue;
    }

    const agentImmune =
      h.state === "disabled" ||
      h.suppressMode === "agent-only" ||
      h.suppressMode === "full";
    const specterDefenseAllowed =
      onSpecterHit && pursuers.some((p) => !p.banished) && h.suppressMode !== "full";

    if (h.state === "disabled") {
      if (now >= h.disabledUntil) {
        h.state = "idle";
        h.suppressMode = "none";
        applyIdleVisual(h, now);
      } else if (!specterDefenseAllowed) {
        continue;
      } else {
        const target = pickBeamTarget(h, playerPos, pursuers, true);
        if (!target || target.type !== "specter") {
          applyDisabledVisual(h);
          continue;
        }
        h.state = "warning";
        h.timer = h.chargeTime * 0.38;
        h.beamTarget = target;
      }
    }

    const forward = hazardForwardVec(h);
    const toPlayer = playerPos.clone().sub(h.muzzle);
    const dist = toPlayer.length();
    toPlayer.y = 0;
    const flat = toPlayer.clone();
    flat.y = 0;
    const flatLen = flat.length();
    let inSight = false;
    if (flatLen > 0.1 && dist <= h.range) {
      flat.normalize();
      inSight = forward.dot(flat) > h.detectAngle;
    }

    if (h.state === "idle" && dist < 7 && flatLen > 0.2 && h.suppressMode === "none") {
      const wrongSide =
        (h.side === "left" && playerPos.x < 0.3) || (h.side === "right" && playerPos.x > -0.3);
      if (wrongSide && forward.dot(flat) > 0.35) {
        h.state = "disabled";
        h.disabledUntil = now + 22000;
        h.suppressMode = "full";
        applyDisabledVisual(h);
        continue;
      }
    }

    if (h.state === "idle") {
      const target = pickBeamTarget(h, playerPos, pursuers, agentImmune);
      if (target) {
        h.state = "warning";
        h.timer = target.type === "specter" ? h.chargeTime * 0.42 : h.chargeTime;
        h.beamTarget = target;
      } else {
        applyIdleVisual(h, now);
      }
    }

    if (h.state === "warning") {
      h.beamTarget = pickBeamTarget(h, playerPos, pursuers, agentImmune) || h.beamTarget;
      if (!h.beamTarget) {
        h.state = h.suppressMode === "agent-only" ? "disabled" : "idle";
        h.timer = 0;
        if (h.state === "disabled") applyDisabledVisual(h);
        else applyIdleVisual(h, now);
        continue;
      }

      h.timer -= delta;
      const pulse = 0.7 + Math.sin(now * 0.02) * 0.35;
      h.material.emissiveIntensity = 1.2 * pulse;
      h.material.emissive.set(h.beamTarget.type === "specter" ? 0x88ddff : 0xff2200);
      h.warnLight.intensity = 0.6 * pulse;
      h.warnLight.color.set(h.beamTarget.type === "specter" ? 0x58d4ff : 0xff4444);

      if (
        h.beamTarget.type === "specter" &&
        tryPurgeSpecters(h, pursuers, onSpecterHit, true)
      ) {
        h.state = "cooldown";
        h.timer = h.cooldownTime * 0.65;
        h.beamTarget = null;
        h.beam.group.visible = false;
        continue;
      }

      if (h.timer <= 0) {
        h.state = "firing";
        h.timer = h.beamTarget?.type === "specter" ? h.fireTime * 2.2 : h.fireTime;
      }
    }

    if (h.state === "firing") {
      h.timer -= delta;
      h.beamTarget = pickBeamTarget(h, playerPos, pursuers, agentImmune) || h.beamTarget;
      if (h.beamTarget?.type === "specter" && h.beamTarget.ref) {
        h.beamTarget.pos = specterAimPoint(h.beamTarget.ref);
      }
      const target = h.beamTarget?.pos?.clone() || playerPos.clone().setY(1.4);
      target.y = h.beamTarget?.type === "specter" ? 1.05 : 1.4;

      h.beam.group.visible = true;
      if (h.beam.type === "lightning") {
        if (h.beam.beam) h.beam.beam.visible = true;
        if (h.beam.glow) h.beam.glow.visible = true;
        updateLightningBeam(h.beam, h.muzzle, target);
      } else {
        h.beam.beam.visible = true;
        h.beam.glow.visible = true;
        updateLaserBeam(h.beam, h.muzzle, target);
      }

      h.material.emissiveIntensity = 2;
      h.warnLight.intensity = 1.2;

      if (tryPurgeSpecters(h, pursuers, onSpecterHit, false)) {
        h.state = "cooldown";
        h.timer = h.cooldownTime * 0.65;
        h.beamTarget = null;
        h.beam.group.visible = false;
        continue;
      }

      if (!agentImmune) {
        const agentTarget = playerPos.clone().setY(1.4);
        if (isEntityInBeam(h.muzzle, target, agentTarget, h.beamRadius)) {
          onHit(h);
          h.state = "cooldown";
          h.timer = h.cooldownTime;
          h.beamTarget = null;
          h.beam.group.visible = false;
          continue;
        }
      }

      if (h.timer <= 0) {
        h.state = "cooldown";
        h.timer = h.cooldownTime;
        h.beamTarget = null;
        h.beam.group.visible = false;
      }
    }

    if (h.state === "cooldown") {
      h.timer -= delta;
      h.material.emissiveIntensity = 0.5;
      h.warnLight.intensity = 0;
      h.beam.group.visible = false;
      if (h.timer <= 0) {
        if (h.suppressMode === "agent-only" && now < h.disabledUntil) {
          h.state = "disabled";
          applyDisabledVisual(h);
        } else {
          h.state = "idle";
          h.suppressMode = "none";
        }
        h.beamTarget = null;
      }
    }
  }
}

export function nearestHazard(hazards, playerPos, radius = 3.2) {
  let best = null;
  let bestDist = Infinity;
  for (const h of hazards) {
    const dx = playerPos.x - h.mesh.position.x;
    const dz = playerPos.z - h.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= radius && dist < bestDist && h.state !== "disabled") {
      best = h;
      bestDist = dist;
    }
  }
  return best;
}

// Designed by Dang-Tue Hoang, AI Engineer
