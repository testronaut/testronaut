import { test as base } from '@testronaut/core';

export { defineConfig, devices, expect } from '@testronaut/core';
export { withTestronautAngular } from './lib/playwright/with-testronaut-angular';

export const test = base.extend<Record<string, never>>({});
