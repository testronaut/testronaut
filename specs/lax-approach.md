# LAX Approach — Specification for Matching Extracted Functions Across Transpilers

## 1. Overview and Context

Testronaut extracts callbacks from `inPage(...)` calls into a file, which gets compiled by Angular and will be triggered in the browser during test execution.

Users have the option to apply a unique name to an `inPage` call, which would be **named function**. Testronaut would find that function in the browser safely via the name.

Without a unique name, the function is called an **anonymous function** and matching would be based on the code itself. The challenge is to match the compiled version of the Angular CLI with the compiled version of Playwright.

Transpilers often emit **syntactically different but equivalent** JS (commas, parens, formatting). So an exact matching algorithm based on tokens or just string equal very likely fails.

For example the original code could be `(message: string) => console.log(message);`. Playwright could transpile it into `message => console.log('Hello world');` and Angular into `(message) => console.log('Hello world')`.

The Playwright version removed the parenthises (from `(message)` to `message` and Angular CLI removed the `;`. Both differ from the original and both token and string-based matching approaches would fail.

We call the current appraoch "Lax Hashing" which is based on an approximation but comes with a collision detection, if the approximation would match two semantically different functions.

## Lax Hashing

The original function is transpiled and tokenized. Known tokens which could be added or removed by a transpiler are then skipped. We end up with tokens which a transpiler will always keep and which is a subset of the full tokens. Based on that subset of tokens, we generate a hash, which we call "Lax Hash" (from relaxed hash).

`(message: string) => console.log(message);` would get first transpiled into `(message) => console.log(message);` and the full tokens would be `['(', 'message', ')', '=>' 'console', '.', 'log', '(', 'message', ')', ';']`. The lax hashing would remove character like parenthesis, commas and semi-colons. So we end up with "laxed tokens" `['message', '=>', 'console', '.', 'log', 'message']`. That array would the be hased to a five character hash, which is the "Lax Hash".

If we apply the lax hashing to both Playwright's transpiled code and the original source code, we should have a guranteed match in theory.

The problem is that removed tokens have a semnatic meaning and we could end up matching two functions with different meaning.

For example following distinct functions would end up in the same lax hash:

- `(message) => console.log(message())`
- `(message) => console.log(message)`
- `(message) => [console.log, message]`
- `(message) => [, console.log, message]`

That scenario can be dealt with via collision detection. We apply lax hashing at code extraction and a second time, during test execution, when Playwright executes `inPage`. The collision detection happens during code extraction, which runs during the initialization of the test. That means the collision detection throws as early as possible.

Collision detection creates the hash for all tokens, which will include parenthises, commas, etc. If we have more than one extracted functions that end up with same the lax hash, exact matchin cannot be gurananteed, and Testronaut throws an error, telling the user to fallback to a named function.
Collision detection does not use the soure code because there could be differences because of whitespaces. The hashed tokenizer along transpiler gets rid of them.

## History

## Future Options

Today: **named** functions matched by user-supplied ID; **anonymous** allowed **one per file** only. Goal: **drop the one-anonymous-per-file limit** without requiring unique IDs — multiple anonymous `inPage` callbacks per file, matched automatically.

---

## 2. Alternatives Considered

**Exact match (string/tokens):** Transpile ourselves and match. **Problem:** commas, parens, trailing commas, etc. differ between transpilers → single-char difference breaks matching.

**Transpiler tweaks:** Special-case known differences. **Problem:** brittle; new TS/tooling versions add new quirks.

**AST-based matching:** **Problem:** too complex and slow.

**Tokenizer (fallback):** Full tokenization (proper tokens, not stripped LAX) + edge-case handling. Use as fallback or alternative. Benchmark vs LAX later; **start with LAX**.

**Minifiers / Prettiers (future):** Rewrite TS/JS in a standardized way → could give a **100%** solution. **Problem:** too expensive for test execution time.

---

## 3. The LAX Approach

**Idea:** The **`inPage`** fixture receives the function. We run **transpile → tokenize → generate LAX** (blacklist e.g. `(`, `)`, `,`) → **hash**. The LAX hash is the **stable key** for the function in the extracted file and at runtime. Intentionally approximate: two different functions could collide (same LAX). We add a **collision check** (§5).

**Where LAX runs:** **Playwright only.** We apply the pipeline to the function `inPage` receives. **Angular CLI** compiles our extracted file; we **do not** LAX Angular output. We key functions by LAX hash in that file; the app (dev or build) carries the mapping. At runtime we look up by LAX hash.

**Store vs discard:** **Store** LAX hash + function code. **For collision check only, then discard:** **full** fingerprint (transpile → tokenize → hash, no stripping). No raw source; pipeline avoids whitespace. Same LAX + different full form ⇒ fail; then discard full fingerprint.

---

## 4. Why LAX Works

LAX strips characters and hashes what’s left — it can look flaky. The **collision check** makes it safe: we never silently match the wrong function. We strip exactly the cosmetic noise (commas, parens, etc.), so same function ⇒ same LAX ⇒ same hash.

**Collision rule:** Same LAX hash + **different full form** (transpile → tokenize → hash, no stripping) within one file ⇒ **fail**. One implementation per LAX hash; we refuse when ambiguous.

**Trade-off:** We may reject valid files (collisions). Fail-safe over silently wrong; collisions expected rare.

---

## 5. Implementation Specification

**LAX pipeline (input = function from `inPage`):** (1) **Transpile** to JS (Playwright-side). (2) **Tokenize.** (3) **Generate LAX:** blacklist chars (e.g. `(`, `)`, `,`; set implementation-defined). (4) **Hash** the LAX string (e.g. SHA-256, truncate). Same LAX ⇒ same hash.

**Collision check (per file, before Angular CLI):** For each extracted function: LAX hash + **full** fingerprint (transpile → tokenize → hash, no stripping). Same LAX hash + different full fingerprint ⇒ **fail** before Angular CLI runs. Multiple anonymous per file only if all LAX hashes distinct. Then **discard** full fingerprint; **store** only LAX hash + code.

**Runtime:** Look up by LAX hash. We do not compute LAX from the app output; uniqueness is guaranteed by the collision check.

**Tokenizer fallback:** Optional full tokenization + edge-case handling; benchmark vs LAX later. **Ship LAX first.**

---

## 6. Examples

**6.1 Same function, cosmetic variation ⇒ same LAX**

```ts
(x) => {
  return x + 1;
};
```

Variants: `(x) => { return x + 1; }` vs `x => { return x + 1; }`. After LAX (blacklist `(`, `)`, `;`): both ⇒ `x => { return x + 1 }` ⇒ same hash ⇒ stable key.

**6.2 Two different functions ⇒ same LAX (collision)**

**A:** `(g, x) => g(x)` **B:** `(g) => (x) => g(x)`. With blacklist `(`, `)`, `,`: **A** ⇒ `g x => g x`, **B** ⇒ `g => x => g x` (differ). With a **broader** blacklist that also drops `=>`: both ⇒ `g x g x` ⇒ same LAX, **different** full form. **Fail.** User must disambiguate (e.g. name one).

**6.3 Minimal collision**

**A:** `(x) => x` **B:** `x => x`. Blacklist `(`, `)`: both ⇒ `x => x`. Same LAX, different full form ⇒ **fail.**

---

## 7. Summary

| Aspect           | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Goal**         | Match `inPage` callbacks to app; drop one-anonymous-per-file; no user IDs.                            |
| **LAX**          | Transpile → tokenize → LAX (blacklist) → hash. Playwright-side only; Angular compiles extracted file. |
| **Safety**       | Same LAX + different full form ⇒ fail. No wrong-targeting.                                            |
| **Trade-off**    | May reject valid files (collisions); fail-safe over silent misuse.                                    |
| **Alternatives** | Tokenizer fallback; minifiers/prettiers (100% but too slow).                                          |

**References:** `visit-run-in-browser-calls.ts`, `assert-no-duplicate-extracted-functions.ts`, `extraction-writer.ts`, `runner.ts`.
