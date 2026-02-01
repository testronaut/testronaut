import type { Transform, TransformResult } from '@testronaut/core/devkit';

export const angularTransform: Transform = {
  name: 'angular',
  apply(fileData): TransformResult {
    return {
      content: fileData.content,
      importedIdentifiers: [],
    };
  },
};
