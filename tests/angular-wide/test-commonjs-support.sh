#!/usr/bin/env sh

set -e

# set global git user if not already set
if [ -z "$(git config --global user.email)" ] && [ -z "$(git config --global user.name)" ]; then
  git config --global user.email "testrobot@testronaut.dev"
  git config --global user.name "Testrobot"
fi

# Bump a major version to avoid collisions with potential existing versions
# as the current PR could be a bit older than the latest release.
nx release major -y

pnpm add -Dw "@testronaut/angular@latest" "@testronaut/core@latest"

pnpm playwright test --config=tests/angular-wide/playwright.config.cts --reporter=list
