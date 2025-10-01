#!/usr/bin/env bash
set -euo pipefail

# Basic script to bump patch versions for @testronaut/* packages,
# build them, and publish to Verdaccio running on localhost:4873.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
REGISTRY_URL=${REGISTRY_URL:-"http://localhost:4873"}

cd "$ROOT_DIR"

echo "Verifying registry authentication ..."
if ! pnpm whoami --registry "$REGISTRY_URL" >/dev/null 2>&1; then
  echo "You are not logged in to $REGISTRY_URL. Please run:"
  echo "  pnpm login --registry $REGISTRY_URL"
  exit 1
fi

echo "Building packages via Nx ..."
pnpm nx run-many -t build

prep_dist_package() { :; }

node "$ROOT_DIR/scripts/prepare-dist-package.cjs" core
node "$ROOT_DIR/scripts/prepare-dist-package.cjs" angular

echo "Publishing to $REGISTRY_URL ..."
pnpm publish packages/core --registry "$REGISTRY_URL" --access public --no-git-checks
pnpm publish packages/angular --registry "$REGISTRY_URL" --access public --no-git-checks

echo "Done. Published new patch versions to $REGISTRY_URL."


