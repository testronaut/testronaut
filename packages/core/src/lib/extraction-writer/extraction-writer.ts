import * as ts from 'typescript';
import { dirname, join, relative } from 'node:path/posix';

import { ExtractedFunction, FileAnalysis } from '../file-analysis';
import {
  FileDoesNotExistError,
  FileExistsError,
  FileSystem,
} from '../infra/file-system';
import { FileSystemImpl } from '../infra/file-system.impl';
import {
  generateExportedConstObjectLiteral,
  generateImportDeclaration,
} from './ast-factory';

/**
 * @deprecated 🚧 work in progress
 */
export class ExtractionWriter {
  readonly #projectRoot: string;
  readonly #destPath: string;
  readonly #entryPointPath: string;
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

    const extractedFunctionsImportLine =
      this.#generateExtractedFunctionsImportLine({
        hash: fileAnalysis.hash,
        path: relativePath,
      });

    await this.#upsertLine(
      this.#entryPointPath,
      relativePath,
      extractedFunctionsImportLine
    );
  }

  #generateExtractedFunctionsImportLine({
    hash,
    path,
  }: {
    hash: string;
    path: string;
  }) {
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
      const importedModule = importIdentifier.module;

      if (
        !(importedModule.startsWith('./') || importedModule.startsWith('../'))
      ) {
        return importIdentifier;
      }

      const srcFilePath = fileAnalysis.path;
      const relativePath = relative(
        dirname(destFilePath),
        join(dirname(srcFilePath), importIdentifier.module)
      );

      return {
        ...importIdentifier,
        module: relativePath,
      };
    });

    return importIdentifiers.map((importIdentifier) =>
      generateImportDeclaration(importIdentifier)
    );
  }

  async #upsertLine(path: string, match: string, replacement: string) {
    const content = await this.#tryReadFile(path);
    const lines = content?.split('\n') ?? [];

    let replaced = false;

    const newLines = lines.map((line) => {
      if (line.includes(match)) {
        replaced = true;
        return replacement;
      }

      return line;
    });

    if (!replaced) {
      newLines.push(replacement);
    }

    await this.#fileSystem.writeFile(path, newLines.join('\n'), {
      overwrite: true,
    });
  }

  async #tryReadFile(path: string): Promise<string | null> {
    try {
      return await this.#fileSystem.readFile(path);
    } catch (error) {
      if (error instanceof FileDoesNotExistError) {
        return null;
      }

      throw error;
    }
  }
}
