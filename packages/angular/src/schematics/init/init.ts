import {
  convertNxGenerator,
  generateFiles,
  getProjects,
  logger,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { NgAddGeneratorSchema } from './schema';
import * as path from 'path';

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  try {
    const projectName = getProjectName(tree, options.project);

    const config = readProjectConfiguration(tree, 'test');

    if (!(config.targets?.['serve'] && config.targets?.['build'])) {
      throw new Error(
        `Project ${config.name} is missing serve and/or build targets`
      );
    }

    const build = config.targets['build'];
    const serve = config.targets['serve'];

    if (!build.configurations) {
      build.configurations = {};
    }

    if (!serve.configurations) {
      serve.configurations = {};
    }

    if (build.configurations['testronaut']) {
      logger.info(
        'Testronaut configuration already exists in build. Skipping configuration'
      );
      return;
    }
    if (serve.configurations['testronaut']) {
      logger.info(
        'Testronaut configuration already exists in serve. Skipping configuration'
      );
      return;
    }

    build.configurations['testronaut'] = {
      optimization: false,
      extractLicenses: false,
      sourceMap: true,
      browser: 'testronaut/main.ts',
      index: 'testronaut/index.html',
      tsConfig: 'testronaut/tsconfig.json',
    };

    serve.configurations['testronaut'] = {
      buildTarget: `${config.name}:build:testronaut`,
      prebundle: {
        exclude: ['@testronaut/angular'],
      },
    };

    updateProjectConfiguration(tree, projectName, config);
    generateFiles(tree, path.join(__dirname, 'files'), config.root, {});

    logger.info('Testronaut added to successfully. Lift off!');
  } catch (error) {
    logger.error(
      `Testronaut failed to add: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function getProjectName(tree: Tree, providedProjectName: string | undefined) {
  const projects = getProjects(tree);

  if (projects.size === 0) {
    throw new Error('No projects found in workspace');
  }

  const projectNames = Array.from(projects.keys());

  if (providedProjectName) {
    if (projectNames.includes(providedProjectName)) {
      return providedProjectName;
    }
    throw new Error(
      `Project '${providedProjectName}' not found. Available projects: ${projectNames
        .map((name) => `'${name}'`)
        .join(', ')}`
    );
  }

  return projectNames[0];
}

export default convertNxGenerator(ngAddGenerator);
