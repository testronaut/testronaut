import { FileData } from './core';
import { ImportedIdentifier } from '../core/file-analysis';

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
}
