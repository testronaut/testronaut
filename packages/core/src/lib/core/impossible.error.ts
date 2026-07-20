export class ImpossibleError extends Error {
  override name = 'ImpossibleError';

  constructor(message: string) {
    super(`${message}

This seems to be a problem in Testronaut, not in your tests. Please file an issue so we can investigate:

${buildIssueUrl(message)}
`);
  }
}

function buildIssueUrl(message: string): string {
  const url = new URL('https://github.com/testronaut/testronaut/issues/new');
  url.searchParams.set(
    'body',
    `
## Error message

\`\`\`
${message}
\`\`\`

## Additional context

(Please add any relevant details about how you encountered this error.)`
  );

  return url.toString();
}
