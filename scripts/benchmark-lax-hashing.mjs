#!/usr/bin/env node

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requireFromCore = createRequire(
  path.resolve(__dirname, '../packages/core/package.json')
);
const { h32 } = requireFromCore('xxhashjs');
const LAX_BLACKLIST = new Set(['(', ')', ',', ';']);

const iterations = getPositiveIntArg('--iterations', 10_000);
const warmupIterations = getPositiveIntArg('--warmup', 500);

const snippets = [
  {
    name: 'single-arg arrow',
    code: `(message: string) => console.log(message);`,
  },
  {
    name: 'call-vs-value-sensitive',
    code: `() => (message) => console.log(message())`,
  },
  {
    name: 'quotes-and-semicolons',
    code: `() => { console.log("hello world"); console.log('done'); };`,
  },
  {
    name: 'async-playwright-style',
    code: `async ({ page }) => {
  const label = "hello world";
  await page.locator('button').click();
  return label;
}`,
  },
  {
    name: 'object-and-optional-chaining',
    code: `({ items }: { items: string[] }) =>
  items
    .map((item, index) => ({ index, value: item?.trim?.() ?? '' }))
    .filter(Boolean)`,
  },
  {
    name: 'template-literal',
    code: `() => console.log(\`hello \${'world'}\`)`,
  },
];

const transpiledBySnippet = new Map(
  snippets.map((snippet) => [snippet.name, transpileToJs(snippet.code)])
);

const rows = snippets.map((snippet) => benchmarkSnippet(snippet));
const aggregateRow = benchmarkSuite(snippets);

printHeader();
for (const row of rows) {
  printRow(row);
}
printDivider();
printRow(aggregateRow);

function benchmarkSnippet(snippet) {
  const transpiled = transpiledBySnippet.get(snippet.name);

  const transpile = bench(() => transpileToJs(snippet.code));
  const regexStage = bench(() => hashRegexPipeline(transpiled));
  const tokenizerStage = bench(() => hashTokenizerPipeline(transpiled));

  const regexTotal = bench(() => hashRegexPipeline(transpileToJs(snippet.code)));
  const tokenizerTotal = bench(() =>
    hashTokenizerPipeline(transpileToJs(snippet.code))
  );

  return {
    label: snippet.name,
    codeLength: snippet.code.length,
    transpiledLength: transpiled.length,
    transpile,
    regexStage,
    regexTotal,
    tokenizerStage,
    tokenizerTotal,
  };
}

function benchmarkSuite(allSnippets) {
  const transpiledEntries = allSnippets.map((snippet) => ({
    snippet,
    transpiled: transpiledBySnippet.get(snippet.name),
  }));

  const transpile = bench(() => {
    for (const { snippet } of transpiledEntries) {
      transpileToJs(snippet.code);
    }
  }, allSnippets.length);

  const regexStage = bench(() => {
    for (const { transpiled } of transpiledEntries) {
      hashRegexPipeline(transpiled);
    }
  }, allSnippets.length);

  const tokenizerStage = bench(() => {
    for (const { transpiled } of transpiledEntries) {
      hashTokenizerPipeline(transpiled);
    }
  }, allSnippets.length);

  const regexTotal = bench(() => {
    for (const { snippet } of transpiledEntries) {
      hashRegexPipeline(transpileToJs(snippet.code));
    }
  }, allSnippets.length);

  const tokenizerTotal = bench(() => {
    for (const { snippet } of transpiledEntries) {
      hashTokenizerPipeline(transpileToJs(snippet.code));
    }
  }, allSnippets.length);

  return {
    label: 'all snippets',
    codeLength: allSnippets.reduce((sum, snippet) => sum + snippet.code.length, 0),
    transpiledLength: transpiledEntries.reduce(
      (sum, entry) => sum + entry.transpiled.length,
      0
    ),
    transpile,
    regexStage,
    regexTotal,
    tokenizerStage,
    tokenizerTotal,
  };
}

function bench(fn, opsPerIteration = 1) {
  let checksum = 0;

  for (let i = 0; i < warmupIterations; i++) {
    checksum += consume(fn());
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    checksum += consume(fn());
  }
  const end = process.hrtime.bigint();

  const operationCount = iterations * opsPerIteration;
  const elapsedNs = Number(end - start);

  return {
    elapsedMs: elapsedNs / 1e6,
    perOpUs: elapsedNs / operationCount / 1e3,
    checksum,
  };
}

function consume(value) {
  if (typeof value === 'string') {
    return value.length;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length;
  }

  return 1;
}

function transpileToJs(code) {
  return ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      esModuleInterop: true,
    },
  }).outputText;
}

function hashRegexPipeline(jsCode) {
  const laxCode = jsCode
    .replace(/\s/g, '')
    .replace(/;/g, '')
    .replace(/['"`]/g, "'")
    .replace(/\((?!\))/g, '')
    .replace(/(?<!\()\)/g, '');

  return computeHash(laxCode);
}

function hashTokenizerPipeline(jsCode) {
  const { laxTokens } = tokenize(jsCode);
  return computeHash(laxTokens.join(''));
}

function tokenize(code) {
  const fullTokens = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true // skipTrivia
  );
  scanner.setText(code);

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = getTokenText(scanner, token);
    if (text !== '') {
      fullTokens.push(text);
    }
    token = scanner.scan();
  }

  const laxTokens = fullTokens.filter(
    (tokenText) => !LAX_BLACKLIST.has(tokenText)
  );

  return { fullTokens, laxTokens };
}

function getTokenText(scanner, token) {
  if (
    token === ts.SyntaxKind.StringLiteral ||
    token === ts.SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    const value = scanner.getTokenValue();
    return "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  return scanner.getTokenText();
}

function computeHash(input) {
  return h32(Buffer.from(input), 0).toString(16);
}

function printHeader() {
  console.log(
    `Benchmarking lax-hash pipelines with ${iterations.toLocaleString()} iterations per measurement`
  );
  console.log(
    `Warmup: ${warmupIterations.toLocaleString()} iterations | snippets: ${snippets.length}`
  );
  console.log(
    'Whole-pipeline times are end-to-end measurements. Stage timings are measured standalone for the split.'
  );
  console.log('');
}

function printRow(row) {
  const transpileMs = formatMs(row.transpile.elapsedMs);
  const regexStageMs = formatMs(row.regexStage.elapsedMs);
  const tokenizerStageMs = formatMs(row.tokenizerStage.elapsedMs);
  const regexTotalMs = formatMs(row.regexTotal.elapsedMs);
  const tokenizerTotalMs = formatMs(row.tokenizerTotal.elapsedMs);

  console.log(`${row.label}`);
  console.log(
    `  code length: ${row.codeLength} chars | transpiled length: ${row.transpiledLength} chars`
  );
  console.log(
    `  current regex pipeline    whole ${regexTotalMs} | standalone transpiler ${transpileMs} + regex/hash ${regexStageMs}`
  );
  console.log(
    `  tokenizer pipeline       whole ${tokenizerTotalMs} | standalone transpiler ${transpileMs} + tokenizer/hash ${tokenizerStageMs}`
  );
  console.log(
    `  per-op current ${formatUs(row.regexTotal.perOpUs)} | tokenizer ${formatUs(
      row.tokenizerTotal.perOpUs
    )} | slowdown ${formatRatio(
      row.tokenizerTotal.perOpUs / row.regexTotal.perOpUs
    )}`
  );
  console.log('');
}

function printDivider() {
  console.log('------------------------------------------------------------');
}

function formatMs(value) {
  return `${value.toFixed(1)}ms`;
}

function formatUs(value) {
  return `${value.toFixed(2)}us`;
}

function formatRatio(value) {
  return `${value.toFixed(2)}x`;
}

function getPositiveIntArg(name, fallback) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  if (!arg) {
    return fallback;
  }

  const parsed = Number.parseInt(arg.split('=')[1], 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`${name} must be a positive integer.`);
    process.exit(1);
  }

  return parsed;
}
