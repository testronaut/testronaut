import { computeHash } from './internal/hash';
import { transpileToJs } from './internal/transpile';

export const LAX_HASH_PREFIX = '__lax__';

/**
 * Characters removed from transpiled JS before computing laxHash: parentheses, comma,
 * semicolon, and single quote, double quote, and backtick (so quote style often matches
 * across transpilers). Same-file ambiguity is separated with `fullHash` on the unstripped
 * transpiled string.
 */
const LAX_BLACKLIST = ['(', ')', ',', ';', "'", '"', '`'] as const;

function stripLaxBlacklist(jsCode: string): string {
  let result = jsCode;
  for (const char of LAX_BLACKLIST) {
    result = result.split(char).join('');
  }
  return result;
}

export function isLaxHash(hash: string): boolean {
  return hash.startsWith(LAX_HASH_PREFIX);
}

export type Hashes = {
  laxHash: string;
  fullHash: string;
};

export function computeHashes(
  code: string,
  { skipTranspilation = false }: { skipTranspilation?: boolean } = {}
): Hashes {
  const jsCode = skipTranspilation ? code : transpileToJs(code);
  const laxHashInput = stripLaxBlacklist(jsCode.replace(/\s+/g, ''));
  const laxHash = `${LAX_HASH_PREFIX}${computeHash(laxHashInput)}`;
  return {
    laxHash,
    fullHash: computeHash(jsCode),
  };
}
