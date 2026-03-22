import { workspaceRoot } from '@nx/devkit';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseConfigFile, runServer } from 'verdaccio';
import { afterAll, expect, test } from 'vitest';
import { $, cd } from 'zx';

test('ng add @testronaut/angular (standalone)', async () => {
  const { newTestronautVersion, pnpmAndPlaywrightInstall, prepareWorkspace } =
    await setUp();

  await prepareWorkspace(
    (workspaceName) =>
      $`pnpm create @angular@latest ${workspaceName} --defaults`
  );

  /* For some reason, "ng add" fails to install the package from local registry on CI,
   * even when using `--registry` flag. It keeps using the npm registry instead.
   * Therefore we install the package manually first. */
  await $`pnpm add @testronaut/angular@${newTestronautVersion}`;

  /* Use strict version to avoid any pnpm caching issues when using `latest`. */
  await $`pnpm ng add @testronaut/angular@${newTestronautVersion} \
    --no-interactive \
    --skip-confirmation \
    --with-examples`;
  await pnpmAndPlaywrightInstall();

  const { exitCode, stdout } =
    await $`pnpm playwright test -c playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('2 passed');
});

test('ng add @testronaut/angular (CLI Workspace)', async () => {
  const {
    newTestronautVersion,
    pnpmAndPlaywrightInstall,
    pnpmInstall,
    prepareWorkspace,
  } = await setUp();

  await prepareWorkspace(
    (workspaceName) =>
      $`pnpm create @angular@latest ${workspaceName} --create-application=false --defaults`
  );

  await $`pnpm ng generate application my-app --defaults --skip-install`;
  /* Install manually, otherwise the app generator fails because of pnpm frozen lockfile behavior on CI. */
  await pnpmInstall();

  /* For some reason, "ng add" fails to install the package from local registry on CI,
   * even when using `--registry` flag. It keeps using the npm registry instead.
   * Therefore we install the package manually first. */
  await $`pnpm add @testronaut/angular@${newTestronautVersion}`;

  /* Use strict version to avoid any pnpm caching issues when using `latest`. */
  await $`pnpm ng add @testronaut/angular@${newTestronautVersion} \
    --no-interactive \
    --skip-confirmation \
    --project my-app \
    --with-examples`;
  await pnpmAndPlaywrightInstall();

  const { exitCode, stdout } =
    await $`pnpm playwright test -c projects/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('2 passed');
});

test('nx add @testronaut/angular', async () => {
  const { newTestronautVersion, pnpmAndPlaywrightInstall, prepareWorkspace } =
    await setUp();

  const { workspacePath } = await prepareWorkspace(async (workspaceName) => {
    await $`pnpm create nx-workspace@latest ${workspaceName} \
      --preset angular-monorepo \
      --ai-agents cursor \
      --app-name my-app \
      --bundler esbuild \
      --ci skip \
      --e2e-test-runner none \
      --no-ssr \
      --style css \
      --unit-test-runner none`;
  });

  /* Use strict version to avoid any pnpm caching issues when using `latest`.
   * By default, we do not install any examples, and we can't forward the --with-examples flag to nx add. */
  await $`pnpm nx add @testronaut/angular@${newTestronautVersion}`;
  await pnpmAndPlaywrightInstall();

  /* Let's just copy some examples manually. */
  mkdirSync(join(workspacePath, 'apps/my-app/src/components'));
  for (const fileName of ['1-basic.pw.ts', 'components/1-click-me.ts']) {
    copyFileSync(
      join(
        workspaceRoot,
        `packages/angular/src/schematics/init/files/source-root/testronaut-examples/${fileName}`
      ),
      join(workspacePath, 'apps/my-app/src', fileName)
    );
  }

  const { exitCode, stdout } =
    await $`pnpm playwright test -c apps/my-app/playwright-testronaut.config.mts`;
  expect.soft(exitCode).toBe(0);
  expect.soft(stdout).toContain('2 passed');
});

async function setUp() {
  /* Use a different port for each test because the port can stay stuck in TIME_WAIT state
   * when we stop the Verdaccio server. */
  const registryPort = 4872;
  const registryUrl = `http://localhost:${registryPort}`;

  /* Set this to true for debugging.*/
  $.verbose = false;

  $.env = {
    ...$.env,
    NPM_CONFIG_REGISTRY: registryUrl,
  };

  cd(workspaceRoot);

  await _maybeStartVedaccioAndPublishPackages({ registryPort, registryUrl });

  const pnpmInstall = () => $`pnpm install --no-frozen-lockfile`;

  return {
    newTestronautVersion: _resolveNewTestronautVersion(),
    pnpmAndPlaywrightInstall: async () => {
      await pnpmInstall();
      await $`pnpm exec playwright install --with-deps --only-shell`;
    },
    pnpmInstall,
    prepareWorkspace: async (
      createWorkspaceFn: (workspaceName: string) => Promise<unknown>
    ) => {
      /* Create and dive into a temporary workspace directory. */
      const tmpDir = await mkdtemp(join(tmpdir(), 'testronaut-angular-wide-'));

      cd(tmpDir);

      const workspaceName = 'my-workspace';
      const workspacePath = join(tmpDir, workspaceName);

      await createWorkspaceFn(workspaceName);

      cd(workspaceName);

      return { workspacePath };
    },
  };
}

let verdaccio: Server;
afterAll(() => verdaccio?.close());

async function _maybeStartVedaccioAndPublishPackages({
  registryPort,
  registryUrl,
}: {
  registryPort: number;
  registryUrl: string;
}) {
  /* Server is already started, so we can skip starting it again. */
  if (verdaccio) {
    return;
  }

  /* Clean up Verdaccio local registry before starting Verdaccio
   * to avoid pollution from previously published packages. */
  await $`rm -rf ${join(workspaceRoot, 'tmp/local-registry')}`;

  const server = await _startVerdaccio({ registryPort });

  /* Publish packages to verdaccio. */
  await _publishPackages({ registryUrl });

  verdaccio = server;
}

async function _startVerdaccio({
  registryPort,
}: {
  registryPort: number;
}): Promise<Server> {
  const configPath = join(workspaceRoot, '.verdaccio/config.yml');
  const config = parseConfigFile(configPath);
  /* Verdaccio API expects config.logs for logger setup, but YAML uses config.log.
   * See: verdaccio/build/api/index.js passes configHash.logs to logger.setup() */
  const configWithLogs = {
    ...config,
    self_path: configPath,
    logs: config.log,
  };

  const verdaccio: Server = await runServer(configWithLogs);

  verdaccio.listen(registryPort);

  return verdaccio;
}

async function _publishPackages({ registryUrl }: { registryUrl: string }) {
  const npmrcPath = join(workspaceRoot, '.npmrc');

  try {
    await $`pnpm nx release version --git-commit=false patch`;

    writeFileSync(
      npmrcPath,
      `${registryUrl.replace('http:', '')}/:_authToken=fake-token`
    );

    await $`pnpm nx release publish`;
  } finally {
    /* Revert CHANGELOG.md to reduce risk of committing it. */
    await $`git checkout HEAD CHANGELOG.md packages/*/package.json`;

    unlinkSync(npmrcPath);
  }
}

function _resolveNewTestronautVersion() {
  const corePkgJson = JSON.parse(
    readFileSync(join(workspaceRoot, 'packages/core/package.json'), 'utf8')
  );
  const [major, minor, patch] = corePkgJson.version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}
