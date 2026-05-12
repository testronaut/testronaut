export const IN_PAGE_LINE_PREFIX = '__line__';

export function isLineBasedName(name: string): boolean {
  return name.startsWith(IN_PAGE_LINE_PREFIX);
}

export function lineBasedName(line: number): string {
  return `${IN_PAGE_LINE_PREFIX}${line}`;
}
