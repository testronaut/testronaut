import { AnalysisContext } from './core';
import * as ts from 'typescript';
import { getDeclaration } from './utils';
import { createExtractedFunction } from '../extracted-function';

const _RUN_IN_BROWSER_IDENTIFIER = 'runInBrowser';

export interface RunInBrowserCall {
  node: ts.CallExpression;
  code: string;
  name?: string;
}

export function visitRunInBrowserCalls(
  ctx: AnalysisContext,
  callback: (runInBrowserCall: RunInBrowserCall) => void
) {
  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isRunInBrowserCall(ctx, node)) {
      const { code, name } = parseRunInBrowserArgs(ctx, node);
      callback({ code, name, node });
      return;
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(ctx.sourceFile, visitor);
}

export class InvalidRunInBrowserCallError extends Error {
  override name = 'InvalidRunInBrowserCallError';
}

function isRunInBrowserCall(
  ctx: AnalysisContext,
  callExpression: ts.CallExpression
): boolean {
  /* Identifier is `runInBrowser`. */
  if (callExpression.expression.getText() === _RUN_IN_BROWSER_IDENTIFIER) {
    return true;
  }

  const runInBrowserDeclaration = getDeclaration(
    ctx.typeChecker,
    callExpression.expression
  );

  /* Identifier is an alias (e.g. `test(..., ({runInBrowser: run}) => { run(...); })`). */
  return (
    runInBrowserDeclaration != null &&
    ts.isObjectBindingPattern(runInBrowserDeclaration.parent) &&
    runInBrowserDeclaration.parent.elements.at(0)?.propertyName?.getText() ===
      _RUN_IN_BROWSER_IDENTIFIER
  );
}

function parseRunInBrowserArgs(
  ctx: AnalysisContext,
  node: ts.CallExpression
): {
  code: string;
  name?: string;
} {
  if (node.arguments.length === 0) {
    throw new InvalidRunInBrowserCallError(
      '`runInBrowser` must have at least one argument'
    );
  }

  if (node.arguments.length > 2) {
    throw new InvalidRunInBrowserCallError(
      '`runInBrowser` must have at most two arguments'
    );
  }

  const nameArg = node.arguments.length > 1 ? node.arguments[0] : undefined;
  if (nameArg && !ts.isStringLiteralLike(nameArg)) {
    throw new InvalidRunInBrowserCallError(
      '`runInBrowser` name must be a string literal'
    );
  }

  const codeArg =
    node.arguments.length === 1 ? node.arguments[0] : node.arguments[1];
  if (!ts.isFunctionLike(codeArg)) {
    throw new InvalidRunInBrowserCallError(
      '`runInBrowser` function must be an inline function'
    );
  }

  return createExtractedFunction({
    code: codeArg.getText(ctx.sourceFile),
    name: nameArg?.text,
    importedIdentifiers: [],
  });
}
