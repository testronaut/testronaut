import * as ts from 'typescript';
import { join, relative } from 'node:path/posix';

import { ExtractedFunction, FileAnalysis } from './file-analysis';
import { FileSystem } from './infra/file-system';
import { FileSystemImpl } from './infra/file-system.impl';

/**
 * @deprecated 🚧 work in progress
 */
export class ExtractionWriter {
  readonly #projectRoot: string;
  readonly #destPath: string;
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
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async init() {
    // TODO: create entrypoint.ts file if not exists
  }

  /**
   * @deprecated 🚧 work in progress
   */
  async write(fileAnalysis: FileAnalysis) {
    const entrypointPath = join(this.#destPath, 'entrypoint.ts');
    const relativePath = relative(this.#projectRoot, fileAnalysis.path);
    const path = join(this.#destPath, relativePath);

    await this.#fileSystem.writeFile(
      entrypointPath,
      this.#generateExtractedFunctionsImportLine({
        hash: fileAnalysis.hash,
        path: relativePath,
      })
    );

    await this.#fileSystem.writeFile(
      path,
      this.#generateExtractedFunctionsFile(fileAnalysis.extractedFunctions)
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

  #generateExtractedFunctionsFile(extractedFunctions: ExtractedFunction[]) {
    const propertyAssignments = extractedFunctions.map((extractedFunction) =>
      ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral(extractedFunction.name ?? ''),
        ts.factory.createIdentifier(extractedFunction.code)
      )
    );

    /* {'': () => {...}} */
    const objectLiteral = ts.factory.createObjectLiteralExpression(
      propertyAssignments,
      true
    );

    /* extractedFunctionsMap = {'': () => {...}} */
    const variableDeclaration = ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier('extractedFunctionsMap'),
      undefined,
      undefined,
      objectLiteral
    );

    /* export const extractedFunctionsMap = {'': () => {...}} */
    const variableStatement = ts.factory.createVariableStatement(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createVariableDeclarationList(
        [variableDeclaration],
        ts.NodeFlags.Const
      )
    );

    const sourceFile = ts.factory.createSourceFile(
      [variableStatement],
      ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None
    );

    return ts
      .createPrinter({ newLine: ts.NewLineKind.LineFeed })
      .printFile(sourceFile);
  }
}
