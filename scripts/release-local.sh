#!/usr/bin/env bash
set -euo pipefail

# Basic script to bump patch versions for @testronaut/* packages,
# build them, and publish to Verdaccio running on localhost:4873.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
REGISTRY_URL=${REGISTRY_URL:-"http://localhost:4873"}

cd "$ROOT_DIR"

echo "Checking Verdaccio at $REGISTRY_URL ..."
if ! PONG=$(curl -sf -m 3 "$REGISTRY_URL/-/ping" || true); then
  echo "Error: Verdaccio not reachable at $REGISTRY_URL. Start it first (e.g., 'npx verdaccio --listen $REGISTRY_URL')." >&2
  exit 1
fi

if [[ "$PONG" != *"pong"* ]]; then
  echo "Warning: Unexpected ping response from Verdaccio: $PONG" >&2
fi

echo "Verifying registry authentication ..."
if ! pnpm whoami --registry "$REGISTRY_URL" >/dev/null 2>&1; then
  echo "You are not logged in to $REGISTRY_URL. Please run:"
  echo "  pnpm login --registry $REGISTRY_URL"
  exit 1
fi

echo "Building packages via Nx ..."
pnpm nx run-many -t build

prep_dist_package() {
  local PROJECT="$1"
  echo "Preparing dist package.json for ${PROJECT} ..."
  PROJECT="$PROJECT" REGISTRY_URL="$REGISTRY_URL" node - <<'NODE'
const fs = require('fs');
const path = require('path');

const project = process.env.PROJECT;
const root = process.cwd();
const srcPkgPath = path.join(root, 'packages', project, 'package.json');
const distDir = path.join(root, 'packages', project, 'dist');
const distPkgPath = path.join(distDir, 'package.json');

if (!fs.existsSync(distDir)) {
  console.error(`Error: dist directory not found for ${project}: ${distDir}`);
  process.exit(1);
}

const srcPkg = JSON.parse(fs.readFileSync(srcPkgPath, 'utf8'));

// Deep replace helper
const replaceDist = (val) => {
  if (typeof val === 'string') return val.replaceAll('./dist/', './');
  if (Array.isArray(val)) return val.map(replaceDist);
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = replaceDist(v);
    return out;
  }
  return val;
};

const outPkg = replaceDist({ ...srcPkg });

// Ensure files include everything inside dist
outPkg.files = ['**/*'];

// Remove workspace-specific fields if any
delete outPkg.workspaces;

// Bump patch version only in dist package.json
const version = outPkg.version || '0.0.0';
const parts = version.split('.').map((n) => parseInt(n, 10) || 0);
while (parts.length < 3) parts.push(0);
parts[2] += 1;
outPkg.version = `${parts[0]}.${parts[1]}.${parts[2]}`;

fs.writeFileSync(distPkgPath, JSON.stringify(outPkg, null, 2));
console.log(`Wrote ${distPkgPath} with version ${outPkg.version}`);
NODE
}

prep_dist_package core
prep_dist_package angular

echo "Publishing to $REGISTRY_URL ..."
pnpm publish packages/core/dist --registry "$REGISTRY_URL" --access public --no-git-checks
pnpm publish packages/angular/dist --registry "$REGISTRY_URL" --access public --no-git-checks

echo "Done. Published new patch versions to $REGISTRY_URL."


