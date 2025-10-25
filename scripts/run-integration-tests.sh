#!/usr/bin/env bash
set -euo pipefail

# Unified script for testing Angular CLI integration
# This script can be run both locally and in GitHub Actions
# It tests the full Angular CLI workflow: create project + ng add @testronaut/angular

CLI_STANDALONE_PROJECT_NAME="cli-standalone"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
INTEGRATION_TESTS_DIR="$ROOT_DIR/integration-tests"
TEST_PROJECT_DIR="$INTEGRATION_TESTS_DIR/$CLI_STANDALONE_PROJECT_NAME"

echo "Cleaning up integration test project..."
if [ -d "$INTEGRATION_TESTS_DIR" ]; then
  rm -rf "$INTEGRATION_TESTS_DIR"
fi


cd "$ROOT_DIR"

echo "Starting Angular CLI integration test..."

# Step 1: Build packages
echo "Building packages..."
if ! pnpm nx run-many -t build --projects=core,angular --no-tui; then
    echo "ERROR: Failed to build packages"
    exit 1
fi
echo "Packages built successfully"

# Step 2: Create integration tests directory
echo "Creating integration tests directory..."
mkdir -p "$INTEGRATION_TESTS_DIR"
cd "$INTEGRATION_TESTS_DIR"

# Step 3: Create fresh Angular project
echo "Creating fresh Angular project with pnpm create @angular@latest..."
if ! pnpm create @angular@latest $CLI_STANDALONE_PROJECT_NAME --defaults; then
    echo "ERROR: Failed to create Angular project"
    exit 1
fi
echo "Angular project created successfully"

cd "$TEST_PROJECT_DIR"

# Step 4: Install local packages as proper npm packages
echo "Installing local @testronaut packages..."
if ! pnpm add file:"$ROOT_DIR/packages/core" file:"$ROOT_DIR/packages/angular"; then
    echo "ERROR: Failed to install local packages"
    exit 1
fi
echo "Local packages installed"

# Step 5: Test ng add command
echo "Running ng add @testronaut/angular..."
pnpm ng add @testronaut/angular --create-examples
echo "ng add command completed successfully"

# Step 6: Test testronaut build
echo "Testing testronaut build configuration..."
if ! pnpm playwright test -c playwright-testronaut.config.mts ; then
    echo "ERROR: testronaut build configuration failed"
    exit 1
fi
echo "testronaut build successful"

echo "All Angular CLI integration tests passed!"