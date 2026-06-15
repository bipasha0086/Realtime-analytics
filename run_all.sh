#!/usr/bin/env bash
# run_all.sh — start backend and frontend from repository root
# Usage:
#   bash run_all.sh
# Notes:
# - This script assumes you have Node.js/npm installed and a POSIX shell (Git Bash, WSL, or macOS/Linux).
# - For Windows/PowerShell, see instructions below.
# - Logs are written to ./logs/server.log and ./logs/client.log
# - To stop both processes, press Ctrl-C (the script will attempt to kill the background server) or run `pkill -P $$`.

set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

# Helper: run command in directory, log output to file and run in background
run_bg() {
  local workdir="$1"; shift
  local logfile="$1"; shift
  local cmd=("$@")
  echo "[run_all] Starting: ${cmd[*]} (cwd=$workdir) -> $logfile"
  ( cd "$workdir" && nohup "${cmd[@]}" > "$logfile" 2>&1 & )
  sleep 0.2
}

# Platform note: this script targets POSIX shells (bash). On Windows prefer run_all.ps1.
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  echo "[run_all] Detected Windows environment. If you want to use this script please run it inside Git Bash or WSL."
  echo "Alternatively run the PowerShell helper: .\\run_all.ps1"
fi

INSTALL_DEPS=true
if [[ "${1-}" == "--no-install" ]]; then
  INSTALL_DEPS=false
fi

echo "[run_all] Repo root: $ROOT_DIR"

if $INSTALL_DEPS; then
  echo "[run_all] Installing backend dependencies (server)..."
  ( cd "$ROOT_DIR/server" && npm install )
else
  echo "[run_all] Skipping dependency install (server)"
fi

echo "[run_all] Starting backend (server)... logs -> $LOG_DIR/server.log"
# Start server in background
( cd "$ROOT_DIR/server" && nohup npm start > "$LOG_DIR/server.log" 2>&1 & )
SERVER_PID=$(pgrep -f -n "node .*server" || true)
if [[ -z "$SERVER_PID" ]]; then
  # fallback to last background job PID in this shell (best-effort)
  SERVER_PID=$!
fi
echo "[run_all] Backend PID=$SERVER_PID"

if $INSTALL_DEPS; then
  echo "[run_all] Installing frontend dependencies (client)..."
  ( cd "$ROOT_DIR/client" && npm install )
else
  echo "[run_all] Skipping dependency install (client)"
fi

echo "[run_all] Starting frontend (client) — Vite dev server. logs -> $LOG_DIR/client.log"
# Start frontend in background and capture PID
( cd "$ROOT_DIR/client" && nohup npm run dev > "$LOG_DIR/client.log" 2>&1 & )
CLIENT_PID=$(pgrep -f -n "node .*vite" || true)
if [[ -z "$CLIENT_PID" ]]; then
  CLIENT_PID=$!
fi
echo "[run_all] Frontend PID=$CLIENT_PID"

# Trap and cleanup
cleanup() {
  echo "[run_all] Cleaning up..."
  for pid in "$CLIENT_PID" "$SERVER_PID"; do
    if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
      echo "[run_all] Killing PID $pid"
      kill "$pid" || true
    fi
  done
  exit 0
}
trap cleanup INT TERM EXIT

echo "[run_all] Both processes started. Tailing logs (press Ctrl-C to stop)."
echo "- Server log: $LOG_DIR/server.log"
echo "- Client log: $LOG_DIR/client.log"

# Start a combined tail so the user can see both logs live
if command -v multitail >/dev/null 2>&1; then
  multitail -n 200 "$LOG_DIR/server.log" -I "$LOG_DIR/client.log"
else
  # fall back to simple tail -f in background and wait on them
  tail -n 200 -f "$LOG_DIR/server.log" "$LOG_DIR/client.log" &
  TAIL_PID=$!
  wait $TAIL_PID
fi

cleanup
