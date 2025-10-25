import {
  convertNxGenerator,
  generateFiles,
  getProjects,
  logger,
  ProjectConfiguration,
  readJsonFile,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { NgAddGeneratorSchema } from './schema';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { EOL } from 'os';

// Angular CLI specific configurtion
export type ArchitectConfiguration = ProjectConfiguration['targets'];

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  try {
    const isAngularCli = tree.exists('angular.json') ? true : false;

    const { build, serve, projectName, config, projectRoot } = isAngularCli
      ? getElementsForAngularCli(tree, options)
      : getElementsForNx(tree, options);

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

    const testronautConfig = {
      ...(build.configurations['development'] ?? {}),
      index: 'testronaut/index.html',
      tsConfig: 'testronaut/tsconfig.json',
      optimization: false,
      extractLicenses: false,
    };
    testronautConfig[`${'main' in testronautConfig ? 'main' : 'browser'}`] =
      'testronaut/main.ts';

    build.configurations['testronaut'] = testronautConfig;

    serve.configurations['testronaut'] = {
      buildTarget: `${projectName}:build:testronaut`,
      prebundle: false,
    };

    if (isAngularCli) {
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
    } else {
      updateProjectConfiguration(
        tree,
        projectName,
        config as ProjectConfiguration
      );
    }

    generateFiles(
      tree,
      path.join(__dirname, 'files', 'testronaut'),
      path.join(projectRoot, 'testronaut'),
      {}
    );

    const examplesDir = path.join(projectRoot, 'testronaut-examples');

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
      path.join(projectRoot, 'testronaut', '.gitignore'),
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

function getProjectName(
  tree: Tree,
  projects: Record<string, unknown>,
  providedProjectName: string | undefined
) {
  if (Object.keys(projects).length === 0) {
    throw new Error('No projects found in workspace');
  }

  const projectNames = Object.keys(projects);

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

function getElementsForAngularCli(tree: Tree, options: NgAddGeneratorSchema) {
  type ArchitectConfiguration = ProjectConfiguration['targets'];
  const projects: Record<
    string,
    { architect: ArchitectConfiguration; sourceRoot: string }
  > = JSON.parse(tree.read('angular.json', 'utf8') as string)['projects'];

  const projectName = getProjectName(tree, projects, options.project);
  const config = projects[projectName];
  const projectRoot = config.sourceRoot;

  if (!(config.architect?.['serve'] && config.architect?.['build'])) {
    throw new Error(
      `Project ${projectName} is missing serve and/or build targets`
    );
  }

  const build = config.architect['build'];
  const serve = config.architect['serve'];

  return { build, serve, projectName, config, projectRoot };
}

function getElementsForNx(tree: Tree, options: NgAddGeneratorSchema) {
  const projects: Record<string, ProjectConfiguration> = Object.fromEntries(
    getProjects(tree).entries()
  );

  const projectName = getProjectName(tree, projects, options.project);
  const config = projects[projectName];
  const projectRoot = throwIfNullish(config.sourceRoot);

  if (!(config.targets?.['serve'] && config.targets?.['build'])) {
    throw new Error(
      `Project ${config.name} is missing serve and/or build targets`
    );
  }

  const build = config.targets['build'];
  const serve = config.targets['serve'];

  return { build, serve, projectName, config, projectRoot };
}

export default convertNxGenerator(ngAddGenerator);

export function throwIfNullish<T>(
  value: T | undefined,
  message = 'Value is nullish'
): T {
  if (value === undefined || value === null) {
    throw new Error(message, { cause: value });
  }
  return value;
}

export function assertNotNullish<T>(value: T | undefined): asserts value is T {
  throwIfNullish(value);
}
