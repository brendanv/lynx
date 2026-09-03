#!/usr/bin/env bash
# Seed a throwaway database and render every page of the app in a browser,
# saving a screenshot of each one.
#
#   ./run.sh                    # seed from scratch, then run the whole suite
#   ./run.sh --no-seed          # reuse the existing test database
#   ./run.sh --project desktop-light   # anything after the flags goes to Playwright
#
# Requires: go and node (npm).
set -euo pipefail

cd "$(dirname "$0")"

SEED=1
PLAYWRIGHT_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-seed)
      SEED=0
      shift
      ;;
    --help | -h)
      sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      PLAYWRIGHT_ARGS+=("$1")
      shift
      ;;
  esac
done

DATA_DIR="${LYNX_SEED_DATA_DIR:-./pb_test_data}"
BACKEND_PORT="${LYNX_BACKEND_PORT:-8090}"

# Playwright reuses a server it finds already listening, which would point the
# tests at whatever database that server opened - and reseeding underneath a
# running server corrupts it. So refuse rather than produce nonsense.
if [[ "$SEED" == "1" ]] && (exec 3<>"/dev/tcp/127.0.0.1/$BACKEND_PORT") 2>/dev/null; then
  exec 3>&-
  echo "Something is already listening on port $BACKEND_PORT." >&2
  echo "Stop it, or run with --no-seed to test against it as-is." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> Installing test dependencies"
  npm install
  echo "==> Installing the Playwright browser"
  npx playwright install chromium
fi

if [[ ! -d ../frontend/node_modules ]]; then
  echo "==> Installing frontend dependencies"
  (cd ../frontend && npm ci)
fi

if [[ "$SEED" == "1" ]]; then
  echo "==> Seeding test database ($DATA_DIR)"
  (cd ../backend && go run ./cmd/seed --reset --dir "$DATA_DIR")
fi

echo "==> Running browser tests"
npx playwright test ${PLAYWRIGHT_ARGS[@]+"${PLAYWRIGHT_ARGS[@]}"}

echo
echo "Screenshots: $(pwd)/screenshots"
echo "HTML report: npm run report"
