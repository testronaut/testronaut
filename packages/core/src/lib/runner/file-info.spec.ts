import { it } from 'vitest';
import { type FileHash } from './file-info';

it('enforces FileHash typing', () => {
  // @ts-expect-error branded type only via FileHash
  const _: FileHash = 'asdf';
});
