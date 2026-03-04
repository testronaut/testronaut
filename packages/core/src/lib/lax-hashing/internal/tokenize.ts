import * as ts from 'typescript';

const LAX_BLACKLIST = new Set<string>(['(', ')', ',', ';']);

type Tokens = {
  fullTokens: string[];
  laxTokens: string[];
};

export function tokenize(code: string): Tokens {
  const fullTokens: string[] = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true // skipTrivia
  );
  scanner.setText(code);

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = getTokenText(scanner, token, code);
    if (text !== '') {
      fullTokens.push(text);
    }
    token = scanner.scan();
  }

  const laxTokens = fullTokens.filter((t) => !LAX_BLACKLIST.has(t));
  return { fullTokens, laxTokens };
}

function getTokenText(
  scanner: ts.Scanner,
  token: ts.SyntaxKind,
  _code: string
): string {
  const text = scanner.getTokenText();

  if (
    token === ts.SyntaxKind.StringLiteral ||
    token === ts.SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    return normalizeStringLiteral(text);
  }

  return text;
}

/**
 * Normalizes string literals to canonical single-quote form.
 * 'hi', "hi", `hi` all produce the same token value.
 */
export function normalizeStringLiteral(text: string): string {
  if (text.length < 2) return text;

  const quote = text[0];
  if (quote !== "'" && quote !== '"' && quote !== '`') return text;

  const content = text.slice(1, -1);

  if (quote === '`') {
    return "'" + content.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  if (quote === '"') {
    return "'" + content.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  return text;
}
