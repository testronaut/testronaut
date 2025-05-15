import * as ts from 'typescript';

export function generateImportDeclaration({
  module,
  identifiers,
}: {
  module: string;
  identifiers: string[];
}): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        identifiers.map((identifier) =>
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(identifier)
          )
        )
      )
    ),
    ts.factory.createStringLiteral(module)
  );
}

/**
 * Generates a variable statement for the extracted functions.
 *
 * e.g., `export const extractedFunctionsRecord = {'': () => {...}}`
 */
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

  /* extractedFunctionsRecord = {'': () => {...}} */
  const variableDeclaration = ts.factory.createVariableDeclaration(
    ts.factory.createIdentifier(variableName),
    undefined,
    undefined,
    objectLiteral
  );

  /* export const extractedFunctionsRecord = {'': () => {...}} */
  return ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [variableDeclaration],
      ts.NodeFlags.Const
    )
  );
}
