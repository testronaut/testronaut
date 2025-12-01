#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corePackageJsonPath = path.resolve(
  __dirname,
  '../packages/core/package.json'
);
const playwrightVersionJsonPath = path.resolve(
  __dirname,
  '../packages/angular/src/schematics/init/playwright-version.json'
);

const corePackageJson = readJson(corePackageJsonPath);
const playwrightRange = corePackageJson?.peerDependencies?.['@playwright/test'];

if (!playwrightRange) {
  console.error(
    'Could not find @playwright/test peer dependency in @testronaut/core package.json.'
  );
  process.exit(1);
}

const coreUpperBound = extractUpperBoundFromRange(playwrightRange);
const playwrightVersionJson = readJson(playwrightVersionJsonPath);
const schematicUpperBound = playwrightVersionJson.upper;

if (coreUpperBound !== schematicUpperBound) {
  console.error(
    `Playwright version mismatch detected. @testronaut/core requires <=${coreUpperBound}, but schematic hard-codes ${schematicUpperBound}.`
  );
  process.exit(1);
}

console.log(
  `Playwright version sync check passed (version ${schematicUpperBound}).`
);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function extractUpperBoundFromRange(range) {
  const match = /^>=([\d.]+)\s+<=([\d.]+)$/.exec(range);
  if (!match) {
    console.error(
      `Unsupported Playwright version range format in @testronaut/core: ${range}`
    );
    process.exit(1);
  }
  return match[2];
}
