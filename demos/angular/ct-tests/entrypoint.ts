const moduleImportFns = [
  () => import('./app/clicker.spec.ts'),
  () => import('./app/my-other-test.spec.ts'),
];

for (const moduleImportFn of moduleImportFns) {
  moduleImportFn().then(({ moduleGlobalId, extractedFunctionsMap }) => {
    for (const [name, fn] of Object.entries(extractedFunctionsMap)) {
      globalThis[moduleGlobalId][name] = fn;
    }
  });
}
