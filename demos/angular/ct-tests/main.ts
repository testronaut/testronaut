import 'zone.js';
import 'zone.js/testing';

import { getTestBed, TestBed, TestModuleMetadata } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

const normalizedExtractedFunctionsMap = Object.fromEntries(
  Object.values(extractedFunctionsMap).map((fn) => [
    normalizeFunction(fn.toString()),
    fn,
  ])
);

runFunction = (rawFnCode: string): unknown => {
  const fnCode = normalizeFunction(rawFnCode);
  console.debug('Searching for function %s', fnCode);
  const fn = Object.keys(normalizedExtractedFunctionsMap).find(
    (serializedFunction) => {
      console.group('RunFunction: Finding function to run');
      console.log('Extracted Code');
      console.log(serializedFunction);
      console.log('Code from Playwright');
      console.log(fnCode);
      console.groupEnd();

      return serializedFunction === fnCode;
    }
  );

  if (!fn) {
    console.error(`Was not able to find browser function ${fnCode}`);
    return false;
  }

  return normalizedExtractedFunctionsMap[fn]();
};

function setupTest(id: number) {
  const [Component, testModuleMetaData] = (
    renderComponentFunctionsMap as unknown as Record<
      number,
      [new () => unknown, TestModuleMetadata]
    >
  )[id];
  if (!Component) {
    console.error(`Component not found for id ${id}`);
  }
  const fixture =
    TestBed.configureTestingModule(testModuleMetaData).createComponent(
      Component
    );
  fixture.autoDetectChanges(true);
}

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// const fixture = TestBed.configureTestingModule({imports: [ClickComponent]}).createComponent(ClickComponent);
// fixture.autoDetectChanges(true)
