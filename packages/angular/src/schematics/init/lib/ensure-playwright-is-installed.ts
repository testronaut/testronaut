import {
  addDependenciesToPackageJson,
  installPackagesTask,
  logger,
  readJson,
  Tree,
} from '@nx/devkit';
import * as semver from 'semver';

/**
 * Ensures Playwright is installed with a compatible version.
 * Checks if it's already installed and warns if the version is incompatible.
 * If not installed, adds it to package.json with the required version and
 * runs the install task of the existing package manager.
 */
export function ensurePlaywrightIsInstalled(tree: Tree): void {
  const requiredRange = getRequiredPlaywrightRange(tree);
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
 * Extracts the required Playwright version from @testronaut/angular's peerDependencies.
 * Uses semver to parse the version range and extract the upper bound or base version.
 */
function getRequiredPlaywrightRange(tree: Tree) {
  /**
   * TODO:
   * Although `core` already has a dependency on Playwright, we define it again
   * in the Angular package. Since Playwright in `core` is declared as a peer
   * dependency, we currently need to:
   *  1. Install `core` first to find out which Playwright version is required.
   *  2. Then trigger another install for Playwright itself.
   *
   * A possible fix would be to move `core` from a peer dependency to a regular
   * dependency in Angular’s `package.json`. However, this doesn’t currently work,
   * because the peer dependency uses a `workspace` reference, which prevents it
   * from being installed as a regular dependency.
   *
   * As far as I remember, we used the workspace reference trick to support both
   * CommonJS and ES modules in `core`. That’s also why the `dist` folder is
   * embedded. CommonJS support was required so users could provide a
   * `playwright.config.ts` file.
   *
   * Since we’ve decided that using a single Playwright config file is out of
   * scope, and we’ll go with a second Playwright config instead, we can drop
   * CommonJS support.
   *
   * That means we can revert to the original setup — directory structure,
   * packaging, etc. — and move `core` to a regular dependency in Angular’s
   * `package.json`. Once that’s done, Playwright will be installed automatically,
   * and we can remove the redundant dependency from Angular.
   */
  const corePackage = JSON.parse(
    tree.read('node_modules/@testronaut/angular/package.json', 'utf-8') || ''
  ) as { peerDependencies: Record<string, string> };
  const playwrightRange = corePackage.peerDependencies['@playwright/test'];
  if (!playwrightRange) {
    throw new Error(
      'Could not find @playwright/test in @testronaut/core peerDependencies'
    );
  }

  return parseMaxSupportedVersion(playwrightRange);
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
    const packageJson = readJson(
      tree,
      'node_modules/@playwright/test/package.json'
    ) as {
      version: string;
    };
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
