const {
  createRollupConfig,
} = require('../build-utils/create-rollup-config.cjs');
const path = require('path');
const fs = require('fs');

module.exports = createRollupConfig({
  assets: findGeneratorAssets(),
  input: {
    browser: './src/browser.ts',
    'schematics/init/index': './src/schematics/init/index.ts',
  },
  main: './src/index.ts',
});

function findGeneratorAssets() {
  const baseDir = path.join(__dirname, 'src', 'schematics');
  const generatorDirs = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());
  const assets = generatorDirs.flatMap((d) => {
    const output = `schematics/${d.name}`;
    const files = [
      {
        input: `${baseDir}/${d.name}`,
        glob: 'schema.json',
        output,
      },
      {
        input: `${baseDir}/${d.name}`,
        glob: 'schema.d.ts',
        output,
      },
      {
        input: `${baseDir}/${d.name}`,
        glob: 'playwright-version.json',
        output,
      },
    ];

    // Glob option does not preserve the directory structure, so we need to get all the files recursively
    const filesDir = path.join(baseDir, d.name, 'files');
    if (fs.existsSync(filesDir)) {
      const allFiles = getAllFilesRecursively(filesDir, '', `${output}/files`);
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
