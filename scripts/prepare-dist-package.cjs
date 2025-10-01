#!/usr/bin/env node
/***
  Bumps the patch version in packages/<project>/package.json only.
  Fails if the package.json does not exist.

  Usage: node scripts/prepare-dist-package.cjs <project>
*/
const fs = require('fs');
const path = require('path');

function main() {
  const project = process.argv[2];
  const root = path.resolve(__dirname, '..');
  const distDir = path.join(root, 'packages', project);
  const distPkgPath = path.join(distDir, 'package.json');

  if (!fs.existsSync(distDir)) {
    console.error(`Error: package directory not found for ${project}: ${distDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(distPkgPath)) {
    console.error(`Error: package.json not found for ${project}: ${distPkgPath}`);
    process.exit(1);
  }

  // Read package.json and bump patch version only
  const outPkg = JSON.parse(fs.readFileSync(distPkgPath, 'utf8'));
  const parts = (outPkg.version || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  outPkg.version = `${parts[0]}.${parts[1]}.${parts[2]}`;

  fs.writeFileSync(distPkgPath, JSON.stringify(outPkg, null, 2));
  console.log(`Wrote ${distPkgPath} with version ${outPkg.version}`);
}

main();


