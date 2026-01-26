export { getRunInBrowserIdentifier } from './lib/core/run-in-browser-identifier';
export { computeTokenHash } from './lib/core/compute-token-hash';
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
