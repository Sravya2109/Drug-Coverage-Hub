#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$ROOT/.venv"

log() { printf "\033[1;36m[dev]\033[0m %s\n" "$*"; }

# Python env
if [[ ! -d "$VENV" ]]; then
  log "Creating virtual environment..."
  python3 -m venv "$VENV"
fi

log "Installing Python dependencies..."
"$VENV/bin/pip" install --upgrade pip >/dev/null
"$VENV/bin/pip" install -r "$ROOT/requirements.txt"

# Frontend deps
log "Installing frontend dependencies..."
pushd "$ROOT/frontend" >/dev/null
npm install
popd >/dev/null

# Start backend
log "Starting FastAPI backend on :8000"
"$VENV/bin/python" -m uvicorn policy_extractor.api.app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cleanup() {
  log "Stopping backend (PID $BACKEND_PID)..."
  kill "$BACKEND_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Start frontend (blocks)
log "Starting Vite dev server on :5173"
pushd "$ROOT/frontend" >/dev/null
npm run dev -- --host --port 5173
popd >/dev/null
