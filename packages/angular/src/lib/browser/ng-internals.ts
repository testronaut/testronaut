import { Type } from '@angular/core';

export function getComponentOutputs(cmp: Type<unknown>) {
  const unveiledCmp = cmp as unknown as {
    ɵcmp?: { outputs: Record<string, unknown> };
  };

  if (!unveiledCmp.ɵcmp) {
    throw new Error(
      `Can't detect outputs for ${cmp.name}.
      Make sure it is a valid Angular component.
      If it is a dynamically defined component, make sure to include @angular/compiler in the test server.`
    );
  }

  return Object.keys(unveiledCmp.ɵcmp.outputs);
}
