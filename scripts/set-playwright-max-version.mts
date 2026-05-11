#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { valid } from 'semver';

const __filename = import.meta.filename;
const __dirname = path.dirname(__filename);

main();

/**
 * Sets playwright-version.json `upper` and @playwright/test peer ranges in @testronaut/core and @testronaut/angular.
 */
function main() {
  const rootDir = path.resolve(__dirname, '..');
  const playwrightVersionJsonPath = path.join(
    rootDir,
    'packages/angular/src/schematics/init/playwright-version.json'
  );
  const libPackagePaths = {
    core: path.join(rootDir, 'packages/core/package.json'),
    angular: path.join(rootDir, 'packages/angular/package.json'),
  } as const;

  const rawArg = process.argv[2];
  if (rawArg === undefined || rawArg === '') {
    console.error('Usage: set-playwright-max-version.mts <version>');
    process.exit(1);
  }

  const normalized = (rawArg.startsWith('v') ? rawArg.slice(1) : rawArg).trim();
  const coerced = valid(normalized);
  if (coerced === null) {
    console.error(`Invalid semver version: ${JSON.stringify(rawArg)}`);
    process.exit(1);
  }

  const upper = coerced;
  const versionDoc = readJson(playwrightVersionJsonPath) as {
    lower: string;
    upper: string;
  };
  const { lower } = versionDoc;
  versionDoc.upper = upper;
  writeJson(playwrightVersionJsonPath, versionDoc);

  const peerRange = `>=${lower} <=${upper}`;
  for (const [name, pkgPath] of Object.entries(libPackagePaths)) {
    const pkg = readJson(pkgPath) as {
      peerDependencies?: Record<string, string>;
    };
    if (!pkg.peerDependencies?.['@playwright/test']) {
      console.error(
        `Could not find @playwright/test peer dependency in packages/${name}/package.json.`
      );
      process.exit(1);
    }
    pkg.peerDependencies['@playwright/test'] = peerRange;
    writeJson(pkgPath, pkg);
  }

  console.log(`Set Playwright max to ${upper} (peer range: ${peerRange}).`);
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath: string, data: unknown) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
