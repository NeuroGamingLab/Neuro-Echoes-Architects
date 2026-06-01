import * as THREE from "three";
import { mountGalleryMural, canvasTexture } from "./mural-mount.js";

function bridgePaintBase(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1a1410");
  grad.addColorStop(0.45, "#121820");
  grad.addColorStop(1, "#0c1018");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 2 ? "#c9a962" : "#9b7bff";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(201, 169, 98, 0.65)";
  ctx.lineWidth = 5;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.strokeStyle = "rgba(155, 123, 255, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, w - 44, h - 44);
}

function ink(ctx, color = "rgba(210, 190, 150, 0.92)") {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function caption(ctx, text, w, h) {
  ctx.fillStyle = "rgba(155, 123, 255, 0.85)";
  ctx.font = "11px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h - 28);
  ctx.textAlign = "left";
}

function mirrorNotes(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.font = "9px Georgia, serif";
  ctx.fillStyle = "#79ffe8";
  const notes = ["speculum", "a · b = c · d", "ω", "1519", "Δ"];
  for (let i = 0; i < notes.length; i++) {
    ctx.fillText(notes[i], 28 + i * 42, 38 + (i % 2) * 12);
  }
  ctx.restore();
}

/** Vitruvian proportions — circle and square */
function paintVitruvian(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  mirrorNotes(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2 - 8;
  ink(ctx, "rgba(88, 212, 255, 0.55)");
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(cx - 68, cy - 68, 136, 136);
  ink(ctx);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy - 28, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx, cy + 52);
  ctx.moveTo(cx - 48, cy + 8);
  ctx.lineTo(cx + 48, cy + 8);
  ctx.moveTo(cx - 38, cy + 52);
  ctx.lineTo(cx - 12, cy + 8);
  ctx.lineTo(cx + 12, cy + 8);
  ctx.lineTo(cx + 38, cy + 52);
  ctx.moveTo(cx - 52, cy + 2);
  ctx.quadraticCurveTo(cx - 72, cy - 20, cx - 48, cy - 38);
  ctx.moveTo(cx + 52, cy + 2);
  ctx.quadraticCurveTo(cx + 72, cy - 20, cx + 48, cy - 38);
  ctx.stroke();
  caption(ctx, "HARMONIA MUNDI", w, h);
}

/** Ornithopter wing study */
function paintOrnithopter(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2;
  ink(ctx, "rgba(201, 169, 98, 0.9)");
  ctx.lineWidth = 2;
  for (const sign of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.quadraticCurveTo(cx + sign * 90, cy - 40, cx + sign * 130, cy + 10);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x = cx + sign * (30 + t * 90);
      const y = cy + 20 - t * 55 + Math.sin(t * 4) * 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sign * 18, y - 22);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(88, 212, 255, 0.5)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 30, 22, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "rgba(121, 255, 232, 0.7)");
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(cx - 140, cy + 55);
  ctx.lineTo(cx + 140, cy + 55);
  ctx.stroke();
  ctx.setLineDash([]);
  caption(ctx, "MACHINE OF FLIGHT", w, h);
}

/** Anatomical heart and vessels */
function paintAnatomyHeart(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2;
  ink(ctx, "rgba(255, 127, 107, 0.75)");
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 50);
  ctx.bezierCurveTo(cx + 55, cy - 50, cx + 55, cy + 30, cx, cy + 55);
  ctx.bezierCurveTo(cx - 55, cy + 30, cx - 55, cy - 50, cx, cy - 50);
  ctx.stroke();
  ink(ctx, "rgba(210, 190, 150, 0.85)");
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 15);
    ctx.lineTo(cx + Math.cos(a) * 45, cy + Math.sin(a) * 40);
    ctx.stroke();
  }
  ctx.font = "italic 10px Georgia, serif";
  ctx.fillStyle = "rgba(201, 169, 98, 0.7)";
  ctx.fillText("vena · arteria", cx - 38, cy + 78);
  caption(ctx, "STUDY OF PULSE", w, h);
}

/** Helical air screw */
function paintHelicalScrew(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  const cx = w / 2;
  const cy = h / 2 + 10;
  ink(ctx);
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const t = i / 24;
    const a = t * Math.PI * 4;
    const r = 18 + t * 42;
    const x = cx + Math.cos(a) * r;
    const y = cy - 60 + t * 120;
    if (i === 0) ctx.beginPath();
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 70);
  ctx.lineTo(cx, cy + 70);
  ctx.stroke();
  ink(ctx, "rgba(155, 123, 255, 0.8)");
  ctx.lineWidth = 1;
  for (let y = cy - 50; y < cy + 50; y += 18) {
    ctx.beginPath();
    ctx.moveTo(cx - 55, y);
    ctx.lineTo(cx + 55, y);
    ctx.stroke();
  }
  caption(ctx, "AERIAL SPIRAL", w, h);
}

/** Geometric solids — platonic study */
function paintPolyhedra(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  ink(ctx, "rgba(88, 212, 255, 0.85)");
  ctx.lineWidth = 1.8;
  function drawCube(ox, oy, s) {
    const p = [
      [0, 0], [s, 0], [s, s], [0, s],
      [s * 0.35, -s * 0.35], [s * 1.35, -s * 0.35], [s * 1.35, s * 0.65], [s * 0.35, s * 0.65],
    ];
    ctx.beginPath();
    ctx.moveTo(ox + p[0][0], oy + p[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(ox + p[i][0], oy + p[i][1]);
    ctx.closePath();
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + p[i][0], oy + p[i][1]);
      ctx.lineTo(ox + p[i + 4][0], oy + p[i + 4][1]);
      ctx.stroke();
    }
  }
  drawCube(w / 2 - 70, h / 2 - 30, 55);
  ink(ctx, "rgba(201, 169, 98, 0.85)");
  ctx.beginPath();
  const cx = w / 2 + 55;
  const cy = h / 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * 40;
    const y = cy + Math.sin(a) * 40;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  caption(ctx, "SOLIDS OF PROPORTION", w, h);
}

/** Water flow and eddies */
function paintWaterStudy(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  ink(ctx, "rgba(88, 212, 255, 0.7)");
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 5; row++) {
    ctx.beginPath();
    for (let x = 40; x < w - 40; x += 8) {
      const y = h / 2 - 40 + row * 22 + Math.sin(x * 0.04 + row) * 14;
      if (x === 40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ink(ctx);
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const cx = 120 + i * 90;
    const cy = h / 2 + (i % 2) * 20;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  caption(ctx, "CURRENTS OF THE VOID", w, h);
}

/** Hand and gesture — creator's touch */
function paintStudyOfHands(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  ink(ctx);
  ctx.lineWidth = 2;
  function sketchHand(ox, oy, mirror) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(mirror, 1);
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.quadraticCurveTo(20, 0, 45, -10);
    ctx.quadraticCurveTo(70, -18, 85, 5);
    ctx.stroke();
    for (const t of [0.25, 0.45, 0.62, 0.78, 0.92]) {
      ctx.beginPath();
      ctx.moveTo(45 + t * 40, -10 + t * 15);
      ctx.quadraticCurveTo(55 + t * 35, -55, 75 + t * 20, -35 - t * 10);
      ctx.stroke();
    }
    ctx.restore();
  }
  sketchHand(w / 2 - 55, h / 2 + 10, 1);
  sketchHand(w / 2 + 55, h / 2 + 10, -1);
  ink(ctx, "rgba(155, 123, 255, 0.65)");
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2 - 50);
  ctx.lineTo(w / 2, h / 2 + 60);
  ctx.stroke();
  ctx.setLineDash([]);
  caption(ctx, "TOUCH OF THE MAKER", w, h);
}

/** Bridge blueprint cross-section */
function paintBridgeBlueprint(ctx, w, h) {
  bridgePaintBase(ctx, w, h);
  ink(ctx, "rgba(121, 255, 232, 0.85)");
  ctx.lineWidth = 1.2;
  ctx.strokeRect(w / 2 - 100, h / 2 - 55, 200, 90);
  ctx.beginPath();
  ctx.moveTo(w / 2 - 100, h / 2 + 35);
  ctx.lineTo(w / 2 + 100, h / 2 + 35);
  ctx.stroke();
  ink(ctx);
  ctx.lineWidth = 2;
  for (let x = w / 2 - 80; x <= w / 2 + 80; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, h / 2 - 55);
    ctx.lineTo(x, h / 2 + 35);
    ctx.stroke();
  }
  ctx.font = "9px Georgia, serif";
  ctx.fillStyle = "rgba(201, 169, 98, 0.8)";
  ctx.fillText("span 280 cubiti", w / 2 - 42, h / 2 - 62);
  ctx.fillText("void depth ∞", w / 2 - 32, h / 2 + 52);
  caption(ctx, "BRIDGE SECTION", w, h);
}

const BRIDGE_MURAL_DRAWERS = [
  paintVitruvian,
  paintOrnithopter,
  paintAnatomyHeart,
  paintHelicalScrew,
  paintPolyhedra,
  paintWaterStudy,
  paintStudyOfHands,
  paintBridgeBlueprint,
];

function createBridgeMuralTexture(index) {
  return canvasTexture((ctx, w, h) => {
    BRIDGE_MURAL_DRAWERS[index % BRIDGE_MURAL_DRAWERS.length](ctx, w, h);
  });
}

function mountMural(scene, track, { z, side, index, width = 1.55, height = 1.05, y = 2.35 }) {
  const x = side === "left" ? -1.88 : 1.88;
  mountGalleryMural(scene, track, {
    texture: createBridgeMuralTexture(index),
    x,
    y,
    z,
    rotY: side === "left" ? Math.PI / 2 : -Math.PI / 2,
    width,
    height,
    emissive: 0x5a4080,
    emissiveIntensity: 1.25,
    frameColor: 0x1a1428,
    frameEmissive: 0x2a1848,
    keyLightColor: 0xfff4e8,
    accentLightColor: side === "left" ? 0xb8a0ff : 0xffd890,
  });
}

/** Da Vinci–inspired sketch murals along the Architect's Bridge. */
export function addBridgeMurals(scene, track) {
  const murals = [
    { z: -22.5, side: "left", index: 0, width: 1.0, height: 0.68, y: 2.1 },
    { z: -22.5, side: "right", index: 1, width: 1.55, height: 1.05 },
    { z: -25.5, side: "left", index: 2, width: 2.1, height: 1.38, y: 2.45 },
    { z: -25.5, side: "right", index: 3, width: 0.95, height: 0.65, y: 2.05 },
    { z: -28.5, side: "left", index: 4, height: 1.15 },
    { z: -28.5, side: "right", index: 5, height: 1.15, width: 1.75 },
    { z: -31.5, side: "left", index: 6, width: 1.25, height: 1.65, y: 2.5 },
    { z: -31.5, side: "right", index: 7 },
    { z: -34.5, side: "left", index: 1, width: 2.2, height: 0.95, y: 2.2 },
    { z: -34.5, side: "right", index: 0, width: 1.15, height: 0.75, y: 2.05 },
    { z: -37.5, side: "left", index: 3 },
    { z: -37.5, side: "right", index: 2, width: 1.85, height: 1.22, y: 2.38 },
    { z: -40.5, side: "left", index: 5, width: 1.05, height: 1.48, y: 2.42 },
    { z: -40.5, side: "right", index: 4 },
    { z: -43.5, side: "left", index: 7, width: 1.65, height: 1.08 },
    { z: -43.5, side: "right", index: 6, width: 0.9, height: 0.62, y: 2.0 },
    { z: -46.5, side: "left", index: 2, width: 1.4, height: 0.92, y: 2.18 },
    { z: -46.5, side: "right", index: 1, width: 2.35, height: 1.05, y: 2.28 },
    { z: -49, side: "left", index: 0, width: 1.7, height: 1.2 },
    { z: -49, side: "right", index: 7, width: 1.7, height: 1.2 },
  ];

  for (const entry of murals) {
    mountMural(scene, track, entry);
  }

  // Ceiling scroll panels — holographic Da Vinci studies overhead
  for (let i = 0; i < 6; i++) {
    const z = -24 - i * 4.5;
    const tex = createBridgeMuralTexture(2 + (i % 4));
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0x3a4868,
      emissiveIntensity: 1.05,
      emissiveMap: tex,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const panelW = i % 3 === 0 ? 1.45 : 1.05;
    const panelH = i % 3 === 0 ? 0.9 : 0.65;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), mat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(i % 2 === 0 ? -0.55 : 0.55, 3.95, z);
    scene.add(panel);
    track(panel);

    const overhead = new THREE.SpotLight(0xffffff, 1.8, 8, Math.PI / 4.5, 0.3, 1.2);
    overhead.position.set(i % 2 === 0 ? -0.55 : 0.55, 3.55, z);
    overhead.target.position.set(i % 2 === 0 ? -0.55 : 0.55, 3.95, z);
    scene.add(overhead);
    scene.add(overhead.target);
    track(overhead);
    track(overhead.target);
  }
}

// Designed by Dang-Tue Hoang, AI Engineer
