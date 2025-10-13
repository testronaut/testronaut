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
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { EOL } from 'os';

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  try {
    const projectName = getProjectName(tree, options.project);

    const config = readProjectConfiguration(tree, projectName);

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
    generateFiles(
      tree,
      path.join(__dirname, 'files', 'testronaut'),
      path.join(config.root, 'testronaut'),
      {}
    );

    const examplesDir = path.join(config.root, 'src', 'testronaut-examples');

    if (options.createExamples) {
      generateFiles(
        tree,
        path.join(__dirname, 'files', 'testronaut-examples'),
        examplesDir,
        {}
      );
    }

    // see https://github.com/npm/npm/issues/3763
    tree.write(
      path.join(config.root, 'testronaut', '.gitignore'),
      'generated' + EOL
    );

    logger.info(
      getSuccessMessage(
        options.project,
        Boolean(options.createExamples),
        examplesDir
      )
    );
  } catch (error) {
    logger.error(
      `Testronaut failed to activate: ${
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

function getSuccessMessage(
  projectName: string,
  withExamples: boolean,
  examplesDir: string
) {
  let message = '';

  if (projectName) {
    message += `Testronaut successfully activated for project ${projectName}.`;
  } else {
    message += 'Testronaut successfully activated.';
  }

  if (withExamples) {
    message += `${EOL}Study the examples in ${examplesDir}.${EOL}Lift off!`;
  } else {
    message += ' Lift off!';
  }

  return message;
}

export default convertNxGenerator(ngAddGenerator);
