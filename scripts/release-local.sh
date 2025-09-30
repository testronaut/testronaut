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

prep_dist_package() {
  local PROJECT="$1"
  echo "Preparing dist package.json for ${PROJECT} ..."
  local PKG_DIR="$ROOT_DIR/packages/${PROJECT}"
  local DIST_DIR="$PKG_DIR/dist"
  local SRC_PKG="$PKG_DIR/package.json"
  local DIST_PKG="$DIST_DIR/package.json"

  if [[ ! -d "$DIST_DIR" ]]; then
    echo "Error: dist directory not found for ${PROJECT}: ${DIST_DIR}" >&2
    exit 1
  fi

  cp "$SRC_PKG" "$DIST_PKG"

  # Replace ./dist/ -> ./ across JSON string values
  sed -i '' -E 's#"\./dist/#"\./#g' "$DIST_PKG"

  # Ensure files is ["**/*"]
  awk '
    BEGIN{ in_files=0 }
    /"files"[[:space:]]*:/ { print "  \"files\": [\"**/*\"],"; in_files=1; next }
    in_files {
      if ($0 ~ /]/) { in_files=0; next } else { next }
    }
    { print }
  ' "$DIST_PKG" > "${DIST_PKG}.tmp" && mv "${DIST_PKG}.tmp" "$DIST_PKG"

  # Remove workspaces field if present
  # naive removal of a top-level "workspaces": ... block
  awk '
    BEGIN { skip=0 }
    /"workspaces"[[:space:]]*:/ { skip=1 }
    skip && /],?/ { skip=0; next }
    !skip { print }
  ' "$DIST_PKG" > "${DIST_PKG}.tmp" && mv "${DIST_PKG}.tmp" "$DIST_PKG"

  # Bump patch version
  current=$(sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([0-9]+)\.([0-9]+)\.([0-9]+)".*/\1.\2.\3/p' "$DIST_PKG")
  IFS='.' read -r MA MI PA <<< "$current"
  MA=${MA:-0}; MI=${MI:-0}; PA=${PA:-0}
  new="${MA}.${MI}.$((PA+1))"
  sed -i '' -E "s/(\"version\"[[:space:]]*:[[:space:]]*\")(?:[0-9]+\.[0-9]+\.[0-9]+)(\")/\1${new}\2/" "$DIST_PKG"

  echo "Wrote $DIST_PKG with version $new"
}

prep_dist_package core
prep_dist_package angular

echo "Publishing to $REGISTRY_URL ..."
pnpm publish packages/core/dist --registry "$REGISTRY_URL" --access public --no-git-checks
pnpm publish packages/angular/dist --registry "$REGISTRY_URL" --access public --no-git-checks

echo "Done. Published new patch versions to $REGISTRY_URL."


