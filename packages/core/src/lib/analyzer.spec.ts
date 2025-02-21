import { describe } from 'vitest';
import { Analyzer } from './analyzer';

describe(Analyzer.name, () => {
  it.todo('extracts `runInBrowser` sync arrow function');

  it.todo('extracts `runInBrowser` async arrow function');

  it.todo('extracts `runInBrowser` function call');

  it.todo('extracts `runInBrowser` async function call');

  it.todo('extracts `runInBrowser` outside test: in beforeEach');

  it.todo('extracts `runInBrowser` outside test: in a function');

  it.todo('extracts named `runInBrowser`');

  it.todo('fails if `runInBrowser` name is not a string literal');

  it.todo('extracts aliased `runInBrowser`');

  it.todo('extracts imported identifiers used in `runInBrowser`');
});
