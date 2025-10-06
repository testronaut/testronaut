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

    // Glob option does not preserve the directory structure, so we need to get all the files recursively
    const filesDir = path.join(baseDir, d.name, 'files');
    if (fs.existsSync(filesDir)) {
      const allFiles = getAllFilesRecursively(
        filesDir,
        '',
        `src/schematics/${d.name}/files`
      );
      const fileAssets = allFiles.map((file) => ({
        input: path.dirname(file.input),
        glob: file.filename,
        output: file.relativeDirectory,
      }));

      files.push(...fileAssets);
    }

    return files;
  });
  return assets;
}

function getAllFilesRecursively(dir, relativePath = '', baseOutputPath = '') {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    const relativeItemPath = path.join(relativePath, item.name);

    if (item.isDirectory()) {
      // Recursively get files from subdirectories
      files.push(
        ...getAllFilesRecursively(itemPath, relativeItemPath, baseOutputPath)
      );
    } else {
      // It's a file, add it to the list
      const directoryPath = path.join(baseOutputPath, relativePath); // Only directory path, no filename
      files.push({
        input: itemPath,
        relativeDirectory: directoryPath, // Full path without filename
        filename: item.name, // Separate filename
      });
    }
  }

  return files;
}
