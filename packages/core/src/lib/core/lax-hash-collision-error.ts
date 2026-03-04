export class LaxHashCollisionError extends Error {
  override name = 'LaxHashCollisionError';

  constructor(function1: string, function2: string) {
    super(`We were not able to safely differentiate the following functions:

---
${function1}
---
${function2}
---
Instead calling it via inPage,  assign a unique name to the function via inPageWithNamedFunction([unique name], ...).

Please create an issue on Testronaut's GitHub repo for further investigation: https://github.com/testronaut/testronaut/issues/new

Paste both functions into the issue description. Thank you!`);
  }
}
