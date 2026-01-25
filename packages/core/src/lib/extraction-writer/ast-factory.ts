import * as ts from 'typescript';
import { ExtractedFunctionsRecord } from '../core/file-analysis';

const {
  createImportDeclaration,
  createImportClause,
  createNamedImports,
  createImportSpecifier,
  createIdentifier,
  createStringLiteral,
  createVariableStatement,
  createModifier,
  createVariableDeclarationList,
  createVariableDeclaration,
} = ts.factory;

export function generateImportDeclaration({
  module,
  identifiers,
}: {
  module: string;
  identifiers: string[];
}): ts.ImportDeclaration {
  return createImportDeclaration(
    undefined,
    createImportClause(
      false,
      undefined,
      createNamedImports(
        identifiers.map((identifier) =>
          createImportSpecifier(false, undefined, createIdentifier(identifier))
        )
      )
    ),
    createStringLiteral(module)
  );
}

/**
 * Generates a variable statement for the extracted functions.
 *
 * e.g., `export const extractedFunctions = [{ tokens: [...], name: '...' }]`
 */
export function generateExtractedFunctionsType(
  variableName: string,
  extractedFunctionsRecord: ExtractedFunctionsRecord
): ts.VariableStatement {
  const {
    createStringLiteral,
    createPropertyAssignment,
    createObjectLiteralExpression,
  } = ts.factory;
  const properties = ['anonymous', 'named'].map((type) => {
    const functions =
      extractedFunctionsRecord[type as keyof ExtractedFunctionsRecord];
    const literal = createObjectLiteralExpression(
      Object.entries(functions).map(([hashOrName, code]) =>
        createPropertyAssignment(
          createStringLiteral(hashOrName),
          createStringLiteral(code)
        )
      ),
      true
    );
    return createPropertyAssignment(createStringLiteral(type), literal);
  });

  /* extractedFunctionsRecord = { anonymous: { ... }, named: { ... } } */
  const variableDeclaration = createVariableDeclaration(
    createIdentifier(variableName),
    undefined,
    undefined,
    createObjectLiteralExpression(properties, true)
  );

  /* export const extractedFunctionsRecord = { anonymous: { ... }, named: { ... } } */
  return createVariableStatement(
    [createModifier(ts.SyntaxKind.ExportKeyword)],
    createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const)
  );
}
