import { AnalysisContext } from './core';
import * as ts from 'typescript';
import {
  createImportedIdentifier,
  ImportedIdentifier,
} from '../core/file-analysis';
import { findImportDeclaration, getDeclaration } from './utils';

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
