import { h32 } from 'xxhashjs';

export function computeHash(tokens: string[]): string {
  const input = tokens.join('');
  return h32(input, 0).toString(16);
}
