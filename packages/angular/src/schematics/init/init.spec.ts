import * as devkit from '@nx/devkit';
import {
  logger,
  Tree
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { EOL } from 'os';
import { throwIfNullish } from '../util/throw-if-nullish';
import {
  ngAddGenerator,
  PLAYWRIGHT_VERSION_RANGE
} from './init';
import { NxTestDevkit } from './test/nx-test-devkit';
import { TestDevKit } from './test/test-devkit';
import { AngularCliTestDevkit } from './test/angular-cli-test-devkit';

// function used for debugging purposes
function _printTree(tree: Tree, folder = '', indent = 0) {
  for (const child of tree.children(folder)) {
    const childName = `${folder}/${child}`;
    console.log(' '.repeat(indent) + child);
    _printTree(tree, childName, indent + 2);
  }
}



function fakeInstalledPlaywright(
  tree: Tree,
  version = PLAYWRIGHT_VERSION_RANGE.upper
) {
  tree.write(
    'node_modules/@playwright/test/package.json',
    JSON.stringify({ version })
  );
}

function getFolder(
  isAngularCli: boolean,
  isWorkspace: boolean,
  projectName: string
) {
  return isAngularCli
    ? isWorkspace
      ? `projects/${projectName}/`
      : ''
    : `apps/${projectName}/`;
}


/**
 * Parameters for Tests
 */
type TestParameters = {
  name: string;
  isAngularCli: boolean;
  isWorkspace: boolean;
  devkit: TestDevKit;
};

const parametersForAngularCliStandalone: TestParameters = {
  name: 'Angular CLI Standalone',
  isAngularCli: true,
  isWorkspace: false,
  devkit: new AngularCliTestDevkit(false),
};

const parametersForAngularCliWorkspace: TestParameters = {
  ...parametersForAngularCliStandalone,
  name: 'Angular CLI Workspace',
  isWorkspace: true,
  devkit: new AngularCliTestDevkit(true),
};

const parametersForNx: TestParameters = {
  name: 'Nx',
  isAngularCli: false,
  isWorkspace: true,
  devkit: new NxTestDevkit(),
};

describe('ng-add generator', () => {
  const errorLogger = vitest.spyOn(logger, 'error');
  const infoLogger = vitest.spyOn(logger, 'info');
  const warnLogger = vitest.spyOn(logger, 'warn');
  const packageInstallTask = vitest.spyOn(devkit, 'installPackagesTask');

  beforeAll(() => {
    packageInstallTask.mockImplementation(() => true);
    errorLogger.mockReturnValue(void true);
    infoLogger.mockReturnValue(void true);
    warnLogger.mockReturnValue(void true);
  });

  beforeEach(() => {
    vitest.clearAllMocks();
  });
  describe.each([
    parametersForAngularCliStandalone,
    parametersForAngularCliWorkspace,
    parametersForNx,
  ])(
    '$name',
    ({
      name,
      isAngularCli,
      isWorkspace,
      devkit,
    }) => {
      it('should add the testronaut config to the build and serve targets', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        await ngAddGenerator(tree, { project: 'test' });
        const config = devkit.readProjectConfiguration(tree, 'test');
        const targets = devkit.getTargets(config);

        const folder = getFolder(isAngularCli, isWorkspace, 'test');

        expect(
          targets?.['build']?.configurations?.['testronaut']
        ).toMatchObject({
          optimization: false,
          extractLicenses: false,
          sourceMap: true,
          browser: `${folder}testronaut/main.ts`,
          index: `${folder}testronaut/index.html`,
          tsConfig: `${folder}testronaut/tsconfig.json`,
        });

        expect(targets?.['serve']?.configurations?.['testronaut']).toEqual({
          buildTarget: 'test:build:testronaut',
          prebundle: false,
        });

        expect(errorLogger).toHaveBeenCalledTimes(0);
        expect(infoLogger).toHaveBeenCalledWith(
          'Testronaut successfully activated for project test. Lift off!'
        );
      });

      it('should log an error if there are no projects', async () => {
        const tree = createTreeWithEmptyWorkspace();
        await ngAddGenerator(tree, { project: 'test' });
        expect(errorLogger).toHaveBeenCalledWith(
          'Testronaut failed to activate: No projects found in workspace'
        );
      });

      it('should log an error if the project is not found', async () => {
        const tree = await devkit.setup('test', isWorkspace);

        devkit.addProject(tree, 'bar', isWorkspace);

        ngAddGenerator(tree, { project: 'foo' });
        expect(errorLogger).toHaveBeenCalledWith(
          "Testronaut failed to activate: Project 'foo' not found. Available projects: 'test', 'bar'"
        );
      });

      it('should not modify the configuration if testronaut is already present in build', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        const config = devkit.readProjectConfiguration(tree, 'test');
      const targets = devkit.getTargets(config);
        assert(targets?.['build']?.configurations);
        targets['build'].configurations['testronaut'] = {
          foo: 'bar',
        };
        devkit.updateProjectConfiguration(tree, 'test', config);

        ngAddGenerator(tree, { project: 'test' });
        const updatedConfig = devkit.readProjectConfiguration(tree, 'test');
        const updatedTargets = devkit.getTargets(updatedConfig);
        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']
        ).toEqual({
          foo: 'bar',
        });

        expect(
          updatedTargets?.['serve']?.configurations?.['testronaut']
        ).toBeUndefined();

        expect(errorLogger).toHaveBeenCalledTimes(0);
        expect(infoLogger).toHaveBeenCalledWith(
          'Testronaut configuration already exists in build. Skipping configuration'
        );
      });

      it('should not modify the configuration if testronaut is already present in serve', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        const config = devkit.readProjectConfiguration(tree, 'test');
        const targets = devkit.getTargets(config);
        assert(targets?.['serve']?.configurations);
        targets['serve'].configurations['testronaut'] = {
          foo: 'bar',
        };
        devkit.updateProjectConfiguration(tree, 'test', config);

        ngAddGenerator(tree, { project: 'test' });
        const newConfig = devkit.readProjectConfiguration(tree, 'test');
        const updatedTargets = devkit.getTargets(newConfig);

        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']
        ).toBeUndefined();
        expect(
          updatedTargets?.['serve']?.configurations?.['testronaut']
        ).toEqual({
          foo: 'bar',
        });

        expect(errorLogger).toHaveBeenCalledTimes(0);
        expect(infoLogger).toHaveBeenCalledWith(
          'Testronaut configuration already exists in serve. Skipping configuration'
        );
      });

      it('picks the first project if no project is provided', async () => {
        const tree = await devkit.setup('memory', isWorkspace);
        await devkit.addProject(tree, 'test1', isWorkspace);
        await devkit.addProject(tree, 'test2', isWorkspace);
        await devkit.addProject(tree, 'test3', isWorkspace);

        await ngAddGenerator(tree, { project: '' });

        const config = devkit.readProjectConfiguration(tree, 'memory');
        const targets = devkit.getTargets(config);
        const folder = getFolder(isAngularCli, isWorkspace, 'memory');
        expect(
          targets?.['build']?.configurations?.['testronaut']
        ).toMatchObject({
          optimization: false,
          extractLicenses: false,
          sourceMap: true,
          browser: `${folder}testronaut/main.ts`,
          index: `${folder}testronaut/index.html`,
          tsConfig: `${folder}testronaut/tsconfig.json`,
        });

        expect(targets?.['serve']?.configurations?.['testronaut']).toEqual({
          buildTarget: 'memory:build:testronaut',
          prebundle: false,
        });

        expect(infoLogger).toHaveBeenCalledWith(
          'Testronaut successfully activated. Lift off!'
        );
        expect(errorLogger).toHaveBeenCalledTimes(0);
      });

      it('should add the testronaut files to the project', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        await ngAddGenerator(tree, { project: 'test' });
        const folder = getFolder(isAngularCli, isWorkspace, 'test');

        [
          'main.ts',
          'index.html',
          'tsconfig.json',
          '.gitignore',
          'generated/index.ts',
        ].forEach((file) => {
          expect(
            tree.exists(`${folder}testronaut/${file}`),
            `File ${file} should exist in ${folder}`
          ).toBe(true);
        });

        expect(tree.exists(`${folder}playwright-testronaut.config.mts`)).toBe(
          true
        );
      });

      it('should not add the examples by default', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test' });
        const folder = `${getFolder(
          isAngularCli,
          isWorkspace,
          'test'
        )}/src/testronaut-examples`;
        expect(tree.exists(folder)).toBe(false);
      });

      it('shoud add examples when requested', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test', withExamples: true });

        const folder = `${getFolder(
          isAngularCli,
          isWorkspace,
          'test'
        )}src/testronaut-examples`;

        expect(tree.exists(folder)).toBe(true);
        expect(infoLogger).toHaveBeenCalledWith(
          `Testronaut successfully activated for project test.${EOL}Study the examples in ${folder}.${EOL}Lift off!`
        );
      });

      it("should start the test server by using the project's name", async () => {
        const tree = await devkit.setup('maps', isWorkspace);
        ngAddGenerator(tree, { project: 'maps', withExamples: true });

        const configPath = `${getFolder(
          isAngularCli,
          isWorkspace,
          'maps'
        )}playwright-testronaut.config.mts`;

        const config = tree.read(configPath, 'utf8') || '';

        expect(config).toMatchSnapshot(
          `playwright-testronaut.config.mts for ${name}`
        );
      });

      it.each(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'])(
        `should use the pre-configured package manager for the test server via the lock file: %s`,
        async (lockFile) => {
          const tree = await devkit.setup('test', isWorkspace);
          tree.write(lockFile, '');
          ngAddGenerator(tree, { project: 'test' });

          const configPath = `${getFolder(
            isAngularCli,
            isWorkspace,
            'test'
          )}playwright-testronaut.config.mts`;
          const config = tree.read(configPath, 'utf8') || '';

          expect(config).toMatchSnapshot(
            `playwright-testronaut.config.mts for ${name} with ${lockFile}`
          );
        }
      );

      it('should use the main property instead of browser property if it exists', async () => {
        const tree = await devkit.setup('test', isWorkspace);
        const config = devkit.readProjectConfiguration(tree, 'test');
        const targets = devkit.getTargets(config);
        const folder = getFolder(isAngularCli, isWorkspace, 'test');

        const options = throwIfNullish<Record<string, string>>(
          targets?.['build']?.options
        );
        options['main'] = 'main.ts';
        delete options['browser'];

        devkit.updateProjectConfiguration(tree, 'test', config);

        await ngAddGenerator(tree, { project: 'test' });
        const updatedTargets = devkit.getTargets(
          devkit.readProjectConfiguration(tree, 'test')
        );
        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']?.main
        ).toBe(`${folder}testronaut/main.ts`);
        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']?.browser
        ).toBeUndefined();
      });

      it(`should have a tsconfig which imports from the project's tsconfig.json`, async () => {
        const tree = await devkit.setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test' });
        const folder = getFolder(isAngularCli, isWorkspace, 'test');
        const tsconfig = JSON.parse(
          tree.read(`${folder}testronaut/tsconfig.json`, 'utf8') || ''
        );

        expect(tsconfig.extends).toBe(
          isWorkspace
            ? `../../../tsconfig${isAngularCli ? '' : '.base'}.json`
            : `../tsconfig${isAngularCli ? '' : '.base'}.json`
        );
      });

      describe('playwright installation', () => {
        it('should install playwright', async () => {
          const tree = await devkit.setup('test', isWorkspace);
          ngAddGenerator(tree, { project: 'test' });

          expect(packageInstallTask).toHaveBeenCalled();
        });

        it('should not install playwright, if it is already available', async () => {
          const tree = await devkit.setup('test', isWorkspace);
          fakeInstalledPlaywright(tree);
          ngAddGenerator(tree, { project: 'test' });
          expect(packageInstallTask).not.toHaveBeenCalled();
        });

        it('should print a warning if the installed playwright version is too low', async () => {
          const tree = await devkit.setup('test', isWorkspace);
          fakeInstalledPlaywright(tree, '1.35');
          ngAddGenerator(tree, { project: 'test' });
          expect(packageInstallTask).not.toHaveBeenCalled();
          expect(warnLogger).toHaveBeenCalledWith(
            `Installed Playwright version (1.35) may not be compatible with Testronaut. Recommended version: ${PLAYWRIGHT_VERSION_RANGE.upper}. Consider changing your Playwright version to avoid issues.`
          );
        });

        it('should print a warning if the installed playwright version is above the supported range', async () => {
          const tree = await devkit.setup('test', isWorkspace);
          fakeInstalledPlaywright(tree, '1.70.0');
          ngAddGenerator(tree, { project: 'test' });
          expect(packageInstallTask).not.toHaveBeenCalled();
          expect(warnLogger).toHaveBeenCalledWith(
            `Installed Playwright version (1.70.0) may not be compatible with Testronaut. Recommended version: ${PLAYWRIGHT_VERSION_RANGE.upper}. Consider changing your Playwright version to avoid issues.`
          );
        });
      });
    }
  );
});
