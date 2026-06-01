import { isGalleryStage, getMinimapForGallery } from "./gallery-stages.js";

const STAGE1_BOUNDS = { xMin: -14, xMax: 14, zMin: -22, zMax: 29 };
const STAGE2_BOUNDS = { xMin: -8, xMax: 8, zMin: -52, zMax: -18 };
const STAGE3_BOUNDS = { xMin: -10, xMax: 10, zMin: -88, zMax: -48 };
const STAGE4_BOUNDS = { xMin: -12, xMax: 12, zMin: -116, zMax: -82 };

const STAGE1_ROOMS = [
  { label: "Entry", x: -3, z: 27, w: 6, h: 0.4, kind: "entry" },
  { label: "Corridor", x: -3, z: -7, w: 6, h: 34, kind: "corridor" },
  { label: "Chamber", x: -12, z: -20, w: 24, h: 24, kind: "chamber" },
];

const STAGE2_ROOMS = [
  { label: "Bridge", x: -2.2, z: -50, w: 4.4, h: 30, kind: "bridge" },
];

const STAGE3_ROOMS = [
  { label: "Dock", x: -2.4, z: -58, w: 4.8, h: 8, kind: "corridor" },
  { label: "Vault", x: -9, z: -84, w: 18, h: 28, kind: "vault" },
];

const STAGE4_ROOMS = [
  { label: "Sanctum", x: -11, z: -115, w: 22, h: 30, kind: "sanctum" },
];

const STAGE1_MARKERS = [
  { id: "terminal", label: "Log", x: -2.2, z: 22, color: "#58d4ff", shape: "square" },
  { id: "h1", label: "!", x: -2.92, z: 21, color: "#ff6b5a", shape: "hazard" },
  { id: "h2", label: "!", x: 2.92, z: 14, color: "#ff6b5a", shape: "hazard" },
  { id: "h3", label: "!", x: -2.92, z: 6, color: "#ff6b5a", shape: "hazard" },
  { id: "h4", label: "!", x: 2.92, z: 0, color: "#ff6b5a", shape: "hazard" },
  { id: "sun", label: "Sun", x: -8, z: -2, color: "#ffc857", shape: "diamond", kind: "objective" },
  { id: "moon", label: "Moon", x: 0, z: -14, color: "#aecbfa", shape: "diamond", kind: "objective" },
  { id: "eye", label: "Eye", x: 8, z: -2, color: "#ff7f6b", shape: "diamond", kind: "objective" },
  { id: "starmap", label: "Map", x: 0, z: -8, color: "#58d4ff", shape: "ring" },
  { id: "exit", label: "Lock", x: 0, z: -19.55, color: "#79ffe8", shape: "door" },
];

const STAGE2_MARKERS = [
  { id: "bridge-log", label: "Log", x: 1.4, z: -24, color: "#9b7bff", shape: "square" },
  { id: "echo", label: "Echo", x: -1.6, z: -28, color: "#9b7bff", shape: "diamond", kind: "objective" },
  { id: "signal", label: "Sig", x: 1.6, z: -36, color: "#58d4ff", shape: "diamond", kind: "objective" },
  { id: "anchor", label: "Anch", x: -1.6, z: -43, color: "#79ffe8", shape: "diamond", kind: "objective" },
  { id: "shuttle", label: "Dock", x: 0, z: -49.5, color: "#79ffe8", shape: "door" },
];

const STAGE3_MARKERS = [
  { id: "vault-log", label: "Log", x: 2.2, z: -58, color: "#58ffaa", shape: "square" },
  { id: "head", label: "Head", x: 0, z: -79, color: "#88ffcc", shape: "ring" },
  { id: "catalyst", label: "Cat", x: -3.5, z: -66, color: "#58ffaa", shape: "diamond", kind: "objective" },
  { id: "serum", label: "Ser", x: 3.5, z: -72, color: "#88ffcc", shape: "diamond", kind: "objective" },
  { id: "payload", label: "Pay", x: -3.5, z: -78, color: "#3dff8a", shape: "diamond", kind: "objective" },
  { id: "lift", label: "Lift", x: 0, z: -84, color: "#58ffaa", shape: "door" },
];

const STAGE4_MARKERS = [
  { id: "sanctum-log", label: "Log", x: -2, z: -88, color: "#ffaa66", shape: "square" },
  { id: "chair", label: "Chair", x: 0, z: -104, color: "#ff8844", shape: "ring" },
  { id: "helm", label: "Helm", x: -4, z: -94, color: "#ffaa66", shape: "diamond", kind: "objective" },
  { id: "drive", label: "Drv", x: 4, z: -100, color: "#ff7744", shape: "diamond", kind: "objective" },
  { id: "ascent", label: "Asc", x: 0, z: -106, color: "#ffcc88", shape: "diamond", kind: "objective" },
  { id: "pod", label: "Pod", x: 0, z: -111, color: "#58d4ff", shape: "door" },
];

export function createMinimap(canvas) {
  const ctx = canvas.getContext("2d");
  const padding = 10;
  let currentStage = 1;

  function getConfig() {
    if (isGalleryStage(currentStage)) {
      const g = getMinimapForGallery(currentStage);
      if (g) return g;
    }
    if (currentStage === 4) {
      return { bounds: STAGE4_BOUNDS, rooms: STAGE4_ROOMS, markers: STAGE4_MARKERS };
    }
    if (currentStage === 3) {
      return { bounds: STAGE3_BOUNDS, rooms: STAGE3_ROOMS, markers: STAGE3_MARKERS };
    }
    if (currentStage === 2) {
      return { bounds: STAGE2_BOUNDS, rooms: STAGE2_ROOMS, markers: STAGE2_MARKERS };
    }
    return { bounds: STAGE1_BOUNDS, rooms: STAGE1_ROOMS, markers: STAGE1_MARKERS };
  }

  function worldToMap(x, z, bounds) {
    const innerW = canvas.width - padding * 2;
    const innerH = canvas.height - padding * 2;
    const mx = padding + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * innerW;
    const mz = padding + ((bounds.zMax - z) / (bounds.zMax - bounds.zMin)) * innerH;
    return { x: mx, y: mz };
  }

  function drawRoom(room, bounds) {
    const topLeft = worldToMap(room.x, room.z + room.h, bounds);
    const bottomRight = worldToMap(room.x + room.w, room.z, bounds);
    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    ctx.fillStyle =
      room.kind === "chamber"
        ? "rgba(40, 70, 82, 0.55)"
        : room.kind === "bridge"
          ? "rgba(50, 40, 82, 0.55)"
          : room.kind === "vault"
            ? "rgba(20, 50, 35, 0.55)"
            : room.kind === "sanctum"
              ? "rgba(60, 30, 20, 0.55)"
          : room.kind === "gallery"
            ? "rgba(45, 38, 58, 0.55)"
            : room.kind === "square"
              ? "rgba(50, 44, 62, 0.58)"
              : room.kind === "circle"
                ? "rgba(44, 52, 68, 0.58)"
                : room.kind === "octagon"
                  ? "rgba(52, 40, 58, 0.58)"
                  : room.kind === "sphere"
                    ? "rgba(48, 38, 54, 0.58)"
                    : room.kind === "entry"
            ? "rgba(50, 90, 70, 0.45)"
            : "rgba(30, 45, 52, 0.65)";
    ctx.strokeStyle = "rgba(120, 190, 210, 0.45)";
    ctx.lineWidth = 1;
    ctx.fillRect(topLeft.x, topLeft.y, w, h);
    ctx.strokeRect(topLeft.x, topLeft.y, w, h);
  }

  function drawMarker(marker, activatedObjectives, bounds) {
    const { x, y } = worldToMap(marker.x, marker.z, bounds);
    const isObjective = marker.kind === "objective";
    const active = isObjective && activatedObjectives.includes(marker.id);

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = marker.color;
    ctx.globalAlpha = active ? 1 : isObjective ? 0.95 : 0.85;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    if (marker.shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      if (active) ctx.stroke();
    } else if (marker.shape === "ring") {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (marker.shape === "door") {
      ctx.fillRect(-4, -3, 8, 6);
      ctx.strokeRect(-4, -3, 8, 6);
    } else if (marker.shape === "hazard") {
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(-4, -4, 8, 8);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(210, 230, 235, 0.9)";
    ctx.font = "8px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(marker.label, 0, 12);
    ctx.restore();
  }

  function drawSpecter(specter, bounds) {
    const { x, y } = worldToMap(specter.x, specter.z, bounds);
    const hunting = specter.hunting !== false;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = hunting ? 1 : 0.55;
    ctx.fillStyle = "#ff2244";
    ctx.strokeStyle = hunting ? "#ff8899" : "#884455";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(5, -2, 5, 4, 0, 6);
    ctx.bezierCurveTo(-5, 4, -5, -2, 0, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255, 180, 190, 0.95)";
    ctx.font = "7px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(specter.roleLabel?.[0] ?? "G", 0, 2);
    ctx.restore();
  }

  function drawPlayer(x, z, yaw, bounds) {
    const { x: px, y: py } = worldToMap(x, z, bounds);
    const dirX = Math.sin(yaw);
    const dirZ = -Math.cos(yaw);
    const angle = Math.atan2(dirX, -dirZ);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = isGalleryStage(currentStage)
      ? "#c9a962"
      : currentStage === 4
        ? "#ff8844"
        : currentStage === 3
          ? "#58ffaa"
          : currentStage === 2
            ? "#9b7bff"
            : "#58d4ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawStatic() {
    const { bounds, rooms } = getConfig();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(4, 8, 10, 0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = isGalleryStage(currentStage)
      ? "rgba(201, 169, 98, 0.35)"
      : currentStage === 4
        ? "rgba(255, 136, 68, 0.35)"
        : currentStage === 3
          ? "rgba(88, 255, 170, 0.35)"
          : currentStage === 2
            ? "rgba(155, 123, 255, 0.35)"
            : "rgba(88, 212, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

    for (const room of rooms) drawRoom(room, bounds);
  }

  function setStage(stage) {
    currentStage = stage;
    drawStatic();
  }

  function update(
    playerX,
    playerZ,
    yaw,
    activatedObjectives = [],
    stage = currentStage,
    specters = []
  ) {
    currentStage = stage;
    const { bounds, markers } = getConfig();
    drawStatic();
    for (const marker of markers) drawMarker(marker, activatedObjectives, bounds);
    for (const specter of specters) drawSpecter(specter, bounds);
    drawPlayer(playerX, playerZ, yaw, bounds);
  }

  drawStatic();
  return { update, setStage };
}

// Designed by Dang-Tue Hoang, AI Engineer
