import * as ts from 'typescript';
import { getRunInBrowserIdentifier } from '../core/run-in-browser-identifier';
import { AnalysisContext } from './core';
import { getDeclaration } from './utils';

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

  /* Determine if first argument is a name (string literal) or data (object literal).
   * With 2 args: could be (name, fn) or (data, fn)
   * With 3 args: must be (name, data, fn) */
  let nameArg: ts.StringLiteralLike | undefined;
  if (node.arguments.length === 3) {
    /* Three arguments: (name, data, fn) - first must be a string literal */
    if (!ts.isStringLiteralLike(node.arguments[0])) {
      throw new InvalidRunInBrowserCallError(
        `\`${getRunInBrowserIdentifier()}\` name must be a string literal when providing data`
      );
    }
    nameArg = node.arguments[0];
  } else if (node.arguments.length === 2) {
    /* Two arguments: could be (name, fn) or (data, fn) */
    if (ts.isStringLiteralLike(node.arguments[0])) {
      /* First arg is a string literal → it's a name */
      nameArg = node.arguments[0];
    } else if (!ts.isObjectLiteralExpression(node.arguments[0])) {
      /* First arg is neither string nor object → invalid */
      throw new InvalidRunInBrowserCallError(
        `\`${getRunInBrowserIdentifier()}\` with two arguments: first argument must be a string literal (name) or object literal (data)`
      );
    }
    /* If first arg is an object literal, it's data (not a name), so nameArg remains undefined */
  }

  const codeArg = node.arguments.at(-1);
  if (!ts.isFunctionLike(codeArg)) {
    throw new InvalidRunInBrowserCallError(
      `\`${getRunInBrowserIdentifier()}\` function must be an inline function`
    );
  }

  return {
    code: codeArg.getText(ctx.sourceFile),
    name: nameArg?.text,
  };
}
