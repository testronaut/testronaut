import * as ts from 'typescript';
import { createExtractedFunction } from '../core/file-analysis';
import { getInPageIdentifier } from '../core/in-page-identifier';
import { AnalysisContext } from './core';
import { getDeclaration } from './utils';

export interface InPageCall {
  node: ts.CallExpression;
  code: string;
  name?: string;
}

export function visitInPageCalls(
  ctx: AnalysisContext,
  callback: (inPageCall: InPageCall) => void
) {
  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isInPageCall(ctx, node)) {
      const { code, name } = parseInPageArgs(ctx, node);
      callback({ code, name, node });
      return;
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(ctx.sourceFile, visitor);
}

export class InvalidInPageCallError extends Error {
  override name = 'InvalidInPageCallError';
}

function isInPageCall(
  ctx: AnalysisContext,
  callExpression: ts.CallExpression
): boolean {
  /* Identifier is `inPage`. */
  if (callExpression.expression.getText() === getInPageIdentifier()) {
    return true;
  }

  const inPageDeclaration = getDeclaration(
    ctx.typeChecker,
    callExpression.expression
  );

  /* Identifier is an alias (e.g. `test(..., ({inPage: run}) => { run(...); })`). */
  return (
    inPageDeclaration != null &&
    ts.isObjectBindingPattern(inPageDeclaration.parent) &&
    inPageDeclaration.parent.elements.at(0)?.propertyName?.getText() ===
      getInPageIdentifier()
  );
}

function parseInPageArgs(
  ctx: AnalysisContext,
  node: ts.CallExpression
): {
  code: string;
  name?: string;
} {
  if (node.arguments.length === 0) {
    throw new InvalidInPageCallError(
      `\`${getInPageIdentifier()}\` must have at least one argument`
    );
  }

  if (node.arguments.length > 3) {
    throw new InvalidInPageCallError(
      `\`${getInPageIdentifier()}\` must have at most three arguments`
    );
  }

  const nameArg = node.arguments.length > 1 ? node.arguments[0] : undefined;
  if (nameArg && !ts.isStringLiteralLike(nameArg)) {
    throw new InvalidInPageCallError(
      `\`${getInPageIdentifier()}\` name must be a string literal`
    );
  }

  const codeArg = node.arguments.at(-1);
  if (!ts.isFunctionLike(codeArg)) {
    throw new InvalidInPageCallError(
      `\`${getInPageIdentifier()}\` function must be an inline function`
    );
  }

  return createExtractedFunction({
    code: codeArg.getText(ctx.sourceFile),
    name: nameArg?.text,
    importedIdentifiers: [],
  });
}
