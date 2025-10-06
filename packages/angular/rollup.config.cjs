const {
  createRollupConfig,
} = require('../build-utils/create-rollup-config.cjs');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const baseConfig = createRollupConfig({
  main: './src/index.ts',
  additionalEntryPoints: ['./src/browser.ts'],
  assets: findGeneratorAssets(),
});

module.exports = {
  ...baseConfig,
  plugins: [
    ...(baseConfig.plugins || []),
    {
      name: 'post-build-generators',
      writeBundle() {
        console.log('Compiling generators to CommonJS...');
        try {
          execSync('pnpm tsc --project tsconfig.generators.json', {
            stdio: 'inherit',
            cwd: __dirname,
          });
          console.log('✓ Generator compilation complete!');
        } catch (error) {
          console.error('Generator compilation failed:', error.message);
          process.exit(1);
        }
      },
    },
  ],
};

function findGeneratorAssets() {
  const baseDir = path.join(__dirname, 'src', 'schematics');
  const generatorDirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  const assets = generatorDirs.flatMap((d) => {
    const files = [
      {
        input: `${baseDir}/${d.name}`,
        glob: 'schema.json',
        output: `src/schematics/${d.name}`,
      },
      {
        input: `${baseDir}/${d.name}`,
        glob: 'schema.d.ts',
        output: `src/schematics/${d.name}`,
      },
    ];

    // Add files directory if it exists
    const filesDir = path.join(baseDir, d.name, 'files');
    if (fs.existsSync(filesDir)) {
      files.push({
        input: filesDir,
        glob: '**/*',
        output: `src/schematics/${d.name}/files`,
      });
    }

    return files;
  });

  return assets;
}
