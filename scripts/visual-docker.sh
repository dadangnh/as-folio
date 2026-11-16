#!/usr/bin/env bash
set -euo pipefail

# Determine Playwright version from installed @playwright/test package
PLAYWRIGHT_VERSION=$(bun -e 'console.log(require("./node_modules/@playwright/test/package.json").version)')
# Bun version from package.json "packageManager" (bun@x.y.z)
BUN_VERSION=$(bun -e 'console.log(require("./package.json").packageManager.split("@")[1])')
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

UPDATE_FLAG=""
EXTRA_ARGS=()

for arg in "$@"; do
  if [ "$arg" = "--update" ]; then
    UPDATE_FLAG="--update-snapshots"
  else
    EXTRA_ARGS+=("$arg")
  fi
done

echo "Running visual tests in container: $IMAGE"

docker run --rm --ipc=host \
  -v "$PWD":/work \
  -v /work/node_modules \
  -w /work \
  -e HUSKY=0 \
  -e CI=1 \
  -e BUN_VERSION="$BUN_VERSION" \
  "$IMAGE" \
  bash -lc "npm i -g bun@\$BUN_VERSION && bun install --frozen-lockfile && bun run build:verify && bunx playwright test -c playwright.visual.config.ts ${UPDATE_FLAG} ${EXTRA_ARGS[*]:-}"
