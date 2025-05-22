import * as ts from 'typescript';
import { getRunInBrowserIdentifier } from '../core/run-in-browser-identifier';
import { createExtractedFunction } from '../core/file-analysis';
import { AnalysisContext } from './core';
import { getDeclaration } from './utils';

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
  if (callExpression.expression.getText() === getRunInBrowserIdentifier()) {
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
      getRunInBrowserIdentifier()
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
      `\`${getRunInBrowserIdentifier()}\` must have at least one argument`
    );
  }

  if (node.arguments.length > 3) {
    throw new InvalidRunInBrowserCallError(
      `\`${getRunInBrowserIdentifier()}\` must have at most three arguments`
    );
  }

  const nameArg = node.arguments.length > 1 ? node.arguments[0] : undefined;
  if (nameArg && !ts.isStringLiteralLike(nameArg)) {
    throw new InvalidRunInBrowserCallError(
      `\`${getRunInBrowserIdentifier()}\` name must be a string literal`
    );
  }

  const codeArg = node.arguments.at(-1);
  if (!ts.isFunctionLike(codeArg)) {
    throw new InvalidRunInBrowserCallError(
      `\`${getRunInBrowserIdentifier()}\` function must be an inline function`
    );
  }

  return createExtractedFunction({
    code: codeArg.getText(ctx.sourceFile),
    name: nameArg?.text,
    importedIdentifiers: [],
  });
}
