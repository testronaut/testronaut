import * as ts from 'typescript';
import { join, relative } from 'node:path/posix';

import { ExtractedFunction, FileAnalysis } from '../file-analysis';
import { FileSystem } from '../infra/file-system';
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
    await this.#fileOps.createFileIfNotExists(this.#entryPointPath);
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

    await this.#fileOps.upsertLine(
      this.#entryPointPath,
      relativePath,
      this.#generateEntrypointGlobal({
        hash: fileAnalysis.hash,
        path: relativePath,
      })
    );
  }

  /**
   * Generates the global function that will be added to the entrypoint file.
   * e.g. `globalThis['hash123'] = () => import('./src/my-component.spec.ts');`
   */
  #generateEntrypointGlobal({ hash, path }: { hash: string; path: string }) {
    return `globalThis['${hash}'] = () => import('./${path}');`;
  }

  /**
   * Generates the content of the extracted functions file.
   *
   * e.g., `
   * import { greetings } from './greetings';
   *
   * export const extractedFunctionsMap = {
   *   '': () => { console.log(greetings); }
   *   'Bye!': () => { console.log('Bye!'); }
   * };
   * `
   */
  #generateExtractedFunctionsFile({
    destFilePath,
    fileAnalysis,
  }: {
    destFilePath: string;
    fileAnalysis: FileAnalysis;
  }): string {
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

  /**
   * Generates the import declarations for the extracted functions.
   * This also adjusts the import path of relative imports.
   *
   * e.g., `import { greetings } from './greetings';`
   */
  #generateImportDeclarations({
    destFilePath,
    fileAnalysis,
  }: {
    destFilePath: string;
    fileAnalysis: FileAnalysis;
  }) {
    return fileAnalysis.extractedFunctions
      .map((extractedFunction) => extractedFunction.importedIdentifiers)
      .flat()
      .map((importIdentifier) => ({
        ...importIdentifier,
        module: adjustImportPath({
          srcFilePath: fileAnalysis.path,
          destFilePath,
          importPath: importIdentifier.module,
        }),
      }))
      .map((importIdentifier) => generateImportDeclaration(importIdentifier));
  }

  /**
   * Generates the variable statement for the extracted functions.
   * e.g., `export const extractedFunctionsMap = {'': () => {...}}`
   */
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
}
