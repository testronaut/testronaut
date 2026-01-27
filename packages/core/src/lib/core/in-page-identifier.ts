/**
 * A constant identifier could have worked as well, but considering that
 * this is public API, a function is probably more future-proof in case
 * we have to dynamically decide which identifier to use for compatibility.
 */
export function getInPageIdentifier(): string {
  return 'inPage';
}
