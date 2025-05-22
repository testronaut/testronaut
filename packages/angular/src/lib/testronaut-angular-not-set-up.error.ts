export class TestronautAngularNotSetUpError extends Error {
  override name = 'TestronautAngularNotSetUpError';

  constructor() {
    super(
      'Testronaut Angular is not set up. Please call `setUpTestronautAngular()` in the `main.ts` or your test server.'
    );
  }
}
