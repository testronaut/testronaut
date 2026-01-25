import {
  AnalysisContext,
  createImportedIdentifier,
  getRunInBrowserIdentifier,
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

/**
 * TODO: Add factory function to generate a transformer
 *
 * A transfomer consists of at least two parts:
 * - A visitor that transforms the code
 * - A fixture that is used to pass-through the `runInBrowser` call
 *
 * If we have a factory function, where both parts are created,
 * the transformer is self-contained and easier to maintain.
 */
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
          getRunInBrowserIdentifier()
        ),
      callExpression: (node) => {
        if (node.expression.getText() !== MOUNT_IDENTIFIER) {
          return;
        }

        mountFound = true;

        const { mountArgs, runInBrowserArgs } = processMountArgs(
          Array.from(node.arguments)
        );

        return createCallExpression(getRunInBrowserIdentifier(), [
          ...runInBrowserArgs,
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
      generatedNames: [],
    };
  },
};

function processMountArgs(args: ts.Expression[]): {
  runInBrowserArgs: ts.Expression[];
  mountArgs: ts.Expression[];
} {
  const isNamedCall = ts.isStringLiteral(args[0]);

  return {
    runInBrowserArgs: isNamedCall ? [args[0]] : [],
    mountArgs: isNamedCall ? args.slice(1) : args,
  };
}
