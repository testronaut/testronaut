import { AnalysisContext } from './core';
import * as ts from 'typescript';
import {
  createImportedIdentifier,
  type ImportedIdentifier,
} from '../core/file-analysis';
import { findImportDeclaration, getDeclaration } from './utils';

/**
 * Visits imported identifiers inside a `runInBrowser` call
 * (e.g. `import { something } from './something'`).
 */
export function visitImportedIdentifiers(
  ctx: AnalysisContext,
  runInBrowserCallNode: ts.CallExpression,
  callback: (importedIdentifier: ImportedIdentifier) => void
) {
  const visitor = (node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      const importedIdentifier = tryGetImportedIdentifier(ctx, node);

      if (importedIdentifier) {
        callback(importedIdentifier);
      }
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(runInBrowserCallNode, visitor);
}

/**
 * Visits dynamic imports inside a `runInBrowser` call (e.g. `import('./something')`).
 */
export function visitDynamicImports(
  runInBrowserCallNode: ts.CallExpression,
  callback: (dynamicImport: string) => void
) {
  const visitor = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      callback(node.arguments[0].text);
      return;
    }
    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(runInBrowserCallNode, visitor);
}

function tryGetImportedIdentifier(
  ctx: AnalysisContext,
  node: ts.Node
): ImportedIdentifier | undefined {
  const declaration = getDeclaration(ctx.typeChecker, node);
  const name = declaration?.getText(ctx.sourceFile);
  const moduleSpecifier = findImportDeclaration(declaration)?.moduleSpecifier;

  if (
    name != null &&
    moduleSpecifier != null &&
    ts.isStringLiteral(moduleSpecifier)
  ) {
    return createImportedIdentifier({ name, module: moduleSpecifier.text });
  }

  return undefined;
}
