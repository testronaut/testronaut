import { h32 } from 'xxhashjs';

export function computeHash(input: string): string {
  return h32(input, 0).toString(16);
}
