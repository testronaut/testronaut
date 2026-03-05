import {
  AnalysisContext,
  createImportedIdentifier,
  getInPageIdentifier,
  getInPageWithNamedFunctionIdentifier,
  type Transform,
  type TransformResult,
} from '@testronaut/core/devkit';
import {
  applyTransformVisitors,
  createArrowFunction,
  createCallExpression,
  replacePropertyInObjectBinding,
} from './ast-utils';
import * as ts from 'typescript';

const MOUNT_IDENTIFIER = 'mount';

export const angularTransform: Transform = {
  name: 'angular',
  apply(fileData): TransformResult {
    const ctx = new AnalysisContext(fileData);
    let mountFound = false;

    const content = applyTransformVisitors(ctx.sourceFile, {
      parameterObjectBindingPattern: (node) =>
        replacePropertyInObjectBinding(
          node,
          MOUNT_IDENTIFIER,
          getInPageIdentifier()
        ),
      callExpression: (node) => {
        if (node.expression.getText() !== MOUNT_IDENTIFIER) {
          return;
        }

        mountFound = true;

        const { mountArgs, inPageArgs, isNamed } = processMountArgs(
          Array.from(node.arguments)
        );

        /* Use `inPageWithNamedFunction` for named calls, `inPage` for anonymous ones. */
        const inPageFn = isNamed
          ? getInPageWithNamedFunctionIdentifier()
          : getInPageIdentifier();

        return createCallExpression(inPageFn, [
          ...inPageArgs,
          createArrowFunction(
            createCallExpression(MOUNT_IDENTIFIER, mountArgs)
          ),
        ]);
      },
    });

    return {
      content,
      importedIdentifiers: mountFound
        ? [
            createImportedIdentifier({
              name: MOUNT_IDENTIFIER,
              module: '@testronaut/angular/browser',
            }),
          ]
        : [],
    };
  },
};

function processMountArgs(args: ts.Expression[]): {
  inPageArgs: ts.Expression[];
  mountArgs: ts.Expression[];
  isNamed: boolean;
} {
  const isNamedCall = ts.isStringLiteral(args[0]);

  return {
    inPageArgs: isNamedCall ? [args[0]] : [],
    mountArgs: isNamedCall ? args.slice(1) : args,
    isNamed: isNamedCall,
  };
}
