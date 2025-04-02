import { dirname, join, relative } from 'node:path/posix';

/**
 * Adjust the relative import path when moving a file from `srcFilePath` to `destFilePath`.
 *
 * @param srcFilePath
 * @param destFilePath
 * @param importPath
 */
export function adjustImportPath(
  srcFilePath: string,
  destFilePath: string,
  importPath: string
) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return relative(
      dirname(destFilePath),
      join(dirname(srcFilePath), importPath)
    );
  } else {
    return importPath;
  }
}
