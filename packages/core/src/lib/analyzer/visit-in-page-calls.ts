import * as ts from 'typescript';
import { createExtractedFunction } from '../core/file-analysis';
import {
  getInPageIdentifier,
  getInPageWithNamedFunctionIdentifier,
} from '../core/in-page-identifier';
import { AnalysisContext } from './core';
import { getDeclaration } from './utils';

export interface InPageCall {
  node: ts.CallExpression;
  code: string;
  name?: string;
}

type InPageVariant = 'inPage' | 'inPageWithNamedFunction';

export function visitInPageCalls(
  ctx: AnalysisContext,
  callback: (inPageCall: InPageCall) => void
) {
  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const variant = getInPageVariant(ctx, node);
      if (variant) {
        const { code, name } = parseInPageArgs(ctx, node, variant);
        callback({ code, name, node });
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
): InPageVariant | null {
  const expressionText = callExpression.expression.getText();

  /* Direct identifier match for `inPage`. */
  if (expressionText === getInPageIdentifier()) {
    return 'inPage';
  }

  /* Direct identifier match for `inPageWithNamedFunction`. */
  if (expressionText === getInPageWithNamedFunctionIdentifier()) {
    return 'inPageWithNamedFunction';
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
    return 'inPage';
  }

  /* Identifier is an alias for `inPageWithNamedFunction`. */
  if (
    declaration != null &&
    ts.isObjectBindingPattern(declaration.parent) &&
    declaration.parent.elements.at(0)?.propertyName?.getText() ===
      getInPageWithNamedFunctionIdentifier()
  ) {
    return 'inPageWithNamedFunction';
  }

  return null;
}

function parseInPageArgs(
  ctx: AnalysisContext,
  node: ts.CallExpression,
  variant: InPageVariant
): {
  code: string;
  name?: string;
} {
  const identifier =
    variant === 'inPage'
      ? getInPageIdentifier()
      : getInPageWithNamedFunctionIdentifier();

  if (node.arguments.length === 0) {
    throw new InvalidInPageCallError(
      `\`${identifier}\` must have at least one argument`
    );
  }

  if (variant === 'inPage') {
    /* `inPage` accepts: fn or data+fn (max 2 args) */
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
    });
  } else {
    /* `inPageWithNamedFunction` accepts: name+fn or name+data+fn (2-3 args) */
    if (node.arguments.length < 2) {
      throw new InvalidInPageCallError(
        `\`${identifier}\` must have at least two arguments: a name and a function`
      );
    }

    if (node.arguments.length > 3) {
      throw new InvalidInPageCallError(
        `\`${identifier}\` must have at most three arguments`
      );
    }

    const nameArg = node.arguments[0];
    if (!ts.isStringLiteralLike(nameArg)) {
      throw new InvalidInPageCallError(
        `\`${identifier}\` name must be a string literal`
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
      name: nameArg.text,
      importedIdentifiers: [],
    });
  }
}
