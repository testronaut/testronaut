export class MultiInPageOnSameLineError extends Error {
  override name = 'MultiInPageOnSameLineError';

  constructor(filePath: string, line: number) {
    super(
      `\`inPage\` calls must be on unique lines.

Line ${line} in ${filePath} has more than one \`inPage\` call. Move the conflicting calls to separate lines.`
    );
  }
}
