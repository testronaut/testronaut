/**
 * Copy from https://github.com/nrwl/nx/blob/master/packages/create-nx-workspace/src/utils/package-manager.ts#L21
 * Cannot use original from nx because we need to access the try and not the local file system for testing.
 */

import { Tree } from "@nx/devkit";

export function detectPackageManager(
    tree: Tree
  ): 'bun' | 'yarn' | 'pnpm' | 'npm' {
    if (tree.exists('bun.lockb') || tree.exists('bun.lock')) {
      return 'bun';
    }
    if (tree.exists('yarn.lock')) {
      return 'yarn';
    }
    if (tree.exists('pnpm-lock.yaml')) {
      return 'pnpm';
    }
    return 'npm';
  }