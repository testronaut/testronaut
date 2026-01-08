import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';
import { $, within } from 'zx';
import { workspaceRoot } from '@nx/devkit';

test('ng add @testronaut/angular (standalone)', async () =>
  within(async () => {
    const { tmpDir } = await setUp();

    $.cwd = tmpDir;
    await $`pnpm create @angular@latest my-app --defaults`;

    $.cwd = join(tmpDir, 'my-app');

    await $`pnpm add file:"${workspaceRoot}/packages/core" file:"${workspaceRoot}/packages/angular"`;
    await $`pnpm add -D @playwright/test`;
    await $`pnpm ng add @testronaut/angular --with-examples`;
    const { exitCode, stdout } =
      await $`pnpm playwright test -c playwright-testronaut.config.mts`;
    expect.soft(exitCode).toBe(0);
    expect.soft(stdout).toContain('3 passed');
  }));

async function setUp() {
  return {
    tmpDir: await mkdtemp(join(tmpdir(), 'testronaut-angular-wide-')),
  };
}

// TODO: CLI Workspace:
// pnpm create @angular@latest cli-workspace --create-application=false --defaults
// pnpm ng g app my-app --defaults
// pnpm playwright test -c projects/my-app/playwright-testronaut.config.mts

// TODO: Nx:
// pnpm create nx-workspace@latest nx-workspace --preset angular-monorepo --app-name my-app --e2e-test-runner none --unit-test-runner none --no-ssr --bundler esbuild --style css --ai-agents cursor --ci skip
// pnpm playwright test -c apps/my-app/playwright-testronaut.config.mts
