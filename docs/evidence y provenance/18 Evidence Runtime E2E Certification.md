# R33 Evidence Runtime — Certificación E2E GitHub-native

Fecha: 2026-09-23 (America/Guatemala)  
Assignment: `MLS-GLOBAL-000718`  
Work item: `evidence-runtime-e2e-certification`  
Resultado: **PASS con observación de metadata no operativa**

## Alcance

Se certificó la cadena:

`GitHub Evidence canónico → generar evidence runtime github.js → public/data/evidence/by-code → lector MLS`

sin modificar Evidence, Sources ni deployment.

## Suite GitHub-native certificado

Última ejecución aplicable:

- Workflow: `R33 GitHub Native Tests`
- Run: `35939022468`
- Head SHA: `5fd5590d9175f6cbee130aedd219949dcc7fd476`
- Event: push a `main`
- Resultado: **success**
- Tests: **28**
- Pass: **28**
- Fail: **0**

El suite ejecutó:

`npm run test:r33-github-native`

incluyendo:

- `test/r33 evidence git.test.cjs`
- `test/r33 evidence farm.test.cjs`
- `test/evidence github runtime.test.cjs`
- `test/evidence reader integration.test.cjs`
- `test/evidence native reader.test.cjs`
- `scripts/R33 evidence git validate.cjs`
- `scripts/assert r33 github only.cjs`

## Vigencia del resultado

Se comparó el commit certificado `5fd5590d9175f6cbee130aedd219949dcc7fd476` con el commit de `main` usado como base de este assignment, `a4541c118a1858fc34f901aab559562db9965195`.

Resultado: **ningún archivo relevante al pipeline Evidence GitHub-native cambió** entre ambos commits.

Se comprobaron explícitamente las familias:

- `MLS R32 EDITORIAL/evidence git.js`
- `MLS R32 EDITORIAL/evidence git/**`
- `MLS R32 EDITORIAL/evidence farm core.js`
- `scripts/R33 evidence **`
- `scripts/generar evidence runtime github.js`
- `scripts/habilitar evidence lector.js`
- `MLS R32 OVERLAY/reader.js`
- tests R33/Evidence runtime/reader.

Por ello el resultado del suite sigue siendo aplicable al código E2E vigente.

## Métricas observadas en el suite

La ejecución certificada produjo:

- totalEntries: **125**
- verified: **125**
- reviewed: **0**
- sources: **54**
- cloudflareEditorialInteractions: **0**
- d1Reads: **0**
- d1Writes: **0**

El validador final reportó:

- architecture: `github-native`
- Cloudflare: `deployment-only`
- d1Editorial: `false`

## Generador público

`scripts/generar evidence runtime github.js`:

1. ejecuta `store.validateStore(root)`;
2. enumera directamente los Evidence JSON canónicos;
3. carga Sources desde GitHub;
4. genera APA 7 mediante `evidence apa.js`;
5. escribe un JSON estático por código en `public/data/evidence/by-code/`;
6. genera manifest/health derivados;
7. no usa `fetch`, D1, Wrangler ni Workers para la generación editorial.

El test `deployment Evidence is generated only from the GitHub-native store` pasó.

## Referencias APA y URL

Muestra certificada: `MLS-V10-0093`.

Estado actual:

- Evidence: `VERIFIED`
- evidenceRevision: 2
- review: `null`
- Source: `MLS-SRC-4FD19E7F1FE011BD0049`
- authority tier: A
- título: *Nueva gramática de la lengua española*
- autores institucionales: Real Academia Española; Asociación de Academias de la Lengua Española
- año: 2009
- publisher: Espasa
- canonicalUrl: `https://www.asale.org/obras-academicas/gramatica/nueva-gramatica-morfologia-y-sintaxis`

El renderer APA usa `renderApaReference(source)` y devuelve `text`, `markdown` y `url`. El generador público preserva esos tres campos por referencia.

El test runtime comprueba que la referencia pública de `MLS-V10-0093` existe y contiene la autoridad RAE/ASALE.

## Lector

El lector nativo:

- solicita `/data/evidence/by-code/<CODE>.json`;
- solo acepta payload con `sourceOfTruth === 'github'`;
- muestra el estado Evidence;
- muestra sección `Referencias`;
- indica `Formato APA 7`;
- ofrece `Abrir fuente` cuando existe URL;
- no depende de `/api/wiki/article/`, `/api/wiki/materialize/` ni del endpoint Evidence legacy.

Los tests de reader/runtime pasaron dentro del suite certificado.

## Observación — store-manifest histórico

`MLS R32 EDITORIAL/evidence git/store-manifest.json` conserva cifras de bootstrap:

- entries: 100
- sources: 42
- verified: 100

mientras que el store real validado contiene 125 / 54 / 125.

Esto **no afecta el pipeline operativo** porque:

- `evidence git.js` no consume `store-manifest.json`;
- `validateStore()` enumera directamente entries y Sources;
- el generador runtime enumera directamente los Evidence JSON;
- el manifest público se genera de forma derivada a partir del store real.

Se clasifica como **metadata histórica desactualizada, no bloqueo E2E**. Si se desea que el archivo represente estado vivo, debe tratarse en un work item separado para no mezclar bootstrap provenance con métricas dinámicas.

## Decisión

**PASS**

Queda certificado el flujo:

`GitHub Evidence → generación estática → referencias APA/URL → lector`

con:

- **125/125 VERIFIED**
- **0 REVIEWED**
- **54 Sources**
- **0 D1 editorial**
- **0 Cloudflare editorial**

Cloudflare permanece limitado a deployment/serving.
