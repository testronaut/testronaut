export interface PageAdapter {
  /**
   * Wait for a function evaluated in the page to return a truthy value and keep reloading the page until it does.
   */
  waitForFunctionAndReload<R, Arg>(
    pageFunction: (args: Arg) => R,
    arg: Arg
  ): Promise<void>;

  /**
   * Evaluate a function in the page context.
   */
  evaluate<R, Arg>(pageFunction: (args: Arg) => R, arg: Arg): Promise<R>;
}
