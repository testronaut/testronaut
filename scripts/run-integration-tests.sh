#!/usr/bin/env bash
set -euo pipefail

# Main script for running integration tests
# This script runs both Angular CLI and Nx workspace/standalone integration tests
#
# Usage:
#   ./scripts/run-integration-tests.sh                    # Run both tests
#   ./scripts/run-integration-tests.sh cli-standalone     # Run only Angular CLI test
#   ./scripts/run-integration-tests.sh cli-standalone nx-workspace  # Run multiple tests


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

# Cleanup any previous runs at the beginning
echo "Cleaning up any previous integration test projects..."
if [ -L ".integration-tests" ]; then
  OLD_TMP_DIR=$(readlink .integration-tests)
  rm ".integration-tests"
  if [ -d "$OLD_TMP_DIR" ]; then
    rm -rf "$OLD_TMP_DIR"
  fi
fi
echo "Previous test projects cleaned up"

# Create temporary directory and symlink
export TMP_DIR=$(mktemp -d)
ln -sf "$TMP_DIR" .integration-tests
echo "Temporary directory created at $TMP_DIR"
echo "Note: Directory will remain on error for inspection"

INTEGRATION_TESTS_DIR=$TMP_DIR

# Parse command line arguments
RUN_CLI_STANDALONE=false
RUN_CLI_WORKSPACE=false
RUN_NX_WORKSPACE=false

# If no arguments provided, run both tests
if [ $# -eq 0 ]; then
  RUN_CLI_STANDALONE=true
  RUN_CLI_WORKSPACE=true
  RUN_NX_WORKSPACE=true
else
  # Parse positional arguments
  for arg in "$@"; do
    case $arg in
      cli-standalone)
        RUN_CLI_STANDALONE=true
        ;;
      cli-workspace)
        RUN_CLI_WORKSPACE=true
        ;;
      nx-workspace)
        RUN_NX_WORKSPACE=true
        ;;
    esac
  done
fi

cd "$ROOT_DIR"

echo "Building packages..."
pnpm nx run-many -t build --projects=core,angular --no-tui
echo "Packages built successfully"

echo "Creating integration tests directory..."
mkdir -p "$INTEGRATION_TESTS_DIR"

if [ "$RUN_CLI_STANDALONE" = "true" ]; then
  echo "Starting Angular CLI integration test..."
  cd "$INTEGRATION_TESTS_DIR"
  pnpm create @angular@latest cli-standalone --defaults

  cd "cli-standalone"
  pnpm add file:"$ROOT_DIR/packages/core" file:"$ROOT_DIR/packages/angular"
  pnpm add -D @playwright/test
  pnpm ng add @testronaut/angular --create-examples
  pnpm playwright test -c playwright-testronaut.config.mts
  echo "All Angular CLI integration tests passed!"
fi

if [ "$RUN_CLI_WORKSPACE" = "true" ]; then
  echo "Starting Angular workspace integration test..."
  cd "$INTEGRATION_TESTS_DIR"
  pnpm create @angular@latest cli-workspace --create-application=false --defaults

  cd "cli-workspace"
  pnpm ng g app test --defaults
  pnpm add file:"$ROOT_DIR/packages/core" file:"$ROOT_DIR/packages/angular"
  pnpm add -D @playwright/test
  pnpm ng add @testronaut/angular --create-examples
  pnpm playwright test -c projects/test/playwright-testronaut.config.mts
  echo "All Angular CLI workspace integration tests passed!"
fi

if [ "$RUN_NX_WORKSPACE" = "true" ]; then
  echo "Starting Nx workspace integration test..."

  cd "$INTEGRATION_TESTS_DIR"
  pnpm create nx-workspace@latest nx-workspace --preset angular-monorepo --app-name test --e2e-test-runner none --unit-test-runner none --no-ssr --bundler esbuild --style css --ai-agents cursor --ci skip
  cd "nx-workspace"
  pnpm add file:"$ROOT_DIR/packages/core" file:"$ROOT_DIR/packages/angular"
  pnpm add -D @playwright/test
  pnpm nx g @testronaut/angular:init --create-examples
  pnpm playwright test -c apps/test/playwright-testronaut.config.mts

  echo "All Nx workspace integration tests passed!"
fi

echo "All integration tests completed!"