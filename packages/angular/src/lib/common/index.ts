import { Type } from '@angular/core';

export type BrowserMount = (
  cmp: Type<unknown>,
  opts?: { inputs?: Record<string, unknown> }
) => Promise<{ outputNames: string[] }>;
