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

  it('does not throw if there is more than one anonymous function', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo('src/my-component.spec.ts')
      .withAnonymousExtractedFunction()
      .withAnonymousExtractedFunction()
      .build();

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).not.toThrow()
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
      `Extracted function identifiers must be unique per file.
      File: /my-project/src/my-component.spec.ts.
      Duplicates: "mount hello duplicate", "mount bye duplicate"`
    );
  it('does not throw if duplicates are transform-generated names', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo(['__testronaut__mount_hello'])
      .withNamedExtractedFunction('__testronaut__mount_hello')
      .withNamedExtractedFunction('__testronaut__mount_hello')
      .build();
      

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).not.toThrow();
  });

  it('throws if user-named duplicates exist even with generated names', () => {
    const { mother } = setUp();

    const fileAnalysis = mother
      .withBasicInfo(['__testronaut__mount_hello'])
      .withNamedExtractedFunction('user-named')
      .withNamedExtractedFunction('user-named')
      .withNamedExtractedFunction('__testronaut__mount_hello')
      .withNamedExtractedFunction('__testronaut__mount_hello')
      .build();

    expect(() => assertNoDuplicateExtractedFunctions(fileAnalysis)).toThrow(
      new DuplicateExtractedFunctionsError(
        '/my-project/src/my-component.spec.ts',
        ['user-named']
      )
    );
  });
});

function setUp() {
  return {
    mother: fileAnalysisMother.withProjectRoot('/my-project'),
  };
}
