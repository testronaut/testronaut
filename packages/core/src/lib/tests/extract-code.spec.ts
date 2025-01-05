import { extractCode } from '../extract-code';
import { expect } from 'vitest';

it('should extract code', () => {
  expect(extractCode()).toBe('Nothing to see yet');
});
