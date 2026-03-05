/**
 * A constant identifier could have worked as well, but considering that
 * this is public API, a function is probably more future-proof in case
 * we have to dynamically decide which identifier to use for compatibility.
 */
export function getInPageIdentifier(): string {
  return 'inPage';
}

/**
 * The identifier for the named variant of `inPage`.
 * This should be used as a last resort when multiple `inPage` calls
 * need to be distinguished at runtime.
 */
export function getInPageWithNamedFunctionIdentifier(): string {
  return 'inPageWithNamedFunction';
}
