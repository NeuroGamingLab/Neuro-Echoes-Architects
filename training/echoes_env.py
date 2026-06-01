"""Gymnasium environment for Echoes Stage 1 — grid corridor + hazards + sigils."""

from __future__ import annotations

import math
from typing import Any

import gymnasium as gym
import numpy as np
from gymnasium import spaces

OBS_SIZE = 48
HAZARD_DEFS = [
    {"id": "lightning-21", "z": 21, "side": "left", "range": 14},
    {"id": "laser-14", "z": 14, "side": "right", "range": 16},
    {"id": "laser-6", "z": 6, "side": "left", "range": 15},
    {"id": "lightning-0", "z": 0, "side": "right", "range": 14},
]
SIGILS = ["sun", "moon", "eye"]
GOALS = [
    (0, 26, "move"),
    (-2.2, 22, "terminal"),
    (2, 18, "move"),
    (0, 10, "move"),
    (-8, -2, "sun"),
    (0, -14, "moon"),
    (8, -2, "eye"),
    (0, -17, "airlock"),
]


class EchoesStage1Env(gym.Env):
    metadata = {"render_modes": []}

    def __init__(self, max_steps: int = 800):
        super().__init__()
        self.max_steps = max_steps
        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Box(-1.0, 1.0, shape=(OBS_SIZE,), dtype=np.float32)
        self.reset()

    def _in_cone(self, px: float, pz: float, hdef: dict) -> bool:
        mx = -2.75 if hdef["side"] == "left" else 2.75
        dx, dz = px - mx, pz - hdef["z"]
        dist = math.hypot(dx, dz)
        if dist > hdef["range"]:
            return False
        if dist < 0.15:
            return True
        dot = (dx if hdef["side"] == "left" else -dx) / dist
        return dot > 0.55

    def _hazard_states(self) -> list[dict]:
        t = self.step_count * 0.05
        states = []
        for i, h in enumerate(HAZARD_DEFS):
            phase = (t + i * 1.7) % 6.0
            if phase < 2.0:
                state = "idle"
            elif phase < 3.2:
                state = "warning"
            elif phase < 3.8:
                state = "firing"
            else:
                state = "cooldown"
            states.append({**h, "state": state})
        return states

    def _build_obs(self) -> np.ndarray:
        obs = np.zeros(OBS_SIZE, dtype=np.float32)
        px, pz = self.pos
        obs[0] = (px + 10) / 20
        obs[1] = (pz + 19) / 47
        obs[2] = math.sin(self.yaw)
        obs[3] = math.cos(self.yaw)
        obs[4] = self.oxygen / 100
        obs[5] = self.goal_idx / max(len(GOALS) - 1, 1)
        for i, s in enumerate(SIGILS):
            obs[6 + i] = 1.0 if s in self.sigils else 0.0
        gx, gz = GOALS[min(self.goal_idx, len(GOALS) - 1)][:2]
        dx, dz = gx - px, gz - pz
        dist = math.hypot(dx, dz) or 1
        obs[10], obs[11], obs[12] = dx / dist, dz / dist, min(dist / 40, 1)
        obs[13] = 1.0 if abs(px) <= 2.85 else 0.0
        obs[14] = 1.0 if abs(px) <= 10 and pz < 2 else 0.0

        smap = {"idle": 0, "warning": 0.33, "firing": 0.66, "cooldown": 0.85}
        o = 15
        for h in self._hazard_states():
            mx = -2.75 if h["side"] == "left" else 2.75
            obs[o] = smap[h["state"]]
            obs[o + 1] = min(math.hypot(px - mx, pz - h["z"]) / h["range"], 1)
            obs[o + 2] = 1.0 if self._in_cone(px, pz, h) and h["state"] == "firing" else 0.0
            obs[o + 3] = 1.0 if h["side"] == "left" else 0.0
            obs[o + 4] = 1.0 if h["state"] in ("warning", "firing") else 0.0
            obs[o + 5] = 0.0
            o += 6
        obs[44] = 1 / 14
        return obs

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        super().reset(seed=seed)
        self.pos = np.array([0.0, 28.0], dtype=np.float32)
        self.yaw = math.pi
        self.oxygen = 100.0
        self.goal_idx = 0
        self.sigils = set()
        self.step_count = 0
        return self._build_obs(), {}

    def step(self, action: int):
        self.step_count += 1
        speed = 3.6 * 0.05
        gx, gz, kind = GOALS[min(self.goal_idx, len(GOALS) - 1)]
        dx, dz = gx - self.pos[0], gz - self.pos[1]
        dist = math.hypot(dx, dz) or 1
        ux, uz = dx / dist, dz / dist

        if action == 0:
            self.pos[0] += ux * speed
            self.pos[1] += uz * speed
        elif action == 1:
            self.pos[0] -= speed * 0.65
        elif action == 2:
            self.pos[0] += speed * 0.65
        # wait = no move

        self.pos[0] = np.clip(self.pos[0], -10, 10)
        self.pos[1] = np.clip(self.pos[1], -18, 28)
        self.oxygen -= 0.65 * 0.05

        reward = -0.01
        terminated = False
        truncated = self.step_count >= self.max_steps or self.oxygen <= 0

        hazards = self._hazard_states()
        for h in hazards:
            if h["state"] == "firing" and self._in_cone(float(self.pos[0]), float(self.pos[1]), h):
                reward -= 25
                terminated = True

        dist_goal = math.hypot(self.pos[0] - gx, self.pos[1] - gz)
        reward += (1.0 - min(dist_goal / 40, 1)) * 0.05

        if dist_goal < 1.0:
            if kind in SIGILS and kind not in self.sigils:
                self.sigils.add(kind)
                reward += 15
            elif kind == "airlock" and len(self.sigils) == 3:
                reward += 50
                terminated = True
            if self.goal_idx < len(GOALS) - 1:
                self.goal_idx += 1
                reward += 2

        if self.oxygen <= 0:
            reward -= 10
            terminated = True

        return self._build_obs(), reward, terminated, truncated, {}
