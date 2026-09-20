# MLS EXPERIENCE REFINEMENT R1 — POST DEPLOY VERIFICATION

## Estado

**PASS — producción verificada**

Deployment run:

**35512350255**

Cloudflare Worker Version ID:

`dffa9299-7e60-4fdb-886b-05de128bdf1c`

Endpoint:

`https://llmchatmls.dpidiaz.workers.dev`

## Pre-deploy gates

Antes del deploy pasaron:

- `npm ci`
- `npm run test:chat-editorial`
- `npm run qa:baseline`
- `npm run predeploy`
- `npm run recovery:verify`
- `node --test test/deploy-contract.test.cjs`
- `npm run check`

## Evidencia de deploy

Wrangler reportó:

- Worker: `llmchatmls`
- deployment success;
- static assets publicados;
- triggers desplegados;
- Version ID `dffa9299-7e60-4fdb-886b-05de128bdf1c`.

## Smoke verification de producción

La verificación HTTP posterior al deploy confirmó:

- Home responde 200;
- skip link `Saltar al contenido principal`;
- navegación pública hacia `/virtuoso`;
- `/css/design-system.css` disponible;
- token `--mls-focus-color` disponible;
- Reader publicado contiene soporte `prefers-reduced-motion`;
- UX offline publicada contiene `Biblioteca disponible sin Internet`;
- `/data/related/manifest.json` disponible;
- related manifest:
  - standard `MLS R32`;
  - source `semantic-neighbors`;
  - 10 idiomas;
  - `corpusBuildId` correcto.

Resultado registrado:

`PRODUCTION_UXUI_R1_OK`

`corpusBuildId = 616bb41c03ee4676594cb323512b5ab4c52f3d4798e1975445723c1e957ec9fe`

## Verificación editorial

La Action editorial se comprobó sin crear lotes.

El diagnóstico FIFO read-only confirmó:

- canonical total: **10,133**;
- published articles: **10,133**;
- never materialized: **0**;
- safe eligible: **0**;
- orphan reservations: **0**;
- deferred: **0**;
- needs review: **0**;
- non-canonical jobs: **0**;
- non-canonical articles: **0**;
- missing ranges: **0**.

## Limpieza

El workflow temporal de despliegue fue eliminado inmediatamente después del éxito.

Estado final:

- workflows temporales R1: **0**
- deploy R1: **completo**
- producción: **verificada**
