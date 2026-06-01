/** Stage 2 — Architect's Bridge: tune beacons, reach extraction shuttle. */

export const BEACON_ORDER = ["echo", "signal", "anchor"];
export const BEACON_LABELS = {
  echo: "Echo Resonance",
  signal: "Deep Signal",
  anchor: "Gravity Anchor",
};

export const STAGE2_WAYPOINTS = [
  { x: 0, z: -21, observe: "Crossing airlock threshold." },
  {
    x: 0,
    z: -24,
    action: "terminal",
    id: "bridge-terminal",
    observe: "Architect's Bridge — reading manifest.",
  },
  { x: -1.6, z: -28, action: "beacon", id: "echo", observe: "Echo Beacon." },
  { x: 0, z: -33 },
  { x: 1.6, z: -36, action: "beacon", id: "signal", observe: "Signal Beacon." },
  { x: 0, z: -40 },
  { x: -1.6, z: -43, action: "beacon", id: "anchor", observe: "Anchor Beacon." },
  { x: 0, z: -47, observe: "Extraction cradle." },
  { x: 0, z: -49.5, observe: "Boarding shuttle." },
];

export function buildStage2Route(activatedBeacons = []) {
  return STAGE2_WAYPOINTS.filter(
    (node) => !(node.action === "beacon" && activatedBeacons.includes(node.id))
  );
}

// Designed by Dang-Tue Hoang, AI Engineer
