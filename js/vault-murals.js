import { mountGalleryMural, canvasTexture } from "./mural-mount.js";

function vaultBase(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#182820");
  g.addColorStop(1, "#0e1812");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(88, 255, 170, 0.65)";
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, w - 28, h - 28);
}

function cap(ctx, text, w, h) {
  ctx.fillStyle = "rgba(88, 255, 170, 0.85)";
  ctx.font = "11px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h - 26);
  ctx.textAlign = "left";
}

function paintEngineerEye(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(210, 200, 180, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 10, 55, 28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(61, 255, 138, 0.55)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 10, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  cap(ctx, "ENGINEER OCULUS", w, h);
}

function paintAmpuleDiagram(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(201, 169, 98, 0.85)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const x = w / 2 - 50 + i * 50;
    ctx.beginPath();
    ctx.moveTo(x, h / 2 + 40);
    ctx.lineTo(x, h / 2 - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, h / 2 - 35, 14, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  cap(ctx, "AMPULE SCHEMATIC", w, h);
}

function paintBlackGoo(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.fillStyle = "rgba(26, 80, 48, 0.75)";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(80 + i * 70, h / 2 + Math.sin(i) * 20, 22 + i * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(61, 255, 138, 0.5)";
  ctx.stroke();
  cap(ctx, "PATHOGEN STRATA", w, h);
}

function paintBioSpine(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(180, 170, 150, 0.85)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let y = 50; y < h - 50; y += 12) {
    const x = w / 2 + Math.sin(y * 0.08) * 25;
    if (y === 50) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  cap(ctx, "VERTEBRAL CAST", w, h);
}

function paintContainment(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(255, 107, 90, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2, 50);
  ctx.lineTo(w / 2 + 45, h / 2 + 30);
  ctx.lineTo(w / 2 - 45, h / 2 + 30);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 107, 90, 0.25)";
  ctx.fill();
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#ff6b5a";
  ctx.textAlign = "center";
  ctx.fillText("!", w / 2, h / 2 + 8);
  cap(ctx, "BREACH PROTOCOL", w, h);
}

function paintDnaGoo(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(88, 255, 170, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t = 0; t < Math.PI * 4; t += 0.15) {
    const x = w / 2 + Math.cos(t) * 35;
    const y = 50 + t * 18;
    if (t === 0) ctx.beginPath();
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  cap(ctx, "CREATION HELIX", w, h);
}

function paintEngineerHand(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(210, 200, 180, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 30, h / 2 + 40);
  ctx.quadraticCurveTo(w / 2, h / 2 - 50, w / 2 + 40, h / 2);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + 10 + i * 8, h / 2 - 10);
    ctx.lineTo(w / 2 + 20 + i * 10, h / 2 - 45);
    ctx.stroke();
  }
  cap(ctx, "MAKER'S HAND", w, h);
}

function paintSeal(ctx, w, h) {
  vaultBase(ctx, w, h);
  ctx.strokeStyle = "rgba(201, 169, 98, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 5, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2 - 53);
  ctx.lineTo(w / 2 + 40, h / 2 + 30);
  ctx.lineTo(w / 2 - 40, h / 2 + 30);
  ctx.closePath();
  ctx.stroke();
  cap(ctx, "SEAL OF ORIGIN", w, h);
}

const DRAWERS = [
  paintEngineerEye,
  paintAmpuleDiagram,
  paintBlackGoo,
  paintBioSpine,
  paintContainment,
  paintDnaGoo,
  paintEngineerHand,
  paintSeal,
];

function sideX(side) {
  return side === "left" ? -8.85 : 8.85;
}

function sideRot(side) {
  return side === "left" ? Math.PI / 2 : -Math.PI / 2;
}

export function addVaultMurals(scene, track) {
  const placements = [
    { z: -54, side: "left", index: 0, width: 1.0, height: 0.68, y: 2.1 },
    { z: -54, side: "right", index: 1, width: 1.55, height: 1.05, y: 2.35 },
    { z: -57, side: "left", index: 2, width: 2.15, height: 1.42, y: 2.5 },
    { z: -57, side: "right", index: 3, width: 0.95, height: 0.62, y: 2.0 },
    { z: -60, side: "left", index: 4, width: 1.2, height: 1.75, y: 2.55 },
    { z: -60, side: "right", index: 5, width: 1.65, height: 1.1, y: 2.3 },
    { z: -63, side: "left", index: 6, width: 1.45, height: 0.95, y: 2.25 },
    { z: -63, side: "right", index: 7, width: 2.35, height: 0.95, y: 2.2 },
    { z: -66, side: "left", index: 1, width: 1.55, height: 1.05, y: 2.35 },
    { z: -66, side: "right", index: 2, width: 1.0, height: 1.45, y: 2.45 },
    { z: -69, side: "left", index: 3, width: 2.0, height: 1.35, y: 2.45 },
    { z: -69, side: "right", index: 4, width: 1.15, height: 0.75, y: 2.05 },
    { z: -72, side: "left", index: 5, width: 0.9, height: 0.6, y: 1.95 },
    { z: -72, side: "right", index: 6, width: 1.75, height: 1.2, y: 2.4 },
    { z: -75, side: "left", index: 7, width: 1.35, height: 1.65, y: 2.5 },
    { z: -75, side: "right", index: 0, width: 2.2, height: 1.48, y: 2.55 },
    { z: -78, side: "left", index: 2, width: 1.05, height: 0.7, y: 2.05 },
    { z: -78, side: "right", index: 3, width: 1.5, height: 1.0, y: 2.3 },
    { z: -81, side: "left", index: 4, width: 1.85, height: 1.25, y: 2.4 },
    { z: -81, side: "right", index: 5, width: 1.0, height: 1.55, y: 2.45 },
    { z: -84, side: "left", index: 6, width: 1.6, height: 1.08, y: 2.32 },
    { z: -84, side: "right", index: 7, width: 2.4, height: 1.05, y: 2.25 },
  ];

  for (const p of placements) {
    const texture = canvasTexture(DRAWERS[p.index % DRAWERS.length]);
    mountGalleryMural(scene, track, {
      texture,
      x: sideX(p.side),
      y: p.y,
      z: p.z,
      rotY: sideRot(p.side),
      width: p.width,
      height: p.height,
      emissive: 0x1a4030,
      emissiveIntensity: 1.3,
      frameColor: 0x0f1814,
      frameEmissive: 0x1a4030,
      keyLightColor: 0xe8fff4,
      accentLightColor: 0x58ffaa,
      addLights: false,
    });
  }
}

// Designed by Dang-Tue Hoang, AI Engineer
