import * as ts from 'typescript';
import { Declaration } from 'typescript';

/**
 * Find the import declaration of a node in its ancestors.
 */
export function findImportDeclaration(
  node?: ts.Node
): ts.ImportDeclaration | undefined {
  while (node?.parent != null) {
    node = node.parent;
    if (ts.isImportDeclaration(node)) {
      return node;
    }
  }
  return undefined;
}

/**
 * Get the declaration of an identifier node.
 *
 * We use it to find the destructured parameter or the import declaration.
 *
 * e.g. `function f({a: alias}) { return alias; }` -> `{a: alias}`
 */
export function getDeclaration(
  typeChecker: ts.TypeChecker,
  node: ts.Node
): Declaration | undefined {
  return typeChecker.getSymbolAtLocation(node)?.getDeclarations()?.at(0);
}
