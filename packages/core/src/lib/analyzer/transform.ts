import { FileData } from './core';
import { ImportedIdentifier } from '../file-analysis';

export interface Transform {
  (fileInfo: FileData): {
    content: string;
    importedIdentifiers: ImportedIdentifier[];
  };
}
