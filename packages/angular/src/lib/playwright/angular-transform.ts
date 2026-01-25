import {
  AnalysisContext,
  computeTokenHash,
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
    const generatedNames = new Set<string>();

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

        const { mountArgs, runInBrowserArgs, generatedName } = processMountArgs(
          Array.from(node.arguments),
          ctx.sourceFile
        );

        if (generatedName) {
          generatedNames.add(generatedName);
        }

        return createCallExpression(getRunInBrowserIdentifier(), [
          ...(generatedName
            ? [ts.factory.createStringLiteral(generatedName)]
            : runInBrowserArgs),
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
      generatedNames,
    };
  },
};

function processMountArgs(
  args: ts.Expression[],
  sourceFile: ts.SourceFile
): {
  runInBrowserArgs: ts.Expression[];
  mountArgs: ts.Expression[];
  generatedName?: string;
} {
  const isNamedCall = ts.isStringLiteral(args[0]);

  if (isNamedCall) {
    /* User provided a name, use it as-is. */
    return {
      runInBrowserArgs: [args[0]],
      mountArgs: args.slice(1),
    };
  }

  /* Generate deterministic name from mount arguments for anonymous functions.
   * Wrap arguments in mount(...) to make valid TypeScript for transpile(). */
  const mountArgsText = args.map((arg) => arg.getText(sourceFile)).join(', ');
  const mountCallText = `${MOUNT_IDENTIFIER}(${mountArgsText})`;
  const hash = computeTokenHash(mountCallText);
  const generatedName = `__testronaut__${hash}`;

  return {
    runInBrowserArgs: [],
    mountArgs: args,
    generatedName,
  };
}
