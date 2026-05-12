import { _parseCallerFrame } from './capture-in-page-call-location';

describe(_parseCallerFrame.name, () => {
  it('parses a Unix stack frame', () => {
    expect(
      _parseCallerFrame('    at file:///home/user/test.ts:10:5')
    ).toStrictEqual({ filePath: '/home/user/test.ts', line: 10 });
  });

  it('parses a Windows stack frame', () => {
    expect(
      _parseCallerFrame('    at file:///C:/Users/user/test.ts:10:5')
    ).toStrictEqual({ filePath: 'C:\\Users\\user\\test.ts', line: 10 });
  });

  it('returns null for a Node internal frame', () => {
    expect(
      _parseCallerFrame('    at node:internal/process:123:5')
    ).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(_parseCallerFrame(undefined)).toBeNull();
  });
});
