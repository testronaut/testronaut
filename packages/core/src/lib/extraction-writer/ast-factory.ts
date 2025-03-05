import * as ts from 'typescript';
import { ImportedIdentifier } from '../file-analysis';

export function generateImportDeclaration(
  importIdentifier: ImportedIdentifier
): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier(importIdentifier.name)
        ),
      ])
    ),
    ts.factory.createStringLiteral(importIdentifier.module)
  );
}

export function generateExportedConstObjectLiteral({
  variableName,
  value,
}: {
  variableName: string;
  value: Record<string, string>;
}): ts.VariableStatement {
  const propertyAssignments = Object.entries(value).map(([key, value]) =>
    ts.factory.createPropertyAssignment(
      ts.factory.createStringLiteral(key),
      ts.factory.createIdentifier(value)
    )
  );

  /* {'': () => {...}} */
  const objectLiteral = ts.factory.createObjectLiteralExpression(
    propertyAssignments,
    true
  );

  /* extractedFunctionsMap = {'': () => {...}} */
  const variableDeclaration = ts.factory.createVariableDeclaration(
    ts.factory.createIdentifier(variableName),
    undefined,
    undefined,
    objectLiteral
  );

  /* export const extractedFunctionsMap = {'': () => {...}} */
  return ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [variableDeclaration],
      ts.NodeFlags.Const
    )
  );
}
