import { dirname, join, posix, relative, sep } from 'node:path';

/**
 * Adjust the relative import path when moving a file from `srcFilePath` to `destFilePath`.
 *
 * @param srcFilePath initial file path
 * @param destFilePath the new file path after moving
 * @param importPath the import path to adjust
 */
export function adjustImportPath({
  srcFilePath,
  destFilePath,
  importPath,
}: {
  srcFilePath: string;
  destFilePath: string;
  importPath: string;
}) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return toPosixPath(
      relative(dirname(destFilePath), join(dirname(srcFilePath), importPath))
    );
  } else {
    return importPath;
  }
}

export function toPosixPath(path: string) {
  return path.replaceAll(sep, posix.sep);
}
