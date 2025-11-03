import { parseMaxSupportedVersion } from './lib/ensure-playwright-is-installed';

describe('parseMaxSupportedVersion', () => {
  describe('valid range format', () => {
    it('should accept range with >= and <= and return upper bound major.minor', () => {
      const result = parseMaxSupportedVersion('>=1.36.0 <=1.56.0');
      expect(result).toEqual({ lower: '1.36.0', upper: '1.56.0' });
    });
  });

  describe('invalid range formats', () => {
    const invalidCases: Array<[string, string]> = [
      ['should reject caret range (^)', '^1.56.0'],
      ['should reject tilde range (~)', '~1.56.0'],
      ['should reject exact version', '1.56.0'],
      ['should reject range with only >= (no upper bound)', '>=1.36.0'],
      ['should reject range with only <= (no lower bound)', '<=1.56.0'],
      ['should reject range with > instead of >=', '>1.36.0 <=1.56.0'],
      ['should reject range with < instead of <=', '>=1.36.0 <2.0.0'],
      ['should reject range with both > and <', '>1.36.0 <2.0.0'],
      ['should reject range with OR (||) conditions', '^1.0.0 || ^2.0.0'],
      [
        'should reject complex range with multiple OR conditions',
        '>=1.30.0 <=1.40.0 || >=1.50.0 <=1.56.0',
      ],
      ['should reject wildcard (*)', '*'],
      ['should reject x-range (1.x)', '1.x'],
      ['should reject x-range (1.56.x)', '1.56.x'],
    ];

    for (const [description, input] of invalidCases) {
      it(description, () => {
        expect(() => parseMaxSupportedVersion(input)).toThrow();
      });
    }
  });
});
