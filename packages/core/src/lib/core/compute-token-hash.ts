import { tokenize } from './tokenize';
import { transpile } from './transpile';
import XXHash from 'xxhashjs';

/**
 * Computes hash via xxHash. We to Array:join for the
 * token array, since it is faster than an alternative
 * string concatenation inside {@link tokenize}.
 *
 * @param code - The TypeScript code to hash
 * @returns The hash of the code
 */
export function computeTokenHash(code: string): string {
  return XXHash.h64(tokenize(transpile(code)).join(''), 0).toString(16);
}
