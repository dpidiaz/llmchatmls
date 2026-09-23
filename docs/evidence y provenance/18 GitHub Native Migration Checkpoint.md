# MLS R33 — Checkpoint migración GitHub-native

**Fecha:** 2026-09-23 UTC  
**Estado:** IMPLEMENTADO / MAIN  
**Gate 500:** BLOQUEADO hasta benchmark fresco GitHub-native

## Resultado

- GitHub es la única fuente de verdad editorial.
- 100/100 Evidence del Correction Repeat materializadas en GitHub.
- 42 Sources materializadas en Source Registry Git.
- R33 Evidence Farm R2 usa artefacto Git + commit SHA + SHA-256.
- `bridgeResultPath` está prohibido.
- Worker Events refetchea el Issue antes de aplicar eventos.
- Artículos publicados se generan desde `content/` a `public/data/canonical/`.
- Evidence publicado se genera desde `evidence git/` a `public/data/evidence/`.
- El lector no consulta D1 para artículos ni Evidence.
- El endpoint público Evidence de compatibilidad sirve Assets derivados de GitHub.
- Cloudflare queda como destino de deploy/serving; no como base editorial.
- Los snapshots editoriales Cloudflare post-deploy fueron retirados.

## Regla futura

Cualquier workflow R33 que necesite D1, MLS Chat Bridge o un endpoint editorial Cloudflare debe fallar certificación. Un nuevo gate solo puede usar GitHub para leer/escribir trabajo editorial.
