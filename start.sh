#!/usr/bin/env bash
# Plug-and-play dev startup for macOS / Linux.
# Sets up the backend venv + frontend node_modules on first run, then
# launches the Django API and the Vite dev server together.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "==> Backend setup"
cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
  echo "No .env found — copying .env.example. Edit backend/.env with your DB credentials before continuing."
  cp .env.example .env
fi

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing backend dependencies..."
pip install -q -r requirements.txt

echo "Applying database migrations..."
python manage.py migrate

echo "==> Frontend setup"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "==> Starting Django backend on http://127.0.0.1:8000"
cd "$BACKEND_DIR"
python manage.py runserver &
BACKEND_PID=$!

cleanup() {
  echo ""
  echo "Stopping backend (pid $BACKEND_PID)..."
  kill "$BACKEND_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "==> Starting Vite frontend on http://127.0.0.1:5173"
cd "$FRONTEND_DIR"
npm run dev
