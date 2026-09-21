# MASTER LANGUAGE SYSTEM — Revision 32

MASTER LANGUAGE SYSTEM (MLS) is a multilingual grammar and language-reference portal covering 10 languages and 10,133 canonical entries.

The repository is designed so published editorial knowledge is recoverable from GitHub without depending on Cloudflare D1.

## Canonical architecture

The central rule is:

> GitHub preserves the knowledge. Infrastructure only serves it.

The canonical editorial corpus lives under `content/`.

Current canonical totals:

| Language | Entries |
| --- | ---: |
| Spanish of Guatemala | 930 |
| English | 766 |
| Brazilian Portuguese | 1,199 |
| Italian | 810 |
| French | 1,159 |
| German | 1,101 |
| Japanese | 1,027 |
| Traditional Chinese / Taiwan Mandarin | 1,016 |
| Korean | 1,094 |
| Russian | 1,031 |
| **Total** | **10,133** |

Published entry reads are served from static runtime assets generated from `content/`. D1 is not a source of truth for published articles.

## Repository roles

- `content/` — canonical R32 editorial corpus.
- `semantic/` — versioned BGE-M3 semantic index derived from the canonical corpus.
- `MLS R32 OVERLAY/` — current Worker and frontend source overlays.
- `scripts/` — deterministic builders, validators, installers and editorial tooling.
- `test/` — regression, canonical, search, Virtuoso and recovery contracts.
- `MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz` — sanitized application shell only. It must not contain canonical data, legacy wiki seeds or a bundled backend.
- `public/` and `src/` — generated deployment artifacts after `npm run predeploy`.

## Search architecture

MLS search is language-first.

Normal retrieval order:

1. exact/title signals;
2. canonical full-text index;
3. BGE-M3 semantic similarity;
4. optional Gemma 4 reranking through Virtuoso.

Full-text search remains available when Workers AI is unavailable.

The semantic index currently contains 10,669 chunks across all 10 languages, using `@cf/baai/bge-m3`, 1,024 dimensions and symmetric int8 quantization.

The semantic index is stored as static files rather than requiring a vector database.

## Virtuoso

Virtuoso is the MLS librarian.

Virtuoso:

- orients users inside the canonical library;
- uses candidates produced by lexical and semantic retrieval;
- validates every candidate against the canonical language catalog before model inference;
- uses `@cf/google/gemma-4-26b-a4b-it` only to rerank and explain a route;
- cannot create new entry IDs, titles or deep links;
- degrades to deterministic canonical candidates if Gemma 4 is unavailable.

Virtuoso is not Profesor IA. Profesor IA explains and teaches; Virtuoso navigates the library.

## Build

Requirements:

- Node.js 24 for CI parity;
- npm;
- Wrangler for Cloudflare deployment.

Install dependencies:

```bash
npm ci
```

Validate the canonical corpus:

```bash
npm run canonical:validate
```

Build all deployment assets:

```bash
npm run predeploy
```

The build recreates canonical runtime shards, compatibility data, full-text indexes, the published semantic index, Virtuoso and the Worker runtime. It first removes extracted bundled data/backend paths so the sanitized shell cannot become a hidden source of truth.

Validate disaster recovery and generated artifacts:

```bash
npm run recovery:verify
```

Validate the Cloudflare deployment package without deploying:

```bash
npm run check
```

## Disaster recovery from GitHub

A clean recovery should be possible with the repository plus the Cloudflare account configuration needed for deployment.

Recommended recovery sequence:

```bash
git clone <repository>
cd llmchatmls
npm ci
npm run canonical:validate
npm run predeploy
npm run recovery:verify
npm run test:chat-editorial
npm run check
```

After these commands pass, the static corpus, lexical search, semantic assets and Virtuoso frontend/backend have been reconstructed from repository state.

Deployment is a separate action:

```bash
npm run deploy
```

Runtime Cloudflare bindings and secrets are operational configuration and are not committed to the repository.

## Failure behavior

### D1 unavailable

Published entries continue to read from canonical static runtime assets. D1-dependent editorial or mutable operations may fail, but published knowledge must remain readable.

### Workers AI unavailable

- entry reading still works;
- full-text search still works;
- semantic query embedding falls back to lexical retrieval;
- Virtuoso falls back to validated canonical candidates;
- Profesor IA cannot generate a new AI explanation until Workers AI is available.

### Semantic index missing or stale

`scripts/publicar indice semantico.js` rejects an index whose corpus build ID does not match the current canonical manifest. A changed corpus therefore cannot silently publish stale embeddings.

Regenerate embeddings only when the canonical corpus changes:

```bash
npm run semantic:generate
```

Then validate and publish through the normal build.

## Canonical safety contracts

The repository tests enforce, among other things:

- exactly 10,133 R32 canonical entries;
- SHA-256 integrity against the canonical manifest;
- no `cloudflare-legacy` canonical providers;
- no published-reader D1 fallback;
- no legacy wiki-seed fallback;
- language filtering before search ranking;
- full-text operation without AI;
- semantic fallback to lexical search;
- semantic index/corpus build-ID agreement;
- Virtuoso candidate validation before Gemma 4;
- Virtuoso Gemma 4 non-thinking reranking;
- deterministic Virtuoso fallback;
- sanitized shell bundle;
- rebuild/recovery contract.

## UX/UI Experience Refinement R1

The first coordinated UX/UI refinement program is complete and deployed.

R1 covered navigation and orientation, reading continuity, semantic related discovery, a shared visual foundation, offline/resilience UX, AI experience, accessibility and responsive QA.

Final accessibility baseline: **23 PASS / 0 FAIL**.

Official documentation is available in:

- `docs/uxui-r1/INDEX.md`
- `docs/uxui-r1/FINAL REPORT.md`
- `docs/uxui-r1/RELEASE NOTES.md`
- `docs/uxui-r1/POST DEPLOY VERIFICATION.md`

R1 preserved the canonical `content/` corpus, Reader independence from D1/AI, lexical fallback and Virtuoso canonical fallback.

## Translator and Pronunciation

MLS includes a dedicated `/traductor` module on the current Translator feature branch.

The module is designed local-first:

- translation packs are downloaded only when the user chooses them;
- Bergamot/WASM provides local translation through an English pivot;
- online translation can use the existing Cloudflare Workers AI binding when local translation is unavailable;
- pronunciation and speech remain independent from Workers AI;
- speech controls include Normal, Slow and Repeat;
- Language Tools use a cache separate from App Shell and Offline Library.

Technical certification and architecture documentation live in `docs/translator/`.

Physical Safari/iPhone mode-airplane verification remains a manual release gate before the feature is considered fully certified for mobile offline speech.

## CI and production

`.github/workflows/produccion.yml` validates pull requests with:

1. dependency installation;
2. complete MLS test suite;
3. canonical predeploy build;
4. disaster recovery verification;
5. deployment contract tests;
6. Wrangler dry-run.

Production deployment remains an explicit workflow-dispatch action.

## Cost policy

The intended steady-state architecture is FREE ONLY whenever Cloudflare's free allocations are sufficient.

No paid external AI provider is a required fallback for published reading, search or Virtuoso navigation.

## Editorial source of truth

Do not edit generated `public/data/` assets as canonical content.

Editorial changes belong in `content/`, followed by validation and deterministic rebuilds.

If the canonical corpus changes, regenerate any derived index whose build ID no longer matches the canonical manifest.



## Future expansion and derived project standardization

MLS is also being documented as a reference implementation for future specialized knowledge systems. This is a future architectural direction, not a conversion of the current repository into a universal corpus.

Official recommendations:

- `docs/expansion y estandarizacion/01 Recomendacion de expansion MKS.md`
- `docs/expansion y estandarizacion/02 Estandar de proyectos derivados de MLS.md`

The central rule is that MLS remains an independent language product. Future knowledge systems should begin isolated by repository and domain; a shared MKS Core should only be extracted after reuse has been demonstrated by at least two real systems.

## MLS Watchdog Protocol

MLS includes a documented ChatGPT Scheduled-task watchdog protocol for keeping already-authorized workstreams moving across normal turn boundaries.

Canonical files:

- `docs/watchdogs/MLS Watchdog Protocol R1.md` — normative behavior and safety contract.
- `docs/watchdogs/MLS Watchdog Commands.json` — machine-readable command manifest.
- `docs/watchdogs/MLS Watchdog Registry.json` — privacy-safe logical group registry.
- `docs/watchdogs/MLS Watchdog Registry Schema.json` — registry schema.
- `AGENTS.md` — repository-level routing instructions for agents.

A watchdog group is scoped to one originating chat and uses a unique GROUP ID. The standard group contains three hourly Scheduled tasks offset at minute 00, 20 and 40, creating an effective 20-minute pulse while keeping each individual task within the hourly scheduling limit.

Supported commands include `MLS activar watchdogs`, `MLS detener watchdogs`, `MLS reactivar watchdogs`, `MLS estado watchdogs`, and the explicit global stop `MLS detener watchdogs global`.

The runtime Scheduled-task service is authoritative for live task state. GitHub stores the durable protocol and privacy-safe logical registry. Raw ChatGPT conversation IDs and Scheduled task IDs must not be committed to this public repository.

Account-level Scheduled task capacity still applies. Activation and reactivation must be atomic: if a complete three-task group cannot be enabled, the protocol must not intentionally leave a partial group.

