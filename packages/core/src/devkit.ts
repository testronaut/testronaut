export {
  getInPageIdentifier,
  getInPageWithFunctionNameIdentifier,
} from './lib/core/in-page-identifier';
export {
  AnalysisContext,
  createFileData,
  type FileData,
} from './lib/analyzer/core';
export {
  createImportedIdentifier,
  type ImportedIdentifier,
} from './lib/core/file-analysis';
export type {
  Transform,
  TransformApplyFn,
  TransformResult,
} from './lib/analyzer/transform';
