import { applicationGenerator, E2eTestRunner } from '@nx/angular/generators';
import {
  addProjectConfiguration,
  logger,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { ngAddGenerator } from './init';
import * as path from 'path';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

describe('ng-add generator', () => {
  const errorLogger = vitest.spyOn(logger, 'error');
  const infoLogger = vitest.spyOn(logger, 'info');

  beforeEach(() => {
    errorLogger.mockClear();
    infoLogger.mockClear();
  });

  const createProject = async (tree: Tree, name: string) => {
    await applicationGenerator(tree, {
      directory: `apps/${name}`,
      name,
      e2eTestRunner: E2eTestRunner.None,
    });
  };

  const setup = async (projectName = 'test') => {
    const tree = createTreeWithEmptyWorkspace();
    await createProject(tree, projectName);

    return tree;
  };

  it('should add the testronaut config to the build and ', async () => {
    const tree = await setup();
    await ngAddGenerator(tree, { project: 'test' });
    const config = readProjectConfiguration(tree, 'test');

    expect(config.targets?.['build']?.configurations?.['testronaut']).toEqual({
      optimization: false,
      extractLicenses: false,
      sourceMap: true,
      browser: 'testronaut/main.ts',
      index: 'testronaut/index.html',
      tsConfig: 'testronaut/tsconfig.json',
    });

    expect(config.targets?.['serve']?.configurations?.['testronaut']).toEqual({
      buildTarget: 'test:build:testronaut',
      prebundle: {
        exclude: ['@testronaut/angular'],
      },
    });

    expect(errorLogger).toHaveBeenCalledTimes(0);
    expect(infoLogger).toHaveBeenCalledTimes(1);
  });

  it('should log an error if there are no projects', async () => {
    const tree = createTreeWithEmptyWorkspace();
    ngAddGenerator(tree, { project: 'test' });
    expect(errorLogger).toHaveBeenCalledWith(
      'Testronaut failed to add: No projects found in workspace'
    );
  });

  it('should log an error if the project is not found', async () => {
    const tree = await setup();

    addProjectConfiguration(tree, 'bar', {
      projectType: 'application',
      root: 'apps/bar',
    });

    ngAddGenerator(tree, { project: 'foo' });
    expect(errorLogger).toHaveBeenCalledWith(
      "Testronaut failed to add: Project 'foo' not found. Available projects: 'test', 'bar'"
    );
  });

  it('should not modify the configuration if testronaut is already present in build', async () => {
    const tree = await setup();
    const config = readProjectConfiguration(tree, 'test');
    assert(config.targets?.['build']?.configurations);
    config.targets['build'].configurations['testronaut'] = {
      foo: 'bar',
    };
    updateProjectConfiguration(tree, 'test', config);

    ngAddGenerator(tree, { project: 'test' });
    const newConfig = readProjectConfiguration(tree, 'test');
    expect(
      newConfig.targets?.['build']?.configurations?.['testronaut']
    ).toEqual({
      foo: 'bar',
    });

    expect(
      newConfig.targets?.['serve']?.configurations?.['testronaut']
    ).toBeUndefined();

    expect(errorLogger).toHaveBeenCalledTimes(0);
    expect(infoLogger).toHaveBeenCalledWith(
      'Testronaut configuration already exists in build. Skipping configuration'
    );
  });

  it('should not modify the configuration if testronaut is already present in serve', async () => {
    const tree = await setup();
    const config = readProjectConfiguration(tree, 'test');
    assert(config.targets?.['serve']?.configurations);
    config.targets['serve'].configurations['testronaut'] = {
      foo: 'bar',
    };
    updateProjectConfiguration(tree, 'test', config);

    ngAddGenerator(tree, { project: 'test' });
    const newConfig = readProjectConfiguration(tree, 'test');

    expect(
      newConfig.targets?.['build']?.configurations?.['testronaut']
    ).toBeUndefined();
    expect(
      newConfig.targets?.['serve']?.configurations?.['testronaut']
    ).toEqual({
      foo: 'bar',
    });

    expect(errorLogger).toHaveBeenCalledTimes(0);
    expect(infoLogger).toHaveBeenCalledWith(
      'Testronaut configuration already exists in serve. Skipping configuration'
    );
  });

  it('picks the first project if no project is provided', async () => {
    const tree = await setup('memory');
    await createProject(tree, 'test1');
    await createProject(tree, 'test2');
    await createProject(tree, 'test3');

    ngAddGenerator(tree, { project: '' });

    const config = readProjectConfiguration(tree, 'memory');
    expect(config.targets?.['build']?.configurations?.['testronaut']).toEqual({
      optimization: false,
      extractLicenses: false,
      sourceMap: true,
      browser: 'testronaut/main.ts',
      index: 'testronaut/index.html',
      tsConfig: 'testronaut/tsconfig.json',
    });

    expect(config.targets?.['serve']?.configurations?.['testronaut']).toEqual({
      buildTarget: 'memory:build:testronaut',
      prebundle: {
        exclude: ['@testronaut/angular'],
      },
    });

    expect(infoLogger).toHaveBeenCalledWith(
      'Testronaut added to successfully. Lift off!'
    );
    expect(errorLogger).toHaveBeenCalledTimes(0);
  });

  it('should add the testronaut files to the project', async () => {
    const tree = await setup();
    ngAddGenerator(tree, { project: 'test' });
    expect(tree.exists('apps/test/testronaut/main.ts')).toBe(true);
    expect(tree.exists('apps/test/testronaut/index.html')).toBe(true);
    expect(tree.exists('apps/test/testronaut/tsconfig.json')).toBe(true);
  });
});
