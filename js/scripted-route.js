/** Simple ordered waypoints — no A*, no path inflation. */

export const SCRIPTED_WAYPOINTS = [
  { x: 0, z: 26, observe: "Entry scan." },
  { x: 0, z: 22 },
  { x: -2.2, z: 22, action: "terminal", observe: "Reading expedition log." },
  { x: 2.0, z: 20 },
  { x: 2.0, z: 14 },
  { x: 2.0, z: 8 },
  { x: 0, z: 2 },
  { x: 0, z: -6, observe: "Chamber." },
  { x: -8, z: -2, action: "sigil", id: "sun", observe: "Solar Gate." },
  { x: 0, z: -14, action: "sigil", id: "moon", observe: "Lunar Veil." },
  { x: 8, z: -2, action: "sigil", id: "eye", observe: "Watcher's Eye." },
  { x: 0, z: -17, observe: "Airlock." },
];

export function buildScriptedRoute(activatedSigils = []) {
  return SCRIPTED_WAYPOINTS.filter(
    (node) => !(node.action === "sigil" && activatedSigils.includes(node.id))
  );
}

// Designed by Dang-Tue Hoang, AI Engineer
