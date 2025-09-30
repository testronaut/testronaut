const {
  createRollupConfig,
} = require('../build-utils/create-rollup-config.cjs');
const fs = require('fs');
const path = require('path');

const { entryPoints, assets } = findGeneratorEntryPoints();

module.exports = createRollupConfig({
  main: './src/index.ts',
  additionalEntryPoints: [
    './src/browser.ts',
    ...entryPoints
  ],
  assets,
  keepPath: {
    pattern: /\/src\/generators\//,
    dirname: path.join(__dirname)
  },
});

// function findGeneratorEntryPoints() {
//   const baseDir = path.join(__dirname, 'src', 'generators');
//   return fs.readdirSync(baseDir, { withFileTypes: true })
//     .filter((d) => d.isDirectory())
//     .map((d) => path.join(baseDir, d.name, `${d.name}.ts`))
//     .filter(fs.existsSync);
// }

function findGeneratorEntryPoints() {
  const baseDir = path.join(__dirname, 'src', 'generators');
  const generatorDirs = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

    const entryPoints = generatorDirs
    .map((d) => path.join(baseDir, d.name, `${d.name}.ts`))

    const assets = generatorDirs.flatMap((d) => [
      { input: `${baseDir}/${d.name}`, glob: 'schema.json',  output: `src/generators/${d.name}` },
      { input: `${baseDir}/${d.name}`, glob: 'schema.d.ts', output: `src/generators/${d.name}` },
    ]);

    return {
      entryPoints,
      assets,
    };
}