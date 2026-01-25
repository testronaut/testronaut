import * as ts from 'typescript';

/**
 * Tokenizes code into an array of meaningful tokens.
 * Used to create a normalized representation of code for matching purposes.
 *
 * @param code - The TypeScript code to tokenize
 * @returns An array of token strings
 *
 * @example
 * ```ts
 * import { tokenize } from '@run-in-browser/core';
 * const tokens = tokenize('function hello(): void { console.log("Hello"); }');
 * // Returns: ['function', 'hello', '(', ')', ':', 'void', '{', 'console', '.', 'log', '(', 'Hello', ')', ';', '}']
 * ```
 */
export function tokenize(code: string): string[] {
  if (!code.trim()) {
    return [];
  }

  const tokens: string[] = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true, // skipTrivia: skip whitespace and comments to normalize
    ts.LanguageVariant.Standard,
    code
  );

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const tokenText = scanner.getTokenText();
    const tokenString =
      token === ts.SyntaxKind.StringLiteral ||
      token === ts.SyntaxKind.NumericLiteral ||
      token === ts.SyntaxKind.BigIntLiteral
        ? scanner.getTokenValue() ?? tokenText
        : tokenText;

    if (tokenString) {
      tokens.push(tokenString);
    }

    token = scanner.scan();
  }

  return tokens;
}
