export class UnmatchedFunctionError extends Error {
  override name = 'UnmatchedFunctionError';

  constructor(
    filePath: string,
    functionName: string | undefined,
    tokens: string[]
  ) {
    const namePart = functionName
      ? ` with the name "${functionName}"`
      : ' (anonymous)';
    const tokensPreview = tokens.slice(0, 20).join(', ');
    const tokensSuffix = tokens.length > 20 ? ', ...' : '';

    super(
      `Could not uniquely match \`runInBrowser\` function${namePart} in file: ${filePath}

Tokens: [${tokensPreview}${tokensSuffix}]

To fix this, add a unique ID to your \`runInBrowser\` call:
  runInBrowser('unique-id', () => { ... });

If you believe this is a false positive, please file an issue at:
  https://github.com/testronaut/testronaut/issues

Include details about your use case so we can improve function matching.`
    );
  }
}
