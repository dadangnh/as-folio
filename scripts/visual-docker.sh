#!/usr/bin/env bash
# Run the visual regression suite inside the official Playwright image so fonts and
# rendering match the committed baselines. Usage:
#   bash scripts/visual-docker.sh [--update] [extra playwright args...]
# Env:
#   VISUAL_PLATFORM  docker platform, e.g. linux/amd64 (default: the host's native one).
#                    arm64 and amd64 renders matched on every baseline (2026-11-16), so
#                    native is used locally; emulated amd64 is slow and can crash Chromium.
set -euo pipefail

# Determine Playwright version from installed @playwright/test package
PLAYWRIGHT_VERSION=$(bun -e 'console.log(require("./node_modules/@playwright/test/package.json").version)')
# Bun version from package.json "packageManager" (bun@x.y.z)
BUN_VERSION=$(bun -e 'console.log(require("./package.json").packageManager.split("@")[1])')
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"
PLATFORM_ARGS=()
[ -n "${VISUAL_PLATFORM:-}" ] && PLATFORM_ARGS=(--platform "$VISUAL_PLATFORM")

PW_ARGS=()
for arg in "$@"; do
  if [ "$arg" = "--update" ]; then
    PW_ARGS+=("--update-snapshots")
  else
    PW_ARGS+=("$arg")
  fi
done

echo "Running visual tests in container: $IMAGE ${VISUAL_PLATFORM:-native}"

# SOURCE_DATE_EPOCH pins build-time dates (footer year) so baselines survive New Year.
# Playwright args are passed as positional parameters, so values with spaces survive.
docker run --rm --ipc=host "${PLATFORM_ARGS[@]+"${PLATFORM_ARGS[@]}"}" \
  -v "$PWD":/work \
  -v /work/node_modules \
  -w /work \
  -e HUSKY=0 \
  -e CI=1 \
  -e SOURCE_DATE_EPOCH=1767225600 \
  -e BUN_VERSION="$BUN_VERSION" \
  "$IMAGE" \
  bash -lc 'npm i -g "bun@$BUN_VERSION" && bun install --frozen-lockfile && bun run build:verify && bunx playwright test -c playwright.visual.config.ts "$@"' \
  _ "${PW_ARGS[@]+"${PW_ARGS[@]}"}"
