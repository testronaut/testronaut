import * as ts from 'typescript';
import { createExtractedFunction } from '../core/file-analysis';
import { getInPageIdentifier } from '../core/in-page-identifier';
import { AnalysisContext } from './core';
import { getDeclaration } from './utils';

export interface InPageCall {
  node: ts.CallExpression;
  code: string;
}

export function visitInPageCalls(
  ctx: AnalysisContext,
  callback: (inPageCall: InPageCall) => void
) {
  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      if (getInPageVariant(ctx, node)) {
        const { code } = parseInPageArgs(ctx, node);
        callback({ code, node });
        return;
      }
    }

    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(ctx.sourceFile, visitor);
}

export class InvalidInPageCallError extends Error {
  override name = 'InvalidInPageCallError';
}

function getInPageVariant(
  ctx: AnalysisContext,
  callExpression: ts.CallExpression
): boolean {
  const expressionText = callExpression.expression.getText();

  if (expressionText === getInPageIdentifier()) {
    return true;
  }

  const declaration = getDeclaration(
    ctx.typeChecker,
    callExpression.expression
  );

  /* Identifier is an alias (e.g. `test(..., ({inPage: run}) => { run(...); })`). */
  if (
    declaration != null &&
    ts.isObjectBindingPattern(declaration.parent) &&
    declaration.parent.elements.at(0)?.propertyName?.getText() ===
      getInPageIdentifier()
  ) {
    return true;
  }

  return false;
}

function parseInPageArgs(
  ctx: AnalysisContext,
  node: ts.CallExpression
): { code: string } {
  const identifier = getInPageIdentifier();

  if (node.arguments.length === 0) {
    throw new InvalidInPageCallError(
      `\`${identifier}\` must have at least one argument`
    );
  }

  if (node.arguments.length > 2) {
    throw new InvalidInPageCallError(
      `\`${identifier}\` must have at most two arguments`
    );
  }

  const codeArg = node.arguments.at(-1);
  if (!ts.isFunctionLike(codeArg)) {
    throw new InvalidInPageCallError(
      `\`${identifier}\` function must be an inline function`
    );
  }

  return createExtractedFunction({
    code: codeArg.getText(ctx.sourceFile),
    importedIdentifiers: [],
    name: '',
  });
}
