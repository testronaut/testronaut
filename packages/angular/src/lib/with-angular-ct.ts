import { dirname, join } from 'node:path/posix';
import { CtConfig, withCt } from '@playwright-ct/core';
import { readFileSync } from 'node:fs';
import { Transform } from '@playwright-ct/core';
import { AnalysisContext } from '@playwright-ct/core/devkit';
import * as ts from 'typescript';
import { createImportedIdentifier } from '@playwright-ct/core/devkit';
import { FileData } from 'packages/core/src/lib/analyzer/core';
import { mount } from './mount';

export interface CtAngularConfig {
  configPath: string;
}

/**
 * From Playwright's perspective, CT is just like any other
 * E2E test which uses a special set of fixtures. All the
 * integration, processes, etc. should work as for any other
 * E2E test. So the integration needs to be seamlessly. We
 * don't and cannot deviate from Playwright's "way".
 *
 * That means using a separate configuration is out of question,
 * since all the tooling should seemlessly be able to run CT.
 * It also doesn't make sense to provide a wrapper for `defineConfig`
 * because we don't want that changes in Playwright break CT or
 * make CT incompatible.
 *
 * That's why Playwright CT is integrated as own `projects`. This
 * allows users to use the existing E2E config and override, change
 * only those settings, which they want.
 */
export function withAngularCt({ configPath }: CtAngularConfig) {
  // SPIKE: users could provide the testServer config otherwise, we can
  // try to detect it from the configPath.
  const testServer = detectTestServerConfig(configPath);

  return withCt({
    configPath,
    testServer,
    transforms: [angularMountTransform()],
  });
}

function detectTestServerConfig(configPath: string): CtConfig['testServer'] {
  // SPIKE: assuming the Nx project.json is always there
  const nxProjectJson = readFileSync(
    join(dirname(configPath), 'project.json'),
    'utf-8'
  );
  const nxProjectConfig = JSON.parse(nxProjectJson);
  const nxProjectName = nxProjectConfig.name;
  return {
    extractionDir: 'ct-tests/generated',
    command: `nx serve ${nxProjectName} --configuration ct --port {port} --live-reload false`,
  };
}

function angularMountTransform(): Transform {
  return (fileData: FileData) => {
    const ctx = new AnalysisContext(fileData);

    const result = ts.transform(ctx.sourceFile, [transformer]);
    const printer = ts.createPrinter();
    return {
      content: printer.printNode(
        ts.EmitHint.Unspecified,
        result.transformed[0],
        ctx.sourceFile
      ),
      importedIdentifiers: [
        createImportedIdentifier({
          name: 'mount',
          module: '@playwright-ct/angular/browser',
        }),
      ],
    };
  };
}

function transformer<T extends ts.Node>(context: ts.TransformationContext) {
  const visitor = (node: ts.Node): ts.Node => {
    if (ts.isCallExpression(node) && node.expression.getText() === 'mount') {
      return ts.factory.updateCallExpression(
        node,
        ts.factory.createIdentifier('runInBrowser'),
        undefined,
        [
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createCallExpression(
              ts.factory.createIdentifier('mount'),
              undefined,
              node.arguments
            )
          ),
        ]
      );
    }
    return ts.visitEachChild(node, visitor, context);
  };
  return (node: T) => ts.visitNode(node, visitor);
}
