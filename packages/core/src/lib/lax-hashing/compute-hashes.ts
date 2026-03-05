import { computeHash } from './internal/hash';
import { tokenize } from './internal/tokenize';
import { transpileToJs } from './internal/transpile';

export const LAX_HASH_PREFIX = '__lax__';

export function isLaxHash(hash: string): boolean {
  return hash.startsWith(LAX_HASH_PREFIX);
}

export type Hashes = {
  laxHash: string;
  fullHash: string;
};

export function computeHashes(tsOrJsCode: string, isAlreadyJs = false): Hashes {
  const jsCode = isAlreadyJs ? tsOrJsCode : transpileToJs(tsOrJsCode);
  const { fullTokens, laxTokens } = tokenize(jsCode);
  const laxHash = `${LAX_HASH_PREFIX}${computeHash(laxTokens)}`;
  return {
    laxHash,
    fullHash: computeHash(fullTokens),
  };
}
