import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  generateFiles,
  getPackageManagerCommand,
  installPackagesTask,
  logger,
  ProjectConfiguration,
  readJson,
  Tree,
} from '@nx/devkit';
import { EOL } from 'os';
import * as path from 'path';
import * as semver from 'semver';
import { fileURLToPath } from 'url';
import { detectPackageManager } from '../util/detect-package-manager';
import { createDevkit } from '../util/devkit';
import * as playwrightVersionJson from './playwright-version.json';
import { type NgAddGeneratorSchema } from './schema';
import { assertNotNullish } from '../util/assert-not-nullish';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const devkit = createDevkit(tree);

    const { build, serve, projectName, config, sourceRoot, root } =
      devkit.getElements(tree, options);

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

    assertNotNullish(build.options);
    const entryPoint =
      'browser' in build.options
        ? { browser: build.options.browser }
        : { main: build.options.main };

    const prefix = root ? `${root}/` : '';
    const testronautConfig: Record<string, unknown> = {
      ...entryPoint,
      index: `${prefix}testronaut/index.html`,
      tsConfig: `${prefix}testronaut/tsconfig.json`,
      sourceMap: true,
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

    devkit.updateProjectConfiguration(tree, projectName, config);

    const directoryLevels = (root ? root.split('/').length : 0) + 1;
    generateFiles(
      tree,
      path.join(__dirname, 'files/root'),
      path.join(root, '.'),
      {
        projectName,
        ngCommand: devkit.cmd,
        packageManager: getPackageManagerCommand(detectPackageManager(tree))
          .exec,
        tsConfigExtends: `${new Array(directoryLevels).fill('..').join('/')}/${
          devkit.tsConfigName
        }`,
      }
    );

    const examplesDir = path.join(sourceRoot, 'testronaut-examples');

    if (options.withExamples) {
      generateFiles(
        tree,
        path.join(__dirname, 'files/source-root', 'testronaut-examples'),
        examplesDir,
        {}
      );
    }

    // see https://github.com/npm/npm/issues/3763
    tree.write(path.join(root, 'testronaut', '.gitignore'), 'generated' + EOL);

    installDependencies(tree);

    logger.info(
      getSuccessMessage(
        options.project,
        Boolean(options.withExamples),
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

/**
 * Installs @testronaut/angular and ensures Playwright are installed with a compatible version.
 * Checks if Playwright is already installed and warns if the version is incompatible.
 * If not installed, adds it to package.json with the required version and
 * runs the install task of the existing package manager.
 */
export function installDependencies(tree: Tree): void {
  const playwrightRequiredRange = getRequiredPlaywrightRange();
  const playwrightInstalledVersion = getInstalledPlaywrightVersion(tree);

  if (
    playwrightInstalledVersion &&
    !isVersionCompatible(
      playwrightInstalledVersion,
      playwrightRequiredRange.upper,
      playwrightRequiredRange.lower
    )
  ) {
    logger.warn(
      `Installed Playwright version (${playwrightInstalledVersion}) may not be compatible with Testronaut. ` +
        `Recommended version: ${playwrightRequiredRange.upper}. Consider changing your Playwright version to avoid issues.`
    );
  }

  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@playwright/test': playwrightRequiredRange.upper,
      // TODO: use version from config
      '@testronaut/angular': 'latest',
    }
  );
  installPackagesTask(tree);
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

export default convertNxGenerator(ngAddGenerator);
