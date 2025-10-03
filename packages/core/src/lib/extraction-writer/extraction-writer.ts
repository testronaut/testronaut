import { join, relative } from 'node:path/posix';
import * as ts from 'typescript';

import {
  type ExtractedFunction,
  type FileAnalysis,
} from '../core/file-analysis';
import { type FileSystem } from '../infra/file-system';
import { FileSystemImpl } from '../infra/file-system.impl';
import {
  generateExportedConstObjectLiteral,
  generateImportDeclaration,
} from './ast-factory';
import { FileOps } from './file-ops';
import { adjustImportPath } from './path-utils';

export class ExtractionWriter {
  readonly #config: ExtractionWriterConfig;
  /* Absolute path to extraction dir. */
  readonly #extractionPath: string;
  readonly #entryPointPath: string;
  readonly #fileOps: FileOps;
  readonly #fileSystem: FileSystem;

  constructor({
    fileSystem = new FileSystemImpl(),
    ...config
  }: ExtractionWriterConfig & {
    fileSystem?: FileSystem;
  }) {
    this.#fileOps = new FileOps({ fileSystem: fileSystem });
    this.#fileSystem = fileSystem;
    const extractionDir = config.extractionDir ?? 'testronaut/generated';

    this.#config = config;
    this.#extractionPath = join(this.#config.projectRoot, extractionDir);
    this.#entryPointPath = join(this.#extractionPath, 'index.ts');
  }

  /**
   * Overwrites the entrypoint file.
   *
   * It is common to have remaining entrypoint from previous runs.
   * Sometimes these previous runs can import files that do not exist anymore —
   * e.g. a run from another branch importing a component that was removed.
   */
  resetEntrypoint() {
    this.#fileSystem.writeFileSync(
      this.#entryPointPath,
      DISABLE_CHECKS_MAGIC_STRING,
      { overwrite: true }
    );
  }

  async write(fileAnalysis: FileAnalysis) {
    const relativePath = relative(this.#config.projectRoot, fileAnalysis.path);
    const destFilePath = join(this.#extractionPath, relativePath);

    fileAnalysis = this.#adjustDynamicImportsPaths({
      fileAnalysis,
      destFilePath,
    });

    await this.#fileSystem.writeFile(
      destFilePath,
      `\
${DISABLE_CHECKS_MAGIC_STRING}
${this.#generateExtractedFunctionsFile({
  destFilePath,
  fileAnalysis,
})}`,
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
   * export const extractedFunctionsRecord = {
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
    let importIdentifiers = [
      ...fileAnalysis.importedIdentifiers,
      ...fileAnalysis.extractedFunctions
        .map((extractedFunction) => extractedFunction.importedIdentifiers)
        .flat(),
    ];

    importIdentifiers = importIdentifiers.map((importIdentifier) => ({
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
   * Adjusts the dynamic imports paths to be relative to the extracted function.
   */
  #adjustDynamicImportsPaths({
    fileAnalysis,
    destFilePath,
  }: {
    fileAnalysis: FileAnalysis;
    destFilePath: string;
  }) {
    const extractedFunctions = fileAnalysis.extractedFunctions.map(
      (extractedFunction) => {
        let code = extractedFunction.code;
        for (const dynamicImport of extractedFunction.dynamicImports) {
          code = code.replace(
            `import('${dynamicImport}')`,
            `import('${adjustImportPath({
              srcFilePath: fileAnalysis.path,
              destFilePath,
              importPath: dynamicImport,
            })}')`
          );
        }

        return {
          ...extractedFunction,
          code,
        };
      }
    );

    return {
      ...fileAnalysis,
      extractedFunctions,
    };
  }

  /**
   * Generates the variable statement for the extracted functions.
   * e.g., `export const extractedFunctionsRecord = {'': () => {...}}`
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
      variableName: 'extractedFunctionsRecord',
      value: extractedFunctionsRecord,
    });
  }
}

/* - prettier-ignore prevents users from moving the import line to a different line than the global variable
 * as it would break our simple pattern matching replacement.
 * - @ts-nocheck fixes "TS7053: Element implicitly has an any type" error on `globalThis['some-hash']`.
 * - eslint-disable-next-line allows @ts-nocheck. */
const DISABLE_CHECKS_MAGIC_STRING = `\
// prettier-ignore
// eslint-disable-next-line
// @ts-nocheck
`;

export interface ExtractionWriterConfig {
  /**
   * The root directory of the project.
   * Mainly used to compute the relative path of the parsed files.
   */
  projectRoot: string;

  /**
   * The path to the directory where the extracted files will be saved.
   */
  extractionDir?: string;
}
