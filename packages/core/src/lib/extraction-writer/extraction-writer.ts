import * as ts from 'typescript';
import { join, relative } from 'node:path/posix';

import { ExtractedFunction, FileAnalysis } from '../file-analysis';
import { FileSystem } from '../infra/file-system';
import { FileSystemImpl } from '../infra/file-system.impl';
import {
  generateExportedConstObjectLiteral,
  generateImportDeclaration,
} from './ast-factory';
import { ExtractionConfig } from './extraction-config';
import { FileOps } from './file-ops';
import { adjustImportPath } from './path-utils';

export class ExtractionWriter {
  readonly #config: ExtractionConfig;
  /* Absolute path to extraction dir. */
  readonly #extractionPath: string;
  readonly #entryPointPath: string;
  readonly #fileOps: FileOps;
  readonly #fileSystem: FileSystem;

  constructor({
    fileSystem = new FileSystemImpl(),
    ...config
  }: ExtractionConfig & {
    fileSystem?: FileSystem;
  }) {
    this.#fileOps = new FileOps({ fileSystem: fileSystem });
    this.#fileSystem = fileSystem;

    this.#config = config;
    this.#extractionPath = join(
      this.#config.projectRoot,
      this.#config.extractionDir
    );
    this.#entryPointPath = join(this.#extractionPath, 'index.ts');
  }

  init() {
    this.#fileOps.createFileIfNotExistsSync(
      this.#entryPointPath,
      /* This fixes "TS7053: Element implicitly has an any type" error on `globalThis['some-hash']` . */
      '// @ts-nocheck'
    );
  }

  async write(fileAnalysis: FileAnalysis) {
    const relativePath = relative(this.#config.projectRoot, fileAnalysis.path);
    const destFilePath = join(this.#extractionPath, relativePath);

    await this.#fileSystem.writeFile(
      destFilePath,
      this.#generateExtractedFunctionsFile({
        destFilePath,
        fileAnalysis,
      }),
      { overwrite: true }
    );

    await this.#fileOps.upsertLine({
      path: this.#entryPointPath,
      match: relativePath,
      replacement: this.#generateEntrypointGlobal({
        hash: fileAnalysis.hash,
        path: relativePath,
      }),
    });
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
    const importIdentifiers = fileAnalysis.extractedFunctions
      .map((extractedFunction) => extractedFunction.importedIdentifiers)
      .flat()
      .map((importIdentifier) => ({
        ...importIdentifier,
        module: adjustImportPath({
          srcFilePath: fileAnalysis.path,
          destFilePath,
          importPath: importIdentifier.module,
        }),
      }));

    const moduleImports = Object.entries(
      Object.groupBy(importIdentifiers, (item) => item.module)
    );

    return moduleImports.map(([module, importIdentifiers = []]) =>
      generateImportDeclaration({
        module,
        identifiers: importIdentifiers.map((ident) => ident.name),
      })
    );
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

    return generateExportedConstObjectLiteral({
      variableName: 'extractedFunctionsMap',
      value: extractedFunctionsRecord,
    });
  }
}
