import * as ts from 'typescript';
import { ExtractedFunctionRecord } from '../core/file-analysis';

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
 * e.g., `export const extractedFunctionsRecord = { 'anonymous': [() => {...}], 'named': { 'Bye!': () => {...}}}`
 */
export function generateExtractedFunctionsType(
  variableName: string,
  extractedFunctionsRecord: ExtractedFunctionRecord
): ts.VariableStatement {
  const anonymousFunctions = ts.factory.createPropertyAssignment(
    ts.factory.createStringLiteral('anonymous'),
    ts.factory.createArrayLiteralExpression(
      extractedFunctionsRecord.anonymous.map(({ code }) => ts.factory.createIdentifier(code), true)
    )
  );
  const namedFunctions = ts.factory.createPropertyAssignment(
    ts.factory.createStringLiteral('named'),
    ts.factory.createObjectLiteralExpression(
      Object.entries(extractedFunctionsRecord.named).map(([_, { code, name }]) =>
        ts.factory.createPropertyAssignment(
          ts.factory.createStringLiteral(name ?? ''),
          ts.factory.createIdentifier(code)
        )
      ),
      true
    )
  );
  const propertyAssignments = [anonymousFunctions, namedFunctions];

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
