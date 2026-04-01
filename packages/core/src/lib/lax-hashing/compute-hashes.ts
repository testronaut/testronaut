import { computeHash } from './internal/hash';

export const LAX_HASH_PREFIX = '__lax__';

export function isLaxHash(hash: string): boolean {
  return hash.startsWith(LAX_HASH_PREFIX);
}

export type Hashes = {
  laxHash: string;
  fullHash: string;
};

export function computeHashes(code: string): Hashes {
  const laxCode = code.replaceAll(/[()\s,;]/g, '').replaceAll(`"`, `'`);
  const laxHash = `${LAX_HASH_PREFIX}${computeHash(laxCode)}`;
  return {
    laxHash,
    fullHash: computeHash(code),
  };
}
