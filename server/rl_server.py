#!/usr/bin/env python3
"""
RL inference server for Echoes of the Architects.
Neuro-Adaptive-Ghosts-ML style: PPO policy (optional) + rule fallback + alpha-pack pursuers.
"""
from __future__ import annotations

import json
import math
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("RL_SERVER_PORT", "3002"))
BIND_HOST = os.environ.get("BIND_HOST", "127.0.0.1")
MODEL_PATH = os.environ.get(
    "RL_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "..", "models", "explorer_agent", "best_model.zip"),
)

OBS_SIZE = 48
ACTIONS = ["forward", "left", "right", "wait"]
HAZARD_IDS = ["lightning-21", "laser-14", "laser-6", "lightning-0"]
ROLES = ["chaser", "ambusher", "blocker", "patrol"]

_sb3_model = None
_encoder = None


def _load_model():
    global _sb3_model
    if _sb3_model is not None:
        return _sb3_model
    if not os.path.isfile(MODEL_PATH):
        return None
    try:
        from stable_baselines3 import PPO

        _sb3_model = PPO.load(MODEL_PATH)
        return _sb3_model
    except Exception as exc:
        print(f"[rl] model load skipped: {exc}")
        return None


def _load_encoder():
    global _encoder
    if _encoder is not None:
        return _encoder
    enc_path = os.path.join(os.path.dirname(MODEL_PATH), "state_encoder.joblib")
    if not os.path.isfile(enc_path):
        return None
    try:
        import joblib

        bundle = joblib.load(enc_path)

        class Encoder:
            def predict(self, X):
                reduced = bundle["pca"].transform(X)
                return bundle["kmeans"].predict(reduced)

        _encoder = Encoder()
        return _encoder
    except Exception:
        return None


def _goal_follow_policy(gx: float, gz: float) -> tuple[int, str]:
    if gx * gx + gz * gz < 0.02:
        return (3, "Rule: hold at goal")
    if abs(gx) < 0.25 and gz < -0.1:
        return (0, "Rule: advance toward waypoint")
    if gx > 0.15:
        return (2, "Rule: strafe toward goal")
    if gx < -0.15:
        return (1, "Rule: strafe toward goal")
    return (0, "Rule: advance")


def rule_policy(obs: list[float]) -> tuple[int, str]:
    """Heuristic policy mirroring action-search.js."""
    gx = obs[10] if len(obs) > 10 else 0
    gz = obs[11] if len(obs) > 11 else -1
    stage = round(obs[44] * 14) if len(obs) > 44 else 1

    # Stages 2–3: bridge/vault — no specters or defense murals.
    if 2 <= stage < 4:
        return _goal_follow_policy(gx, gz)

    px = obs[0] * 20 - 10
    pz = obs[1] * 47 - 19

    danger = 0.0
    for i, _hid in enumerate(HAZARD_IDS):
        base = 15 + i * 6
        if base + 5 < len(obs) and obs[base + 5] > 0.5:
            continue  # disabled / agent-only — not a threat to the agent
        if base + 4 < len(obs) and obs[base + 4] < 0.5:
            continue  # not warning or firing
        if base + 2 < len(obs):
            danger += obs[base + 2] * 2.5

    if danger > 1.2:
        safe_x = 2.0 if px < 0 else -2.0
        return (1 if safe_x > px else 2, "Rule: evade hazard cone")

    if danger > 0.6:
        return (3, "Rule: hold — trap charging")

    if len(obs) > 43:
        min_pursuer = obs[43]
        if min_pursuer < 0.32:
            # Kite specter toward the next defense mural on the corridor.
            mural_z = [21, 14, 6, 0]
            mural_safe_x = [2.0, -2.0, 2.0, -2.0]
            for hz, sx in zip(mural_z, mural_safe_x):
                if pz > hz - 3 and abs(px - sx) > 0.45:
                    if min_pursuer < 0.13:
                        return (1 if px > 0 else 2, "Rule: flee specter — strafe")
                    if px < sx - 0.2:
                        return (2, f"Rule: lure specter → mural z{hz}")
                    if px > sx + 0.2:
                        return (1, f"Rule: lure specter → mural z{hz}")
                    return (0, f"Rule: lure specter → mural z{hz}")
            if min_pursuer < 0.13:
                return (1 if px > 0 else 2, "Rule: flee specter — strafe")
            if gz < -0.05:
                return (0, "Rule: flee specter — sprint corridor")
            return (1 if px > 0.3 else 2, "Rule: flee specter — break line")

    return _goal_follow_policy(gx, gz)


def predict_action(obs: list[float]) -> dict:
    model = _load_model()
    cluster_id = None

    enc = _load_encoder()
    if enc is not None:
        try:
            cluster_id = int(enc.predict([obs[:OBS_SIZE]])[0])
        except Exception:
            cluster_id = None

    if model is not None:
        try:
            import numpy as np

            action, _ = model.predict(np.array(obs[:OBS_SIZE], dtype=np.float32), deterministic=True)
            act = int(action)
            return {
                "action": act,
                "actionName": ACTIONS[act],
                "source": "ppo",
                "reasoning": f"PPO policy · cluster {cluster_id}" if cluster_id is not None else "PPO policy",
                "clusterId": cluster_id,
            }
        except Exception as exc:
            print(f"[rl] PPO predict failed: {exc}")

    act, reason = rule_policy(obs)
    return {
        "action": act,
        "actionName": ACTIONS[act],
        "source": "rule",
        "reasoning": reason,
        "clusterId": cluster_id,
    }


def pursuer_coordinator(body: dict) -> dict:
    agent = body.get("agent", {})
    pursuers = body.get("pursuers", [])
    stage = float(body.get("stage", 1))
    ax = float(agent.get("x", 0))
    az = float(agent.get("z", 0))
    avx = float(agent.get("vx", 0))
    avz = float(agent.get("vz", 0))
    speed = 2.2 + stage * 0.1

    out = []
    for i, role in enumerate(ROLES):
        p = pursuers[i] if i < len(pursuers) else {"x": ax, "z": az + 5}
        px = float(p.get("x", ax))
        pz = float(p.get("z", az + 5))

        if role == "chaser":
            tx, tz = ax, az
        elif role == "ambusher":
            tx, tz = ax + avx * 2.2, az + avz * 2.2 + 3.5
        elif role == "blocker":
            tx, tz = ax * 0.4, az - 4.5
        else:
            tx, tz = ax + math.sin(i + az * 0.1) * 4, az + 7

        dx, dz = tx - px, tz - pz
        dist = math.hypot(dx, dz) or 1.0
        alpha = 1.35 if role == "chaser" and dist < 8 else 1.0
        out.append(
            {
                "role": role,
                "vx": (dx / dist) * speed * alpha,
                "vz": (dz / dist) * speed * alpha,
                "targetX": tx,
                "targetZ": tz,
            }
        )

    return {"pursuers": out, "mode": "alpha_pack"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            model = _load_model()
            self._json(
                200,
                {
                    "ok": True,
                    "modelLoaded": model is not None,
                    "modelPath": MODEL_PATH,
                    "obsSize": OBS_SIZE,
                    "actions": ACTIONS,
                    "roles": ROLES,
                },
            )
            return
        self._json(404, {"error": "Not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self._read_json()
            if path == "/api/act":
                obs = body.get("observation") or []
                if len(obs) < OBS_SIZE:
                    obs = (obs + [0.0] * OBS_SIZE)[:OBS_SIZE]
                result = predict_action(obs)
                self._json(200, result)
                return
            if path == "/api/pursuers":
                self._json(200, pursuer_coordinator(body))
                return
            self._json(404, {"error": "Not found"})
        except Exception as exc:
            self._json(500, {"error": str(exc)})


def main():
    _load_model()
    server = ThreadingHTTPServer((BIND_HOST, PORT), Handler)
    print(f"RL server http://{BIND_HOST}:{PORT}")
    print(f"Model path: {MODEL_PATH} (loaded={_load_model() is not None})")
    server.serve_forever()


if __name__ == "__main__":
    main()
