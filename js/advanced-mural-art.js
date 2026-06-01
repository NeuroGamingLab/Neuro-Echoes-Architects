/** Advanced canvas mural art — layered styles for stages 4–14. */

export const MASTERWORKS = [
  { id: "leonardo", name: "Leonardo da Vinci", style: "Renaissance · Sfumato", draw: paintLeonardo },
  { id: "michelangelo", name: "Michelangelo", style: "High Renaissance · Figura", draw: paintMichelangelo },
  { id: "rembrandt", name: "Rembrandt", style: "Baroque · Chiaroscuro", draw: paintRembrandt },
  { id: "caravaggio", name: "Caravaggio", style: "Baroque · Tenebrism", draw: paintCaravaggio },
  { id: "vermeer", name: "Vermeer", style: "Dutch Golden · Luminism", draw: paintVermeer },
  { id: "botticelli", name: "Botticelli", style: "Early Renaissance · Line", draw: paintBotticelli },
  { id: "monet", name: "Monet", style: "Impressionism · Plein air", draw: paintMonet },
  { id: "vangogh", name: "Van Gogh", style: "Post-Impression · Impasto", draw: paintVanGogh },
  { id: "picasso", name: "Picasso", style: "Cubism · Analytic", draw: paintPicasso },
  { id: "frida", name: "Frida Kahlo", style: "Surreal · Symbolist", draw: paintFrida },
  { id: "dali", name: "Salvador Dalí", style: "Surrealism · Dream", draw: paintDali },
  { id: "klimt", name: "Gustav Klimt", style: "Art Nouveau · Gold", draw: paintKlimt },
  { id: "hopper", name: "Edward Hopper", style: "American Realism", draw: paintHopper },
  { id: "hokusai", name: "Hokusai", style: "Ukiyo-e · Wave", draw: paintHokusai },
  { id: "rothko", name: "Mark Rothko", style: "Color Field", draw: paintRothko },
  { id: "pollock", name: "Jackson Pollock", style: "Action · Drip", draw: paintPollock },
  { id: "engineer", name: "Engineer Codex", style: "Xenomorph · Biomech", draw: paintEngineerCodex },
  { id: "juggernaut", name: "Juggernaut Relic", style: "Prometheus · Flight", draw: paintJuggernautRelic },
];

export function getMasterwork(index) {
  return MASTERWORKS[index % MASTERWORKS.length];
}

function frame(ctx, w, h, inner, outer, label, sublabel) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(201, 169, 98, 0.55)";
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  if (label) {
    ctx.fillStyle = "rgba(255, 248, 235, 0.94)";
    ctx.font = "600 12px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(label, w / 2, h - 28);
    if (sublabel) {
      ctx.font = "9px Georgia, serif";
      ctx.fillStyle = "rgba(201, 169, 98, 0.85)";
      ctx.fillText(sublabel, w / 2, h - 14);
    }
    ctx.textAlign = "left";
  }
}

function paintLeonardo(ctx, w, h) {
  frame(ctx, w, h, "#1c1a16", "#0e0c0a", "LEONARDO DA VINCI", "Sfumato · Vitruvian study");
  const cx = w / 2;
  const cy = h / 2 - 12;

  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = "#c9a962";
  for (let r = 30; r < 110; r += 18) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const face = ctx.createRadialGradient(cx - 8, cy - 8, 4, cx, cy, 48);
  face.addColorStop(0, "rgba(235, 210, 175, 0.95)");
  face.addColorStop(0.6, "rgba(180, 150, 120, 0.75)");
  face.addColorStop(1, "rgba(80, 60, 45, 0.2)");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 38, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(60, 45, 35, 0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy - 5);
  ctx.quadraticCurveTo(cx, cy - 12, cx + 22, cy - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 12, cy - 8, 3, 0, Math.PI * 2);
  ctx.arc(cx + 12, cy - 8, 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40, 30, 25, 0.8)";
  ctx.fill();

  ctx.strokeStyle = "rgba(201, 169, 98, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 55, cy + 35);
  ctx.quadraticCurveTo(cx, cy + 70, cx + 60, cy + 20);
  ctx.stroke();
}

function paintMichelangelo(ctx, w, h) {
  frame(ctx, w, h, "#181410", "#0a0806", "MICHELANGELO", "High Renaissance · Sistine fragment");
  const cx = w / 2;
  ctx.fillStyle = "rgba(195, 175, 145, 0.9)";
  for (let i = 0; i < 12; i++) {
    ctx.globalAlpha = 0.08 + (i % 3) * 0.04;
    ctx.fillRect(cx - 28 + i * 2, h / 2 - 55 + i, 8, 95 - i * 2);
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.ellipse(cx, h / 2 - 52, 24, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(120, 90, 60, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 70, h / 2 + 10);
  ctx.quadraticCurveTo(cx - 20, h / 2 - 20, cx + 15, h / 2 - 35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 70, h / 2 + 10);
  ctx.quadraticCurveTo(cx + 20, h / 2 - 20, cx - 15, h / 2 - 35);
  ctx.stroke();
}

function paintRembrandt(ctx, w, h) {
  frame(ctx, w, h, "#120e08", "#040302", "REMBRANDT", "Baroque · Chiaroscuro portrait");
  const cx = w / 2;
  const cy = h / 2 - 5;
  const spot = ctx.createRadialGradient(cx - 20, cy - 25, 5, cx, cy, 130);
  spot.addColorStop(0, "rgba(255, 210, 140, 0.65)");
  spot.addColorStop(0.35, "rgba(180, 120, 60, 0.25)");
  spot.addColorStop(1, "rgba(0, 0, 0, 0.92)");
  ctx.fillStyle = spot;
  ctx.fillRect(16, 16, w - 32, h - 32);

  ctx.fillStyle = "rgba(210, 175, 130, 0.88)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 34, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(40, 25, 15, 0.85)";
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 15);
  ctx.quadraticCurveTo(cx, cy - 45, cx + 40, cy - 15);
  ctx.fill();
  ctx.fillStyle = "rgba(201, 169, 98, 0.7)";
  ctx.beginPath();
  ctx.ellipse(cx + 38, cy + 5, 14, 20, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function paintCaravaggio(ctx, w, h) {
  frame(ctx, w, h, "#080808", "#010101", "CARAVAGGIO", "Tenebrism · Judith fragment");
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(16, 16, w - 32, h - 32);
  const beam = ctx.createLinearGradient(0, 0, w, h);
  beam.addColorStop(0, "rgba(255, 220, 160, 0.55)");
  beam.addColorStop(0.4, "rgba(255, 180, 100, 0.15)");
  beam.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = beam;
  ctx.fillRect(20, 20, w - 40, h - 40);

  ctx.fillStyle = "rgba(220, 190, 150, 0.9)";
  ctx.beginPath();
  ctx.ellipse(w / 2 + 10, h / 2 - 15, 22, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 40, 30, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 30, h / 2 + 40);
  ctx.lineTo(w / 2 + 45, h / 2 - 30);
  ctx.stroke();
  ctx.fillStyle = "rgba(120, 20, 15, 0.7)";
  ctx.beginPath();
  ctx.arc(w / 2 + 50, h / 2 - 35, 12, 0, Math.PI * 2);
  ctx.fill();
}

function paintVermeer(ctx, w, h) {
  frame(ctx, w, h, "#101820", "#060a10", "VERMEER", "Dutch Golden · Pearl study");
  ctx.fillStyle = "rgba(25, 35, 50, 0.9)";
  ctx.fillRect(30, h / 2 - 10, w - 60, 80);
  const cx = w / 2 - 15;
  const cy = h / 2 - 20;
  ctx.fillStyle = "rgba(230, 205, 175, 0.92)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 28, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(45, 70, 110, 0.85)";
  ctx.beginPath();
  ctx.ellipse(cx + 35, cy + 15, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 240, 0.95)";
  ctx.beginPath();
  ctx.arc(cx + 35, cy + 12, 4, 0, Math.PI * 2);
  ctx.fill();
  const ray = ctx.createRadialGradient(cx + 35, cy + 12, 2, cx + 35, cy + 12, 60);
  ray.addColorStop(0, "rgba(255, 250, 220, 0.4)");
  ray.addColorStop(1, "rgba(255, 250, 220, 0)");
  ctx.fillStyle = ray;
  ctx.fillRect(0, 0, w, h);
}

function paintBotticelli(ctx, w, h) {
  frame(ctx, w, h, "#141018", "#0a080c", "BOTTICELLI", "Quattrocento · Primavera line");
  ctx.strokeStyle = "rgba(220, 195, 165, 0.88)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(w / 2, 55);
  for (let y = 55; y < h - 50; y += 8) {
    ctx.lineTo(w / 2 + Math.sin(y * 0.08) * 18, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 + 35, 58, Math.PI, 0);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.ellipse(w / 2 - 48 + i * 16, h / 2 - 10, 10, 20, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 180, 200, 0.25)";
  ctx.fill();
}

function paintMonet(ctx, w, h) {
  frame(ctx, w, h, "#0c1820", "#060e14", "MONET", "Impressionism · Nymphéas");
  for (let layer = 0; layer < 8; layer++) {
    ctx.fillStyle = `rgba(${60 + layer * 15}, ${120 + layer * 10}, ${160 + layer * 8}, ${0.2 + layer * 0.04})`;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(50 + i * 85 + layer * 3, h / 2 + 25 + Math.sin(i + layer) * 12, 42 + layer * 4, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "rgba(140, 180, 120, 0.5)";
  for (let x = 40; x < w - 40; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, h / 2 + 55);
    ctx.quadraticCurveTo(x + 6, h / 2 + 20, x + 12, h / 2 + 55);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 220, 180, 0.35)";
  ctx.beginPath();
  ctx.arc(w - 70, 55, 28, 0, Math.PI * 2);
  ctx.fill();
}

function paintVanGogh(ctx, w, h) {
  frame(ctx, w, h, "#0a1428", "#040818", "VAN GOGH", "Post-Impression · Nuit étoilée");
  ctx.strokeStyle = "#1a2848";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h * 0.6);
    ctx.bezierCurveTo(w / 2, h / 2, w / 3, h / 3, w / 2 + (Math.random() - 0.5) * 80, h / 2 + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
  const cx = w / 2;
  const cy = h / 2 - 25;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.strokeStyle = i % 2 ? "#f4d03f" : "#ffeaa7";
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 30, cx + Math.cos(a) * 85, cy + Math.sin(a) * 65);
    ctx.stroke();
  }
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 200, 0.5)";
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
}

function paintPicasso(ctx, w, h) {
  frame(ctx, w, h, "#141018", "#0c080c", "PICASSO", "Analytic Cubism · Portrait");
  const palette = ["#e74c3c", "#3498db", "#f1c40f", "#9b59b6", "#2ecc71", "#e67e22"];
  const parts = [
    [70, 55, 90, 75], [160, 70, 70, 90], [100, 130, 110, 60], [240, 90, 80, 100], [180, 180, 90, 50],
  ];
  parts.forEach(([x, y, pw, ph], i) => {
    ctx.fillStyle = palette[i % palette.length];
    ctx.globalAlpha = 0.75 + (i % 2) * 0.15;
    ctx.save();
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.rotate((i % 3 - 1) * 0.12);
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 20, h / 2 - 30);
  ctx.lineTo(w / 2 + 25, h / 2 + 10);
  ctx.lineTo(w / 2 - 10, h / 2 + 35);
  ctx.closePath();
  ctx.stroke();
}

function paintFrida(ctx, w, h) {
  frame(ctx, w, h, "#1a100c", "#100804", "FRIDA KAHLO", "Surreal · Self-portrait");
  ctx.fillStyle = "rgba(230, 200, 170, 0.92)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 8, 32, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 2;
  for (const [x, y] of [[w / 2, 68], [w / 2 - 42, 118], [w / 2 + 42, 118], [w / 2 - 25, 95], [w / 2 + 25, 95]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(192, 57, 43, 0.35)";
    ctx.fill();
  }
  ctx.fillStyle = "rgba(46, 125, 50, 0.5)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 + 45, 55, 25, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paintDali(ctx, w, h) {
  frame(ctx, w, h, "#181410", "#0c0a08", "DALÍ", "Surrealism · Persistence");
  ctx.fillStyle = "rgba(235, 210, 170, 0.85)";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(90 + i * 110, h / 2 + 20 + i * 8, 28 - i * 4, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 60, 40, 0.6)";
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(201, 169, 98, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 50);
  ctx.lineTo(w / 2 + 40, h / 2);
  ctx.lineTo(w / 2, h - 45);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 200, 100, 0.3)";
  ctx.beginPath();
  ctx.arc(w - 60, 60, 22, 0, Math.PI * 2);
  ctx.fill();
}

function paintKlimt(ctx, w, h) {
  frame(ctx, w, h, "#141008", "#0a0804", "KLIMT", "Art Nouveau · Gold leaf");
  for (let y = 30; y < h - 40; y += 14) {
    for (let x = 30; x < w - 30; x += 14) {
      ctx.fillStyle = (x + y) % 28 === 0 ? "rgba(201, 169, 98, 0.85)" : "rgba(201, 169, 98, 0.15)";
      ctx.fillRect(x, y, 10, 10);
    }
  }
  ctx.fillStyle = "rgba(230, 200, 160, 0.9)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 10, 30, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(201, 169, 98, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 45, 22, 0, Math.PI * 2);
  ctx.stroke();
}

function paintHopper(ctx, w, h) {
  frame(ctx, w, h, "#101820", "#080c14", "HOPPER", "American Realism · Night interior");
  ctx.fillStyle = "rgba(255, 180, 80, 0.55)";
  ctx.fillRect(w / 2 - 5, 40, 10, h - 80);
  ctx.fillStyle = "rgba(30, 40, 55, 0.95)";
  ctx.fillRect(40, h / 2 - 20, w - 80, 70);
  ctx.fillStyle = "rgba(255, 200, 120, 0.75)";
  ctx.fillRect(55, h / 2 - 5, 35, 45);
  ctx.fillStyle = "rgba(180, 160, 140, 0.85)";
  ctx.beginPath();
  ctx.ellipse(w / 2 + 50, h / 2 + 15, 14, 22, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paintHokusai(ctx, w, h) {
  frame(ctx, w, h, "#0c1420", "#060c14", "HOKUSAI", "Ukiyo-e · Great Wave");
  ctx.strokeStyle = "rgba(60, 120, 180, 0.85)";
  ctx.lineWidth = 2.5;
  for (let x = 30; x < w - 30; x += 8) {
    const y = h / 2 + Math.sin(x * 0.04) * 35 + Math.cos(x * 0.02) * 20;
    if (x === 30) ctx.beginPath();
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 200, 80, 0.75)";
  ctx.beginPath();
  ctx.arc(w - 55, 55, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 80, 60, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 30, h - 45);
  ctx.lineTo(w / 2, h / 2 + 30);
  ctx.lineTo(w / 2 + 30, h - 45);
  ctx.closePath();
  ctx.stroke();
}

function paintRothko(ctx, w, h) {
  frame(ctx, w, h, "#0a0a0c", "#040406", "ROTHKO", "Color Field · No. 61");
  const bands = [
    ["#6b1a1a", 35, 90],
    ["#8b3030", 90, 145],
    ["#1a2840", 145, 200],
    ["#0a1420", 200, h - 35],
  ];
  for (const [color, y0, y1] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(28, y0, w - 56, y1 - y0);
  }
}

function paintPollock(ctx, w, h) {
  frame(ctx, w, h, "#101010", "#060606", "POLLOCK", "Action painting · Dripped lattice");
  const colors = ["#e74c3c", "#f1c40f", "#ecf0f1", "#3498db", "#2c3e50"];
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.35 + Math.random() * 0.45;
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function paintEngineerCodex(ctx, w, h) {
  frame(ctx, w, h, "#0c1814", "#060e0a", "ENGINEER CODEX", "Biomechanical · LV-223");
  ctx.strokeStyle = "rgba(88, 255, 170, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 10, 45, 55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(61, 255, 138, 0.35)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 - 10, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let y = 50; y < h - 40; y += 14) {
    const x = w / 2 + Math.sin(y * 0.12) * 22;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(y) * 8, y + 10);
    ctx.stroke();
  }
}

function paintJuggernautRelic(ctx, w, h) {
  frame(ctx, w, h, "#181008", "#0c0804", "JUGGERNAUT RELIC", "Prometheus · Flight schematic");
  ctx.strokeStyle = "rgba(255, 136, 68, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 50);
  ctx.lineTo(w / 2 - 75, h / 2 + 45);
  ctx.lineTo(w / 2 + 75, h / 2 + 45);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 + 5, 38, 58, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 200, 120, 0.6)";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 + 5, 55, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
}

export function drawMasterwork(ctx, w, h, index) {
  getMasterwork(index).draw(ctx, w, h);
}

export function masterworkTexture(canvasTextureFn, index, w = 640, h = 420) {
  return canvasTextureFn((ctx, tw, th) => drawMasterwork(ctx, tw, th, index), w, h);
}

// Designed by Dang-Tue Hoang, AI Engineer
