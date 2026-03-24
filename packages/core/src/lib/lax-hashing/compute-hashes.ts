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

/**
 * Options for {@link computeHashes}. Prefer the `boolean` second argument for `isAlreadyJs` only;
 * use this object when you need `useTokenizer`.
 */
export type ComputeHashesOptions = {
  isAlreadyJs?: boolean;
  /**
   * When false, hashes the transpiled JS string as a whole (no tokenization).
   * Intended for unit tests and experiments comparing behavior to the default path.
   */
  useTokenizer?: boolean;
};

function resolveSecondArg(
  second: boolean | ComputeHashesOptions | undefined
): { isAlreadyJs: boolean; useTokenizer: boolean } {
  if (second === undefined) {
    return { isAlreadyJs: false, useTokenizer: true };
  }
  if (typeof second === 'boolean') {
    return { isAlreadyJs: second, useTokenizer: true };
  }
  return {
    isAlreadyJs: second.isAlreadyJs ?? false,
    useTokenizer: second.useTokenizer ?? true,
  };
}

export function computeHashes(
  tsOrJsCode: string,
  second?: boolean | ComputeHashesOptions
): Hashes {
  const { isAlreadyJs, useTokenizer } = resolveSecondArg(second);
  const jsCode = isAlreadyJs ? tsOrJsCode : transpileToJs(tsOrJsCode);

  if (!useTokenizer) {
    const fullHash = computeHash([jsCode]);
    return {
      laxHash: `${LAX_HASH_PREFIX}${fullHash}`,
      fullHash,
    };
  }

  const { fullTokens, laxTokens } = tokenize(jsCode);
  const laxHash = `${LAX_HASH_PREFIX}${computeHash(laxTokens)}`;
  return {
    laxHash,
    fullHash: computeHash(fullTokens),
  };
}
