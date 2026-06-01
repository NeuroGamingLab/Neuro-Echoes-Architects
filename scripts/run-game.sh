#!/bin/bash
# Start Ollama proxy + RL server + static game server
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NODE="${NODE:-node}"
if ! command -v "$NODE" >/dev/null 2>&1; then
  NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
fi

echo "Starting Ollama proxy on :3001..."
"$NODE" server/ollama-proxy.mjs &
PROXY_PID=$!

RL_PID=""
if command -v python3 >/dev/null 2>&1; then
  echo "Starting RL server on :3002..."
  python3 server/rl_server.py &
  RL_PID=$!
else
  echo "Warning: python3 not found — RL server skipped"
fi

cleanup() {
  kill "$PROXY_PID" 2>/dev/null || true
  [ -n "$RL_PID" ] && kill "$RL_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 0.5
echo "Starting game server on :8080..."
echo "Open http://localhost:8080"
python3 -m http.server 8080
