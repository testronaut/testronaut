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
    const value = scanner.getTokenValue();
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  return text;
}
