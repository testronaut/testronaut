/*
 * These utils will probably useful for other plugins as well.
 * In the future, depending on the usage, we should adapt them
 * and move them to `@testronaut/core/devkit`.
 */

import * as ts from 'typescript';

export function replacePropertyInObjectBinding(
  node: ts.ObjectBindingPattern,
  previousIdentifier: string,
  newIdentifier: string
) {
  return ts.factory.updateObjectBindingPattern(
    node,
    node.elements.map((el) => {
      if (el.name.getText() === previousIdentifier) {
        return ts.factory.updateBindingElement(
          el,
          el.dotDotDotToken,
          el.propertyName,
          ts.factory.createIdentifier(newIdentifier),
          el.initializer
        );
      }
      return el;
    })
  );
}

export function createCallExpression(name: string, args: ts.Expression[]) {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(name),
    undefined,
    args
  );
}

export function createArrowFunction(innerCallExpression: ts.CallExpression) {
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    innerCallExpression
  );
}

export function applyTransformVisitors(
  sourceFile: ts.SourceFile,
  visitors: {
    parameterObjectBindingPattern: MaybeTransformVisitor<ts.ObjectBindingPattern>;
    callExpression: MaybeTransformVisitor<ts.CallExpression>;
  }
): string {
  function tsTransformer<T extends ts.Node>(context: ts.TransformationContext) {
    const visitor = (node: ts.Node): ts.Node => {
      const visitChildren = () => ts.visitEachChild(node, visitor, context);

      if (ts.isParameter(node) && ts.isObjectBindingPattern(node.name)) {
        return (
          visitors.parameterObjectBindingPattern(node.name) ?? visitChildren()
        );
      }

      if (ts.isCallExpression(node)) {
        return visitors.callExpression(node) ?? visitChildren();
      }

      return visitChildren();
    };
    return (node: T) => ts.visitNode(node, visitor);
  }

  const result = ts.transform(sourceFile, [tsTransformer]);
  const printer = ts.createPrinter();

  return printer.printNode(
    ts.EmitHint.Unspecified,
    result.transformed[0],
    sourceFile
  );
}

interface MaybeTransformVisitor<NODE extends ts.Node> {
  /**
   * @returns The transformed node or undefined if no transformation is needed.
   */
  (node: NODE): NODE | undefined;
}
