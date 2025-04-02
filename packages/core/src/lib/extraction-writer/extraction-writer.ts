import * as ts from 'typescript';
import { join, relative } from 'node:path/posix';

import { ExtractedFunction, FileAnalysis } from '../file-analysis';
import { FileExistsError, FileSystem } from '../infra/file-system';
import { FileSystemImpl } from '../infra/file-system.impl';
import {
  generateExportedConstObjectLiteral,
  generateImportDeclaration,
} from './ast-factory';
import { FileOps } from './file-ops';
import { adjustImportPath } from './path-utils';

/**
 * @deprecated 🚧 work in progress
 */
export class ExtractionWriter {
  readonly #projectRoot: string;
  readonly #destPath: string;
  readonly #entryPointPath: string;
  readonly #fileOps: FileOps;
  readonly #fileSystem: FileSystem;

  constructor({
    projectRoot,
    destPath,
    fileSystem = new FileSystemImpl(),
  }: {
    projectRoot: string;
    destPath: string;
    fileSystem?: FileSystem;
  }) {
    this.#projectRoot = projectRoot;
    this.#destPath = destPath;
    this.#fileOps = new FileOps({ fileSystem: fileSystem });
    this.#fileSystem = fileSystem;
    this.#entryPointPath = join(destPath, 'entrypoint.ts');
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async init() {
    try {
      await this.#fileSystem.writeFile(this.#entryPointPath, '');
    } catch (error) {
      if (error instanceof FileExistsError) {
        return;
      }

      throw error;
    }
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async write(fileAnalysis: FileAnalysis) {
    const relativePath = relative(this.#projectRoot, fileAnalysis.path);
    const destFilePath = join(this.#destPath, relativePath);

    await this.#fileSystem.writeFile(
      destFilePath,
      this.#generateExtractedFunctionsFile({
        destFilePath,
        fileAnalysis,
      }),
      { overwrite: true }
    );

    const extractedFunctionsImportLine = this.#generateEntrypointGlobal({
      hash: fileAnalysis.hash,
      path: relativePath,
    });

    await this.#fileOps.upsertLine(
      this.#entryPointPath,
      relativePath,
      extractedFunctionsImportLine
    );
  }

  /**
   * Generates the global function that will be added to the entrypoint file.
   * e.g. `globalThis['hash123'] = () => import('./src/my-component.spec.ts');`
   */
  #generateEntrypointGlobal({ hash, path }: { hash: string; path: string }) {
    return `globalThis['${hash}'] = () => import('./${path}');`;
  }

  #generateExtractedFunctionsFile({
    destFilePath,
    fileAnalysis,
  }: {
    destFilePath: string;
    fileAnalysis: FileAnalysis;
  }) {
    const sourceFile = ts.factory.createSourceFile(
      [
        ...this.#generateImportDeclarations({ destFilePath, fileAnalysis }),
        this.#generateExtractedFunctionsVariableStatement(
          fileAnalysis.extractedFunctions
        ),
      ],
      ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    );

    return ts
      .createPrinter({ newLine: ts.NewLineKind.LineFeed })
      .printFile(sourceFile);
  }

  #generateExtractedFunctionsVariableStatement(
    extractedFunctions: ExtractedFunction[]
  ) {
    const extractedFunctionsRecord = extractedFunctions.reduce<
      Record<string, string>
    >((acc, extractedFunction) => {
      acc[extractedFunction.name ?? ''] = extractedFunction.code;
      return acc;
    }, {});

    /* export const extractedFunctionsMap = {'': () => {...}} */
    return generateExportedConstObjectLiteral({
      variableName: 'extractedFunctionsMap',
      value: extractedFunctionsRecord,
    });
  }

  #generateImportDeclarations({
    destFilePath,
    fileAnalysis,
  }: {
    destFilePath: string;
    fileAnalysis: FileAnalysis;
  }) {
    let importIdentifiers = fileAnalysis.extractedFunctions
      .map((extractedFunction) => extractedFunction.importedIdentifiers)
      .flat();

    importIdentifiers = importIdentifiers.map((importIdentifier) => {
      return {
        ...importIdentifier,
        module: adjustImportPath({
          srcFilePath: fileAnalysis.path,
          destFilePath,
          importPath: importIdentifier.module,
        }),
      };
    });

    return importIdentifiers.map((importIdentifier) =>
      generateImportDeclaration(importIdentifier)
    );
  }
}
