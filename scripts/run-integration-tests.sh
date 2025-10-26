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
INTEGRATION_TESTS_DIR="$ROOT_DIR/integration-tests"
# Cleanup function
echo "Cleaning up integration test projects..."
if [ -d "$INTEGRATION_TESTS_DIR" ]; then
  rm -rf "$INTEGRATION_TESTS_DIR"
fi
echo "Integration test projects cleaned up"

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
  pnpm nx g @testronaut/angular:init --create-examples
  pnpm playwright test -c apps/test/playwright-testronaut.config.mts

  echo "All Nx workspace integration tests passed!"
fi

echo "All integration tests completed!"