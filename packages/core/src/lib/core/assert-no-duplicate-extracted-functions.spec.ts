import { describe } from 'vitest';
import { assertNoDuplicateExtractedFunctions } from './assert-no-duplicate-extracted-functions';
import { DuplicateExtractedFunctionsError } from './duplicate-extracted-functions.error';
import { fileAnalysisMother } from './file-analysis.mother';

describe(assertNoDuplicateExtractedFunctions.name, () => {
  it('throws if there are duplicate extracted functions', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo('src/my-component.spec.ts')
      .withNamedExtractedFunction('mount hello duplicate')
      .withNamedExtractedFunction('mount hello duplicate')
      .build();

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).toThrow(
      new DuplicateExtractedFunctionsError(
        '/my-project/src/my-component.spec.ts',
        ['mount hello duplicate']
      )
    );
  });

  it('throws if there is more than one anonymous function', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo('src/my-component.spec.ts')
      .withAnonymousExtractedFunction()
      .withAnonymousExtractedFunction()
      .build();

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).toThrow(
      new DuplicateExtractedFunctionsError(
        '/my-project/src/my-component.spec.ts',
        ['']
      )
    );
  });

  it('does not throw if there are no duplicate', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo('src/my-component.spec.ts')
      .withNamedExtractedFunction('mount hello')
      .withNamedExtractedFunction('mount bye')
      .withAnonymousExtractedFunction()
      .build();

    expect(() =>
      assertNoDuplicateExtractedFunctions(fileAnalysis)
    ).not.toThrow();
  });

  it('aggregates duplicates in a nice error message', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo('src/my-component.spec.ts')
      .withNamedExtractedFunction('mount hello duplicate')
      .withNamedExtractedFunction('mount hello duplicate')
      .withNamedExtractedFunction('mount bye duplicate')
      .withNamedExtractedFunction('mount bye duplicate')
      .withNamedExtractedFunction('mount ok')
      .withAnonymousExtractedFunction()
      .withAnonymousExtractedFunction()
      .build();

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).toThrow(
      `Extracted functions should be unique — unique name per file, or one anonymous call per file.
      File: /my-project/src/my-component.spec.ts.
      Duplicates: "mount hello duplicate", "mount bye duplicate", [anonymous call]`
    );
  });
});

function setUp() {
  return {
    mother: fileAnalysisMother.withProjectRoot('/my-project'),
  };
}
