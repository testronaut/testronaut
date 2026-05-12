# Follow-up: Remove `xxhashjs` dependency

## Context

`xxhashjs` was introduced primarily to support the lax-hashing module, which has been removed as part of the line-number function identification refactor. The dependency remains only for file-level hashing, which is not correctness-critical — it just needs to be deterministic.

## Remaining usages

- `packages/core/src/lib/runner/extraction-pipeline.ts` — `#computeFileHash` uses `h32`
- `packages/core/src/lib/infra/derive-port-from-seed.ts` — `derivePortFromSeed` uses `h32`
- `packages/core/src/lib/analyzer/analyze.ts` — `generateHash` uses `h32`

## Suggested replacement

Replace all three with `node:crypto`'s `createHash('sha256')`, which is already available in Node.js with no extra dependency:

```typescript
import { createHash } from 'node:crypto';

// File hash (8 hex chars, same visual length as current output):
createHash('sha256').update(content).digest('hex').slice(0, 8);

// Port derivation (needs a number in range):
const hashHex = createHash('sha256').update(seed).digest('hex').slice(0, 8);
const hashValue = parseInt(hashHex, 16);
```

After migration, remove `xxhashjs` and `@types/xxhashjs` from `packages/core/package.json`.

Note: changing the hash algorithm will produce different file hash values, which means any cached/persisted extraction artifacts will be invalidated on first run after the upgrade. This is acceptable — extraction reruns automatically.
