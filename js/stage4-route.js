/** Stage 4 — Juggernaut Sanctum: awaken the pilot chair, escape the structure. */

export const CONSOLE_ORDER = ["helm", "drive", "ascent"];
export const CONSOLE_LABELS = {
  helm: "Helm Interface",
  drive: "Drive Core",
  ascent: "Ascent Protocol",
};

export const STAGE4_WAYPOINTS = [
  { x: 0, z: -86, observe: "Juggernaut Sanctum — entry." },
  {
    x: -2,
    z: -88,
    action: "terminal",
    id: "sanctum-terminal",
    observe: "Reading flight primers.",
  },
  { x: -4, z: -94, action: "console", id: "helm", observe: "Helm Interface." },
  { x: 4, z: -100, action: "console", id: "drive", observe: "Drive Core." },
  { x: 0, z: -106, action: "console", id: "ascent", observe: "Ascent Protocol." },
  { x: 0, z: -112, observe: "Cryo escape cradle — launch armed." },
];

export function buildStage4Route(activatedConsoles = []) {
  return STAGE4_WAYPOINTS.filter(
    (node) => !(node.action === "console" && activatedConsoles.includes(node.id))
  );
}

// Designed by Dang-Tue Hoang, AI Engineer
