import { tokenize } from './tokenize';
import { transpile } from './transpile';
import XXHash from 'xxhashjs';

/**
 * Computes hash via xxHash. We to Array:join for the
 * token array, since it is faster than an alternative
 * string concatenation inside {@link tokenize}.
 *
 * @param code - The TypeScript code to hash
 * @returns The hash of the code and the tokens
 */
export function computeTokenHash(code: string): {
  hash: string;
  tokens: string[];
} {
  const tokens = tokenize(transpile(code));
  const hash = XXHash.h64(tokens.join(''), 0).toString(16);

  return { hash, tokens };
}
