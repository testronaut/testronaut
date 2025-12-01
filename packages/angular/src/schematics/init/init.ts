import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  generateFiles,
  getPackageManagerCommand,
  getProjects,
  installPackagesTask,
  logger,
  ProjectConfiguration,
  readJson,
  Tree,
  updateProjectConfiguration,
  ProjectsConfigurations,
} from '@nx/devkit';
import { type NgAddGeneratorSchema } from './schema';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { EOL } from 'os';
import * as semver from 'semver';
import * as playwrightVersionJson from './playwright-version.json';

export const PLAYWRIGHT_VERSION_RANGE = playwrightVersionJson as {
  lower: string;
  upper: string;
};
// Angular CLI specific configurtion
export type ArchitectConfiguration = ProjectConfiguration['targets'];

export async function ngAddGenerator(
  tree: Tree,
  options: NgAddGeneratorSchema
) {
  try {
    const isAngularCli = !tree.exists('nx.json');

    const { build, serve, projectName, config, sourceRoot, root } = isAngularCli
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

    const devConfig = (build.configurations['development'] || {}) as Record<
      string,
      unknown
    >;
    const testronautConfig: Record<string, unknown> = {
      ...devConfig,
      index: `${root ? `${root}/` : ''}testronaut/index.html`,
      tsConfig: `${root ? `${root}/` : ''}testronaut/tsconfig.json`,
      optimization: false,
      extractLicenses: false,
    };
    testronautConfig[`${'main' in testronautConfig ? 'main' : 'browser'}`] = `${
      root ? `${root}/` : ''
    }testronaut/main.ts`;

    build.configurations['testronaut'] = testronautConfig;

    serve.configurations['testronaut'] = {
      buildTarget: `${projectName}:build:testronaut`,
      prebundle: false,
    };

    if (isAngularCli) {
      const originalConfig = JSON.parse(
        tree.read('angular.json', 'utf8') as string
      ) as ProjectsConfigurations;
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

    const directoryLevels = (root ? root.split('/').length : 0) + 1;
    generateFiles(
      tree,
      path.join(__dirname, 'files/root'),
      path.join(root, '.'),
      {
        projectName,
        ngCommand: isAngularCli ? 'ng' : 'nx',
        packageManager: getPackageManagerCommand(detectPackageManager(tree))
          .exec,
        tsConfigExtends: `${new Array(directoryLevels)
          .fill('..')
          .join('/')}/tsconfig${isAngularCli ? '' : '.base'}.json`,
      }
    );

    const examplesDir = path.join(sourceRoot, 'testronaut-examples');

    if (options.createExamples) {
      generateFiles(
        tree,
        path.join(__dirname, 'files/source-root', 'testronaut-examples'),
        examplesDir,
        {}
      );
    }

    // see https://github.com/npm/npm/issues/3763
    tree.write(path.join(root, 'testronaut', '.gitignore'), 'generated' + EOL);

    ensurePlaywrightIsInstalled(tree);

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
  const angularConfig = JSON.parse(tree.read('angular.json', 'utf8') || '') as {
    projects: Record<
      string,
      {
        architect: ArchitectConfiguration;
        sourceRoot: string;
        root: string;
      }
    >;
  };
  const projects = angularConfig.projects;

  const projectName = getProjectName(projects, options.project);
  const config = projects[projectName];
  const sourceRoot = config.sourceRoot;
  const root = config.root;

  if (!(config.architect?.['serve'] && config.architect?.['build'])) {
    throw new Error(
      `Project ${projectName} is missing serve and/or build targets`
    );
  }

  const build = config.architect['build'];
  const serve = config.architect['serve'];

  return { build, serve, projectName, config, sourceRoot, root };
}

function getElementsForNx(tree: Tree, options: NgAddGeneratorSchema) {
  const projects: Record<string, ProjectConfiguration> = Object.fromEntries(
    getProjects(tree).entries()
  );

  const projectName = getProjectName(projects, options.project);
  const config = projects[projectName];
  const sourceRoot = throwIfNullish(config.sourceRoot);
  const root = throwIfNullish(config.root);

  if (!(config.targets?.['serve'] && config.targets?.['build'])) {
    throw new Error(
      `Project ${config.name} is missing serve and/or build targets`
    );
  }

  const build = config.targets['build'];
  const serve = config.targets['serve'];

  return { build, serve, projectName, config, sourceRoot, root };
}

export default convertNxGenerator(ngAddGenerator);

export function throwIfNullish<T>(
  value: T | undefined,
  message = 'Value is nullish'
): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

export function assertNotNullish<T>(value: T | undefined): asserts value is T {
  throwIfNullish(value);
}

/**
 * Copy from https://github.com/nrwl/nx/blob/master/packages/create-nx-workspace/src/utils/package-manager.ts#L21
 * Cannot use original from nx because we need to access the try and not the local file system for testing.
 */

export function detectPackageManager(
  tree: Tree
): 'bun' | 'yarn' | 'pnpm' | 'npm' {
  if (tree.exists('bun.lockb') || tree.exists('bun.lock')) {
    return 'bun';
  }
  if (tree.exists('yarn.lock')) {
    return 'yarn';
  }
  if (tree.exists('pnpm-lock.yaml')) {
    return 'pnpm';
  }
  return 'npm';
}

/**
 * Ensures Playwright is installed with a compatible version.
 * Checks if it's already installed and warns if the version is incompatible.
 * If not installed, adds it to package.json with the required version and
 * runs the install task of the existing package manager.
 */
export function ensurePlaywrightIsInstalled(tree: Tree): void {
  const requiredRange = getRequiredPlaywrightRange();
  const installedVersion = getInstalledPlaywrightVersion(tree);

  if (installedVersion) {
    if (
      !isVersionCompatible(
        installedVersion,
        requiredRange.upper,
        requiredRange.lower
      )
    ) {
      logger.warn(
        `Installed Playwright version (${installedVersion}) may not be compatible with Testronaut. ` +
          `Recommended version: ${requiredRange.upper}. Consider changing your Playwright version to avoid issues.`
      );
    }
  } else {
    addDependenciesToPackageJson(
      tree,
      {},
      { '@playwright/test': requiredRange.upper }
    );
    installPackagesTask(tree);
  }
}

/**
 * Provides the required Playwright version range for Testronaut.
 */
function getRequiredPlaywrightRange() {
  return PLAYWRIGHT_VERSION_RANGE;
}

export function parseMaxSupportedVersion(versionRange: string) {
  // Strict format: >=x.y.z <=a.b.c (with at least one space)
  // Both versions must have major.minor.patch format
  const regex = /^>=([\d.]+)\s+<=([\d.]+)$/;
  const match = versionRange.match(regex);

  if (!match) {
    throw new Error(
      `Invalid version range format: ${versionRange}. Must use format ">=x.y.z <=a.b.c" with major.minor.patch versions.`
    );
  }

  // Extract both bounds
  const lower = match[1];
  const upper = match[2];

  return { lower, upper };
}

/**
 * Checks if @playwright/test is already installed in the project.
 * Returns the installed version or undefined if not found.
 */
function getInstalledPlaywrightVersion(tree: Tree): string | undefined {
  if (tree.exists('node_modules/@playwright/test')) {
    const packageJson: { version: string } = readJson(
      tree,
      'node_modules/@playwright/test/package.json'
    );
    return packageJson.version;
  }

  return undefined;
}

function isVersionCompatible(
  installedVersion: string,
  upper: string,
  lower: string
): boolean {
  return semver.satisfies(installedVersion, `>=${lower} <=${upper}`);
}
