import { workspaceRoot } from '@nx/devkit';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { onTestFinished, test } from 'vitest';
import { $, cd } from 'zx';

test('ng add @testronaut/angular (standalone)', async () => {
  await setUp();

  await $`pnpm create @angular@latest my-app --defaults`;

  cd('./my-app');

  await $`pnpm ng add @testronaut/angular --with-examples`;
  await $`pnpm install`;

  const { exitCode, stdout } =
    await $`pnpm playwright test -c playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

test('ng add @testronaut/angular (CLI Workspace)', async () => {
  await setUp();

  await $`pnpm create @angular@latest my-workspace --create-application=false --defaults`;

  cd('./my-workspace');

  await $`pnpm ng generate application my-app --defaults`;
  await $`pnpm ng add @testronaut/angular --with-examples --project my-app`;
  await $`pnpm install`;

  const { exitCode, stdout } =
    await $`pnpm playwright test -c projects/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

test.only('nx add @testronaut/angular', async () => {
  await setUp();

  await $`pnpm create nx-workspace@latest my-nx-workspace --preset angular-monorepo --app-name my-app --e2e-test-runner none --unit-test-runner none --no-ssr --bundler esbuild --style css --ai-agents cursor --ci skip`;

  cd('./my-nx-workspace');

  await $`pnpm nx add @testronaut/angular --with-examples`;

  const { exitCode, stdout } =
    await $`pnpm playwright test -c apps/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

async function setUp() {
  const verdaccioPort = 4873;
  const registryUrl = `http://localhost:${verdaccioPort}`;

  /* Start verdaccio server.
   * We are using the CLI instead of `runServer` because for some reason,
   * we didn't manage to silence the Verdaccio logs even when setting the log level to `silent`. */
  const verdaccioProcess = spawn(
    'pnpm',
    [
      'verdaccio',
      '--config',
      './.verdaccio/config.yml',
      '--listen',
      verdaccioPort.toString(),
    ],
    {
      stdio: 'pipe',
      cwd: workspaceRoot,
    }
  );
  onTestFinished(() => {
    verdaccioProcess.kill();
  });

  $.env = { ...process.env, NPM_CONFIG_REGISTRY: registryUrl };

  cd(workspaceRoot);

  /* Publish packages to verdaccio. */
  await $`pnpm nx release publish`;

  /* Create and dive into a temporary workspace directory. */
  const tmpWorkspaceDir = await mkdtemp(
    join(tmpdir(), 'testronaut-angular-wide-')
  );
  cd(tmpWorkspaceDir);
}
