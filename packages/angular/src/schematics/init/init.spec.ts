import { applicationGenerator, E2eTestRunner } from '@nx/angular/generators';
import {
  addProjectConfiguration,
  logger,
  ProjectConfiguration,
  readProjectConfiguration as readProjectConfigurationNx,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { EOL } from 'os';
import { ArchitectConfiguration, ngAddGenerator, throwIfNullish } from './init';
import { angularJsonTemplate as angularJsonTemplateStandalone } from './init-angular';
import { angularJsonTemplate as angularJsonTemplateStandaloneWorkspace } from './init-angular-workspace';

// function used for debugging purposes
function _printTree(tree: Tree, folder = '', indent = 0) {
  for (const child of tree.children(folder)) {
    const childName = `${folder}/${child}`;
    console.log(' '.repeat(indent) + child);
    _printTree(tree, childName, indent + 2);
  }
}

/**
 * Basic Functions
 */

const createProject = async (tree: Tree, name: string) => {
  await applicationGenerator(tree, {
    directory: `apps/${name}`,
    name,
    e2eTestRunner: E2eTestRunner.None,
  });
};

async function setupForNx(projectName: string) {
  const tree = createTreeWithEmptyWorkspace();
  await createProject(tree, projectName);

  return tree;
}

async function setupForAngularCli(projectName: string, workspace: boolean) {
  const tree = createTreeWithEmptyWorkspace();
  // we are creating a partial config which contains the relevant part for testronaut
  const angularJson = structuredClone(
    workspace
      ? angularJsonTemplateStandaloneWorkspace
      : angularJsonTemplateStandalone
  ) as {
    projects: Record<string, unknown>;
  };
  angularJson.projects[projectName] = angularJson.projects['eternal'];
  const config = angularJson.projects[projectName] as {
    root: string;
    sourceRoot: string;
  };
  config.root = config.root.replace('test', projectName);
  config.sourceRoot = config.sourceRoot.replace('test', projectName);
  angularJson.projects[projectName] = config;
  delete angularJson.projects['eternal'];

  tree.write('angular.json', JSON.stringify(angularJson, null, 2));

  return tree;
}

/**
 * Parameters for Tests
 */

type TestParameters = {
  name: string;
  isAngularCli: boolean;
  isWorkspace: boolean;
  setup: (projectName: string, workspace: boolean) => Promise<Tree>;
  readProjectConfiguration: (
    tree: Tree,
    projectName: string
  ) => ProjectConfiguration;
  getTargets: (config: ProjectConfiguration) => ArchitectConfiguration;
  addProject: (tree: Tree, projectName: string, isWorkspace: boolean) => void;
  updateProject: (
    tree: Tree,
    projectName: string,
    config: ProjectConfiguration
  ) => void;
};

const parametersForAngularCliStandalone: TestParameters = {
  name: 'Angular CLI Standalone',
  isAngularCli: true,
  isWorkspace: false,
  setup: setupForAngularCli,
  readProjectConfiguration: (tree: Tree, projectName: string) => {
    const config = tree.read('angular.json', 'utf8') as string;
    const parseConfig = JSON.parse(config) as {
      projects: Record<string, ProjectConfiguration>;
    };
    return parseConfig.projects[projectName];
  },
  getTargets(config: ProjectConfiguration) {
    return (config as unknown as { architect: ArchitectConfiguration })
      .architect;
  },
  addProject(tree: Tree, projectName: string, isWorkspace: boolean) {
    const originalConfig = JSON.parse(
      tree.read('angular.json', 'utf8') as string
    );

    const angularJsonTemplate = isWorkspace
      ? angularJsonTemplateStandaloneWorkspace
      : angularJsonTemplateStandalone;
    const newProject = structuredClone(angularJsonTemplate.projects['eternal']);
    tree.write(
      'angular.json',
      JSON.stringify(
        {
          ...originalConfig,
          projects: {
            ...originalConfig.projects,
            [projectName]: newProject,
          },
        },
        null,
        2
      )
    );
  },
  updateProject(tree: Tree, projectName: string, config: ProjectConfiguration) {
    const originalConfig = JSON.parse(
      tree.read('angular.json', 'utf8') as string
    );
    const modifiedConfig = {
      ...originalConfig,
      projects: {
        ...originalConfig.projects,
        [projectName]: config,
      },
    };
    tree.write('angular.json', JSON.stringify(modifiedConfig, null, 2));
  },
};

const parametersForAngularCliWorkspace: TestParameters = {
  ...parametersForAngularCliStandalone,
  name: 'Angular CLI Workspace',
  isWorkspace: true,
};

const parametersForNx: TestParameters = {
  name: 'Nx',
  isAngularCli: false,
  isWorkspace: true,
  setup: setupForNx,
  readProjectConfiguration: (tree: Tree, projectName: string) =>
    readProjectConfigurationNx(tree, projectName),
  getTargets: (config: ProjectConfiguration) => config.targets,
  addProject(tree: Tree, projectName: string, _isWorkspace: boolean) {
    addProjectConfiguration(tree, projectName, {
      projectType: 'application',
      root: `apps/${projectName}`,
    });
  },
  updateProject(tree: Tree, projectName: string, config: ProjectConfiguration) {
    updateProjectConfiguration(tree, projectName, config);
  },
};

describe('ng-add generator', () => {
  const errorLogger = vitest.spyOn(logger, 'error');
  const infoLogger = vitest.spyOn(logger, 'info');

  beforeEach(() => {
    errorLogger.mockClear();
    infoLogger.mockClear();
  });

  for (const {
    name,
    isAngularCli,
    isWorkspace,
    setup,
    readProjectConfiguration,
    getTargets,
    addProject,
    updateProject,
  } of [
    parametersForAngularCliStandalone,
    parametersForAngularCliWorkspace,
    parametersForNx,
  ]) {
    describe(name, () => {
      it('should add the testronaut config to the build and ', async () => {
        const tree = await setup('test', isWorkspace);
        await ngAddGenerator(tree, { project: 'test' });
        const config = readProjectConfiguration(tree, 'test');
        const targets = getTargets(config);

        expect(
          targets?.['build']?.configurations?.['testronaut']
        ).toMatchObject({
          optimization: false,
          extractLicenses: false,
          sourceMap: true,
          browser: 'testronaut/main.ts',
          index: 'testronaut/index.html',
          tsConfig: 'testronaut/tsconfig.json',
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
        ngAddGenerator(tree, { project: 'test' });
        expect(errorLogger).toHaveBeenCalledWith(
          'Testronaut failed to activate: No projects found in workspace'
        );
      });

      it('should log an error if the project is not found', async () => {
        const tree = await setup('test', isWorkspace);

        addProject(tree, 'bar', isWorkspace);

        ngAddGenerator(tree, { project: 'foo' });
        expect(errorLogger).toHaveBeenCalledWith(
          "Testronaut failed to activate: Project 'foo' not found. Available projects: 'test', 'bar'"
        );
      });

      it('should not modify the configuration if testronaut is already present in build', async () => {
        const tree = await setup('test', isWorkspace);
        const config = readProjectConfiguration(tree, 'test');
        const targets = getTargets(config);
        assert(targets?.['build']?.configurations);
        targets['build'].configurations['testronaut'] = {
          foo: 'bar',
        };
        updateProject(tree, 'test', config);

        ngAddGenerator(tree, { project: 'test' });
        const updatedConfig = readProjectConfiguration(tree, 'test');
        const updatedTargets = getTargets(updatedConfig);
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
        const tree = await setup('test', isWorkspace);
        const config = readProjectConfiguration(tree, 'test');
        const targets = getTargets(config);
        assert(targets?.['serve']?.configurations);
        targets['serve'].configurations['testronaut'] = {
          foo: 'bar',
        };
        updateProject(tree, 'test', config);

        ngAddGenerator(tree, { project: 'test' });
        const newConfig = readProjectConfiguration(tree, 'test');
        const updatedTargets = getTargets(newConfig);

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
        const tree = await setup('memory', isWorkspace);
        await addProject(tree, 'test1', isWorkspace);
        await addProject(tree, 'test2', isWorkspace);
        await addProject(tree, 'test3', isWorkspace);

        ngAddGenerator(tree, { project: '' });

        const config = readProjectConfiguration(tree, 'memory');
        const targets = getTargets(config);
        expect(
          targets?.['build']?.configurations?.['testronaut']
        ).toMatchObject({
          optimization: false,
          extractLicenses: false,
          sourceMap: true,
          browser: 'testronaut/main.ts',
          index: 'testronaut/index.html',
          tsConfig: 'testronaut/tsconfig.json',
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
        const tree = await setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test' });

        const folder = isAngularCli
          ? isWorkspace
            ? 'projects/test'
            : ''
          : 'apps/test';

        [
          'main.ts',
          'index.html',
          'tsconfig.json',
          '.gitignore',
          'generated/index.ts',
        ].forEach((file) => {
          expect(
            tree.exists(`${folder}/testronaut/${file}`),
            `File ${file} should exist in ${folder}`
          ).toBe(true);
        });

        expect(tree.exists(`${folder}/playwright-testronaut.config.mts`)).toBe(
          true
        );
      });

      it('should not add the examples by default', async () => {
        const tree = await setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test' });

        const folder = `${
          isAngularCli ? (isWorkspace ? 'projects/test' : '') : 'apps/test'
        }/src/testronaut-examples`;

        expect(tree.exists(folder)).toBe(false);
      });

      it('shoud add examples when requested', async () => {
        const tree = await setup('test', isWorkspace);
        ngAddGenerator(tree, { project: 'test', createExamples: true });

        const folder = `${
          isAngularCli ? (isWorkspace ? 'projects/test/' : '') : 'apps/test/'
        }src/testronaut-examples`;
        expect(tree.exists(folder)).toBe(true);
        expect(infoLogger).toHaveBeenCalledWith(
          `Testronaut successfully activated for project test.${EOL}Study the examples in ${folder}.${EOL}Lift off!`
        );
      });

      it("should start the test server by using the project's name", async () => {
        const tree = await setup('maps', isWorkspace);
        ngAddGenerator(tree, { project: 'maps', createExamples: true });

        const configPath = `${
          isAngularCli ? (isWorkspace ? 'projects/maps' : '') : 'apps/maps'
        }/playwright-testronaut.config.mts`;

        const config = tree.read(configPath, 'utf8') || '';

        expect(config).toMatchSnapshot(
          `playwright-testronaut.config.mts for ${name}`
        );
      });

      for (const lockFile of [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
      ]) {
        it(`should use the pre-configured package manager for the test server via the lock file: ${lockFile}`, async () => {
          const tree = await setup('test', isWorkspace);
          tree.write(lockFile, '');
          ngAddGenerator(tree, { project: 'test' });

          const configPath = `${
            isAngularCli ? (isWorkspace ? 'projects/test' : '') : 'apps/test'
          }/playwright-testronaut.config.mts`;
          const config = tree.read(configPath, 'utf8') || '';

          expect(config).toMatchSnapshot(
            `playwright-testronaut.config.mts for ${name} with ${lockFile}`
          );
        });
      }

      it('should use the main property instead of browser property if it exists', async () => {
        const tree = await setup('test', isWorkspace);
        const config = readProjectConfiguration(tree, 'test');
        const targets = getTargets(config);

        const developmentConfig = throwIfNullish(
          targets?.['build']?.configurations?.['development']
        );
        developmentConfig.main = 'main.ts';
        delete developmentConfig.browser;

        updateProject(tree, 'test', config);

        ngAddGenerator(tree, { project: 'test' });
        const updatedTargets = getTargets(
          readProjectConfiguration(tree, 'test')
        );
        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']?.main
        ).toBe('testronaut/main.ts');
        expect(
          updatedTargets?.['build']?.configurations?.['testronaut']?.browser
        ).toBeUndefined();
      });
    });
  }
});
