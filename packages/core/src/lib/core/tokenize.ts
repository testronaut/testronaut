import * as ts from 'typescript';

/**
 * This version drops trailing commas because this
 * is a change that the Playwright transpiler makes.
 *
 * If we need to add further fixes, we need to use
 * more sophisticated approaches, but less performant
 * approaches.
 *
 * We would need something which regenerates the
 * code regardless of the changes, like Prettier...
 */

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

  return normalizeArrowFunctionParams(dropTrailingCommas(tokens));
}

/**
 * Normalizes arrow function parameters by removing parentheses around single parameters.
 *
 * Examples:
 * - `(data) => { ... }` → normalized to same tokens as `data => { ... }`
 * - `(a, b) => { ... }` → kept as-is (multiple parameters require parentheses)
 * - `({ data }) => { ... }` → kept as-is (destructuring requires parentheses)
 * - `() => { ... }` → kept as-is (empty parameters require parentheses)
 */
function normalizeArrowFunctionParams(tokens: string[]): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    // Check for pattern: ( identifier ) =>
    if (
      tokens[i] === '(' &&
      i + 3 < tokens.length &&
      tokens[i + 2] === ')' &&
      tokens[i + 3] === '=>'
    ) {
      const middleToken = tokens[i + 1];

      // Check if middle token is a simple identifier (not special tokens)
      // Valid identifiers don't contain: ',', '{', '}', '[', ']', '...', ':', '=', etc.
      const isSimpleIdentifier =
        middleToken &&
        middleToken !== ')' &&
        middleToken !== '{' &&
        middleToken !== '[' &&
        middleToken !== '...' &&
        middleToken !== ',' &&
        !/^[{}[\]():=,\.]$/.test(middleToken);

      if (isSimpleIdentifier) {
        // Single parameter with parentheses - remove them
        result.push(middleToken); // Keep the identifier
        result.push('=>'); // Keep the arrow
        i += 4; // Skip: '(', identifier, ')', '=>'
        continue;
      }
    }

    // Not a single-parameter arrow function pattern, keep token as-is
    result.push(tokens[i]);
    i++;
  }

  return result;
}

function dropTrailingCommas(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    const next = tokens[i + 1];
    const prev = result[result.length - 1];

    const isTrailingComma =
      curr === ',' &&
      (next === ']' || next === '}') &&
      prev !== undefined &&
      prev !== '[' &&
      prev !== '{' &&
      prev !== ',';

    if (isTrailingComma) continue;
    result.push(curr);
  }
  return result;
}
