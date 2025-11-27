import { Type } from '@angular/core';
import { OutputValueMap } from '../common';

export function getComponentOutputs<CMP_TYPE extends Type<unknown>>(
  cmp: CMP_TYPE
): Array<keyof OutputValueMap<InstanceType<CMP_TYPE>>> {
  const unveiledCmp = cmp as unknown as {
    ɵcmp?: { outputs: Record<string, unknown> };
  };

  const metadata = unveiledCmp.ɵcmp;

  if (!metadata) {
    throw new Error(
      `Can't detect outputs for ${cmp.name}.
      Make sure it is a valid Angular component.
      If it is a dynamically defined component, make sure @angular/compiler is imported in the test server.`
    );
  }

  return Object.keys(metadata.outputs) as ReturnType<
    typeof getComponentOutputs<CMP_TYPE>
  >;
}
