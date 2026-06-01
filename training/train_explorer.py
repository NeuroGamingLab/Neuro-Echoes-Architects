#!/usr/bin/env python3
"""Train PPO explorer for Echoes Stage 1 + fit state encoder."""

from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import numpy as np
import yaml
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

from training.echoes_env import EchoesStage1Env, OBS_SIZE


def collect_states(n_episodes: int = 40):
    states = []
    env = EchoesStage1Env()
    for _ in range(n_episodes):
        obs, _ = env.reset()
        done = False
        while not done:
            states.append(obs.copy())
            action = env.action_space.sample()
            obs, _, term, trunc, _ = env.step(action)
            done = term or trunc
    return np.array(states, dtype=np.float32)


def fit_encoder(states: np.ndarray, cfg: dict, save_dir: str):
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA
    import joblib

    n_comp = cfg["unsupervised"]["n_components"]
    n_clust = cfg["unsupervised"]["n_clusters"]
    pca = PCA(n_components=min(n_comp, states.shape[1], states.shape[0]))
    reduced = pca.fit_transform(states)
    kmeans = KMeans(n_clusters=n_clust, n_init=10, random_state=42)
    kmeans.fit(reduced)

    bundle = {"pca": pca, "kmeans": kmeans}
    enc_path = os.path.join(save_dir, "state_encoder.joblib")
    joblib.dump(bundle, enc_path)
    print(f"Saved state encoder → {enc_path}")


def main():
    cfg_path = os.path.join(ROOT, "training", "config.yaml")
    with open(cfg_path) as f:
        cfg = yaml.safe_load(f)

    save_dir = os.path.join(ROOT, cfg["training"]["save_path"])
    os.makedirs(save_dir, exist_ok=True)

    print("Collecting states for encoder…")
    states = collect_states()
    fit_encoder(states, cfg, save_dir)

    print("Training PPO…")
    env = DummyVecEnv([lambda: EchoesStage1Env(cfg["environment"]["max_steps"])])
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=cfg["agent"]["learning_rate"],
        n_steps=cfg["agent"]["n_steps"],
        batch_size=cfg["agent"]["batch_size"],
        gamma=cfg["agent"]["gamma"],
        policy_kwargs=cfg["agent"]["policy_kwargs"],
        verbose=1,
    )
    model.learn(total_timesteps=cfg["training"]["total_timesteps"])
    out = os.path.join(save_dir, "best_model.zip")
    model.save(out)
    print(f"Saved model → {out}")


if __name__ == "__main__":
    main()
