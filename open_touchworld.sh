#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3001}"
HOST="${HOST:-127.0.0.1}"
BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/touchworld-project}"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-/tmp/npm-cache-codex}"
NODE24=(npx --cache "$NPM_CACHE_DIR" -p node@24 node)
NPM24=(npx --cache "$NPM_CACHE_DIR" -p node@24 -p npm@11 npm)

if [[ ! -f package.json ]]; then
  echo "package.json not found. Please run this script from the website repository."
  exit 1
fi

NEED_BUILD=0
if [[ "${FORCE_BUILD:-0}" == "1" ]]; then
  NEED_BUILD=1
elif [[ ! -f out/index.html || src/app/page.tsx -nt out/index.html || src/app/layout.tsx -nt out/index.html || next.config.ts -nt out/index.html ]]; then
  NEED_BUILD=1
fi

if [[ "$NEED_BUILD" == "1" ]]; then
  if [[ ! -x node_modules/.bin/next ]]; then
    echo "Next.js dependencies not found. Installing with npm ci..."
    "${NPM24[@]}" ci --include=optional --cache "$NPM_CACHE_DIR"
  fi
  echo "Building static website export..."
  "${NODE24[@]}" node_modules/next/dist/bin/next build
fi

while python3 - "$HOST" "$PORT" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sys.exit(0 if sock.connect_ex((host, port)) == 0 else 1)
PY
do
  PORT=$((PORT + 1))
done

if [[ "$BASE_PATH" == "/" ]]; then
  BASE_PATH=""
fi

if [[ -n "$BASE_PATH" ]]; then
  LOCAL_BASE_PATH="${BASE_PATH#/}"
  if [[ ! -e "out/${LOCAL_BASE_PATH}" ]]; then
    ln -s . "out/${LOCAL_BASE_PATH}"
  fi
fi

URL="http://${HOST}:${PORT}${BASE_PATH}/"
echo "Starting website at ${URL}"

python3 -m http.server "$PORT" --bind "$HOST" -d out &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$URL" >/dev/null 2>&1 || true
fi

echo "Press Ctrl+C to stop the server."
wait "$SERVER_PID"
