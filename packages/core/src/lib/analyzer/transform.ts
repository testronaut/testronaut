import type { FileData } from './core';
import type { ImportedIdentifier } from '../core/file-analysis';

export interface Transform {
  name: string;
  apply: TransformApplyFn;
}

export interface TransformApplyFn {
  (fileData: FileData): TransformResult;
}

export interface TransformResult {
  content: string;
  importedIdentifiers: ImportedIdentifier[];
  generatedNames: string[];
}
