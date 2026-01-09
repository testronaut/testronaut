import { workspaceRoot } from '@nx/devkit';
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, onTestFinished, test } from 'vitest';
import { $, cd } from 'zx';

test('ng add @testronaut/angular (standalone)', async () => {
  const { pnpmAndPlaywrightInstall } = await setUp();

  await $`pnpm create @angular@latest my-app --defaults`;

  cd('./my-app');

  await $`pnpm ng add @testronaut/angular --no-interactive --with-examples`;
  /* No clue why we need this. Install should be done automatically. */
  await pnpmAndPlaywrightInstall();

  const { exitCode, stdout } =
    await $`pnpm playwright test -c playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

test('ng add @testronaut/angular (CLI Workspace)', async () => {
  const { pnpmAndPlaywrightInstall } = await setUp();

  await $`pnpm create @angular@latest my-workspace --create-application=false --defaults`;

  cd('./my-workspace');

  await $`pnpm ng generate application my-app --defaults --skip-install`;
  /* Install manually, otherwise the app generator fails because of pnpm frozen lockfile behavior on CI. */
  await pnpmAndPlaywrightInstall();

  await $`pnpm ng add @testronaut/angular --no-interactive --project my-app --with-examples`;
  /* No clue why we need this. Install should be done automatically. */
  await pnpmAndPlaywrightInstall();

  const { exitCode, stdout } =
    await $`pnpm playwright test -c projects/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

test('nx add @testronaut/angular', async () => {
  const { tmpDir, pnpmAndPlaywrightInstall } = await setUp();

  await $`pnpm create nx-workspace@latest my-nx-workspace --preset angular-monorepo --app-name my-app --e2e-test-runner none --unit-test-runner none --no-ssr --bundler esbuild --style css --ai-agents cursor --ci skip`;

  cd('./my-nx-workspace');

  /* By default, we do not install any examples, and we can't forward the --with-examples flag to nx add. */
  await $`pnpm nx add @testronaut/angular`;
  /* No clue why we need this. Install should be done automatically. */
  await pnpmAndPlaywrightInstall();

  /* Let's just copy some examples manually. */
  mkdirSync(join(tmpDir, 'my-nx-workspace/apps/my-app/src/components'));
  for (const fileName of ['1-basic.pw.ts', 'components/1-click-me.ts']) {
    copyFileSync(
      join(
        workspaceRoot,
        `packages/angular/src/schematics/init/files/source-root/testronaut-examples/${fileName}`
      ),
      join(tmpDir, 'my-nx-workspace/apps/my-app/src/', fileName)
    );
  }

  const { exitCode, stdout } =
    await $`pnpm playwright test -c apps/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('3 passed');
});

async function setUp() {
  /* Set this to true for debugging.*/
  $.verbose = true;

  const verdaccioPort = 4873;
  const registryUrl = `http://localhost:${verdaccioPort}`;

  /* Clean up Verdaccio local registry before starting Verdaccio
   * to avoid pollution from previously published packages. */
  cd(workspaceRoot);
  await $`rm -rf tmp/local-registry`;

  _startVerdaccio(verdaccioPort);

  $.env = {
    ...process.env,
    NPM_CONFIG_REGISTRY: registryUrl,
  };

  /* Publish packages to verdaccio. */
  await _publishPackages(registryUrl);

  /* Create and dive into a temporary workspace directory. */
  const tmpDir = await mkdtemp(join(tmpdir(), 'testronaut-angular-wide-'));

  cd(tmpDir);

  return {
    pnpmAndPlaywrightInstall: async () => {
      await $`pnpm install --no-frozen-lockfile`;
      await $`pnpm exec playwright install --with-deps --no-shell`;
    },
    tmpDir,
  };
}

function _startVerdaccio(verdaccioPort: number) {
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
    { stdio: 'pipe', cwd: workspaceRoot }
  );
  onTestFinished(async () => {
    verdaccioProcess.kill();
  });
}

async function _publishPackages(registryUrl: string) {
  await $`pnpm nx release version --git-commit=false patch`;

  /* Set up fake auth token for verdaccio in workspace root then publish packages. */
  const npmrcPath = join(workspaceRoot, '.npmrc');
  writeFileSync(
    npmrcPath,
    `${registryUrl.replace('http:', '')}/:_authToken="fake-token"\n`
  );
  await $`pnpm nx release publish`;
  unlinkSync(npmrcPath);
  /* Revert CHANGELOG.md to reduce risk of committing it. */
  await $`git checkout HEAD CHANGELOG.md packages/*/package.json`;
}
