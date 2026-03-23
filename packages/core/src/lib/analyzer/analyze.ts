import { h32 } from 'xxhashjs';
import {
  createExtractedFunction,
  createFileAnalysis,
  type ExtractedFunction,
  type FileAnalysis,
  type ImportedIdentifier,
} from '../core/file-analysis';
import { LaxHashCollisionError } from '../core/lax-hash-collision-error';
import { computeHashes } from '../lax-hashing/compute-hashes';
import { AnalysisContext, type FileData } from './core';
import { visitImportedIdentifiers } from './visit-imported-identifiers';
import { visitInPageCalls } from './visit-in-page-calls';
import { DuplicatedNamedFunctionsError } from '../core/duplicate-extracted-functions.error';

export function analyze({ fileData }: { fileData: FileData }): FileAnalysis {
  const hash = generateHash(fileData.content);

  const ctx = new AnalysisContext(fileData);

  const extractedFunctions: ExtractedFunction[] = [];
  const laxToFull: Record<string, { fullHash: string; code: string }> = {};
  const namedFunctionNames: string[] = [];

  visitInPageCalls(ctx, (inPageCall) => {
    const importedIdentifiers: ImportedIdentifier[] = [];
    visitImportedIdentifiers(ctx, inPageCall.node, (importedIdentifier) =>
      importedIdentifiers.push(importedIdentifier)
    );

    if (!inPageCall.name) {
      const { laxHash, fullHash } = computeHashes(inPageCall.code);
      const existingFull = laxToFull[laxHash];
      if (existingFull !== undefined && existingFull.fullHash !== fullHash) {
        throw new LaxHashCollisionError(inPageCall.code, existingFull.code);
      }

      laxToFull[laxHash] = { fullHash, code: inPageCall.code };
      extractedFunctions.push(
        createExtractedFunction({
          code: inPageCall.code,
          name: laxHash,
          importedIdentifiers,
        })
      );
    } else {
      if (namedFunctionNames.includes(inPageCall.name)) {
        throw new DuplicatedNamedFunctionsError(fileData.path, inPageCall.name);
      }
      namedFunctionNames.push(inPageCall.name);

      extractedFunctions.push(
        createExtractedFunction({
          code: inPageCall.code,
          name: inPageCall.name,
          importedIdentifiers,
        })
      );
    }
  });

  return createFileAnalysis({
    path: fileData.path,
    hash,
    extractedFunctions,
  });
}

function generateHash(content: string) {
  return h32(content, 0).toString(16).padStart(8, '0');
}
