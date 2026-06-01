import { mountGalleryMural, canvasTexture } from "./mural-mount.js";

function paintBase(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#141c20");
  grad.addColorStop(1, "#0a1014");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(201, 169, 98, 0.55)";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(88, 212, 255, 0.25)";
  ctx.strokeRect(18, 18, w - 36, h - 36);
}

function paintStarChart(ctx, w, h) {
  paintBase(ctx, w, h);
  ctx.fillStyle = "#58d4ff";
  const stars = [
    [120, 80], [200, 60], [280, 90], [340, 130], [160, 150], [240, 170], [300, 200], [380, 100],
  ];
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(88, 212, 255, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 80);
  ctx.lineTo(200, 60);
  ctx.lineTo(280, 90);
  ctx.lineTo(340, 130);
  ctx.stroke();
  ctx.fillStyle = "#c9a962";
  ctx.font = "14px serif";
  ctx.fillText("STELLAR CONVERGENCE", 130, h - 36);
}

function paintArchitect(ctx, w, h) {
  paintBase(ctx, w, h);
  ctx.fillStyle = "rgba(201, 169, 98, 0.85)";
  ctx.beginPath();
  ctx.ellipse(w / 2, 95, 28, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(w / 2 - 18, 120, 36, 110);
  ctx.fillRect(w / 2 - 55, 130, 110, 18);
  ctx.fillRect(w / 2 - 14, 225, 12, 55);
  ctx.fillRect(w / 2 + 2, 225, 12, 55);
  ctx.strokeStyle = "#58d4ff";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(w / 2, 95, 40 + i * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#79ffe8";
  ctx.font = "13px serif";
  ctx.fillText("THE BUILDERS", w / 2 - 52, h - 36);
}

function paintMandala(ctx, w, h) {
  paintBase(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2 - 10;
  for (let r = 90; r > 10; r -= 14) {
    ctx.strokeStyle = r % 28 === 0 ? "#c9a962" : "#58d4ff";
    ctx.globalAlpha = 0.35 + (90 - r) / 120;
    ctx.lineWidth = r % 28 === 0 ? 2.5 : 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#58d4ff";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 88, cy + Math.sin(a) * 88);
    ctx.stroke();
  }
  ctx.fillStyle = "#c9a962";
  ctx.font = "13px serif";
  ctx.fillText("CIRCLE OF ORIGIN", cx - 58, h - 36);
}

function paintBioform(ctx, w, h) {
  paintBase(ctx, w, h);
  ctx.strokeStyle = "#79ffe8";
  ctx.lineWidth = 3;
  for (let x = 80; x < w - 40; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.bezierCurveTo(x + 10, 120, x - 10, 170, x, 220);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 107, 90, 0.55)";
  ctx.beginPath();
  ctx.ellipse(w / 2, 145, 42, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff7f6b";
  ctx.stroke();
  ctx.fillStyle = "#c9a962";
  ctx.font = "13px serif";
  ctx.fillText("SEED OF CHANGE", w / 2 - 52, h - 36);
}

function paintPyramid(ctx, w, h) {
  paintBase(ctx, w, h);
  ctx.strokeStyle = "#58d4ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 60);
  ctx.lineTo(w / 2 - 90, 230);
  ctx.lineTo(w / 2 + 90, 230);
  ctx.closePath();
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const y = 60 + i * 30;
    const half = i * 16;
    ctx.beginPath();
    ctx.moveTo(w / 2 - half, y);
    ctx.lineTo(w / 2 + half, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#c9a962";
  ctx.beginPath();
  ctx.arc(w / 2, 95, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#79ffe8";
  ctx.font = "13px serif";
  ctx.fillText("TEMPLE BLUEPRINT", w / 2 - 62, h - 36);
}

function paintProcession(ctx, w, h) {
  paintBase(ctx, w, h);
  ctx.fillStyle = "rgba(201, 169, 98, 0.75)";
  for (let i = 0; i < 5; i++) {
    const x = 70 + i * 70;
    ctx.fillRect(x, 160, 10, 50);
    ctx.beginPath();
    ctx.arc(x + 5, 150, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#58d4ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 210);
  ctx.lineTo(w - 60, 210);
  ctx.stroke();
  ctx.fillStyle = "#58d4ff";
  ctx.font = "13px serif";
  ctx.fillText("PROCESSION TO THE GATE", 118, h - 36);
}

const PAINTING_DRAWERS = [
  paintStarChart,
  paintArchitect,
  paintMandala,
  paintBioform,
  paintPyramid,
  paintProcession,
];

function sideX(side) {
  return side === "left" ? -2.92 : 2.92;
}

function sideRot(side) {
  return side === "left" ? Math.PI / 2 : -Math.PI / 2;
}

export function addCorridorPaintings(scene) {
  const paintings = [
    { z: 23, side: "left", index: 0, width: 1.85, height: 1.15, y: 2.15 },
    { z: 23, side: "right", index: 1, width: 1.45, height: 0.95, y: 2.05 },
    { z: 18, side: "left", index: 2, width: 2.1, height: 1.35, y: 2.35 },
    { z: 18, side: "right", index: 3, width: 1.2, height: 0.8, y: 2.0 },
    { z: 13, side: "left", index: 4, width: 1.55, height: 1.05, y: 2.2 },
    { z: 13, side: "right", index: 5, width: 2.25, height: 1.2, y: 2.3 },
    { z: 8, side: "left", index: 1, width: 1.0, height: 1.5, y: 2.4 },
    { z: 8, side: "right", index: 0, width: 1.75, height: 1.1, y: 2.25 },
    { z: 3, side: "left", index: 3, width: 1.35, height: 0.88, y: 2.08 },
    { z: 3, side: "right", index: 2, width: 1.95, height: 1.28, y: 2.38 },
    { z: -2, side: "left", index: 5, width: 1.65, height: 1.08, y: 2.22 },
    { z: -2, side: "right", index: 4, width: 1.15, height: 0.75, y: 2.02 },
  ];

  for (const entry of paintings) {
    const texture = canvasTexture(PAINTING_DRAWERS[entry.index % PAINTING_DRAWERS.length]);
    mountGalleryMural(scene, null, {
      texture,
      x: sideX(entry.side),
      y: entry.y,
      z: entry.z,
      rotY: sideRot(entry.side),
      width: entry.width,
      height: entry.height,
      emissive: 0x2a4860,
      emissiveIntensity: 1.25,
      frameColor: 0x2a363c,
      frameEmissive: 0x1a3040,
      keyLightColor: 0xfff6ea,
      accentLightColor: 0xc9a962,
    });
  }
}

// Designed by Dang-Tue Hoang, AI Engineer
