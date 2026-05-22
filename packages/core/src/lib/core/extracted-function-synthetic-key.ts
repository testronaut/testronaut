declare const extractedFunctionSyntheticKeyBrand: unique symbol;

export type ExtractedFunctionSyntheticKey = string & {
  readonly [extractedFunctionSyntheticKeyBrand]: typeof extractedFunctionSyntheticKeyBrand;
};

export function toExtractedFunctionSyntheticKey({
  line,
}: {
  line: number;
}): ExtractedFunctionSyntheticKey {
  return `line:${line + 1}` as ExtractedFunctionSyntheticKey;
}
