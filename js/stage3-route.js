/** Stage 3 — Ampule Vault: secure the black-goo urns in order. */

export const AMPULE_ORDER = ["catalyst", "serum", "payload"];
export const AMPULE_LABELS = {
  catalyst: "Catalyst Urn",
  serum: "Serum Ampule",
  payload: "Payload Vessel",
};

export const STAGE3_WAYPOINTS = [
  { x: 0, z: -51, observe: "Shuttle dock — vault airlock." },
  {
    x: 2.2,
    z: -58,
    action: "terminal",
    id: "vault-terminal",
    observe: "Reading containment log.",
  },
  { x: -3.5, z: -66, action: "ampule", id: "catalyst", observe: "Catalyst Urn." },
  { x: 3.5, z: -72, action: "ampule", id: "serum", observe: "Serum Ampule." },
  { x: -3.5, z: -78, action: "ampule", id: "payload", observe: "Payload Vessel." },
  { x: 0, z: -84, observe: "Vault sealed. Proceed to Juggernaut deck." },
];

export function buildStage3Route(activatedAmpules = []) {
  return STAGE3_WAYPOINTS.filter(
    (node) => !(node.action === "ampule" && activatedAmpules.includes(node.id))
  );
}

// Designed by Dang-Tue Hoang, AI Engineer
