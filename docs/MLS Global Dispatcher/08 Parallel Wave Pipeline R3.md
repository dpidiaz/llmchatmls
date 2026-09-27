# 08 — Parallel Wave Pipeline R3

## Objetivo

Eliminar el cuello de botella de integración por lote sin perder fencing, recoveries, scope control ni el single-writer de `main`.

## Topología

`R33 Farm workers → Evidence certificado → wave agregada → integration lease → índices → PR → main`

### Workers editoriales

- Hasta **10 workers R33** simultáneos.
- Cada worker recibe hasta **50 entradas** disjuntas.
- Cada worker escribe únicamente sus artefactos Evidence permitidos.
- Cada checkpoint conserva commit SHA, completedUnits y lease fencing.
- Los workers no regeneran índices globales y no escriben a `main`.

### Wave de integración

- Una wave agrupa hasta **500 entradas** certificadas.
- Puede combinar Evidence procedente de múltiples branches y commits de workers.
- Se materializa cuando todas las entradas de la primera wave pendiente tienen un sourceRef terminal.
- No espera a que todo el pool termine.
- Mientras una wave se integra, los workers pueden seguir preparando la wave siguiente.

### Single writer reducido

Solo `r33-index-integration` toma:

- `system:main-integration`
- `system:r33-index-integration`
- lock de los índices compartidos

El integration worker crea una rama desde el `main` vigente, copia todos los Evidence certificados de la wave, ejecuta `r33:indexes:write` **una sola vez**, valida, abre un único PR y fusiona con `expected_head_sha`.

## Continuidad de corpus

Cuando el pool configurado queda completamente presente en `verified.json` y `continuationAfterActivePool=true`, el Dispatcher sintetiza `MLS-R33-FULL-CORPUS-CONTINUATION` directamente desde el corpus canónico de GitHub.

Ese pool dinámico:

- excluye códigos ya integrados;
- usa lotes de 50;
- limita R33 Farm a 10 leases simultáneos;
- usa waves de 500;
- permanece GitHub-native;
- mantiene Cloudflare/D1 editorial en 0.

No requiere preparar manualmente otro Gate estático para seguir avanzando por el resto del corpus.

## Compatibilidad

El camino antiguo de `r33-index-preparation` se conserva en código para pools que todavía lo declaren, pero Gate 1000 usa `directWaveIntegration=true` y ya no genera PRs de preparación por lote.

## Invariantes

- rangos disjuntos por locks de entrada;
- recovery generacional y zombie fencing conservados;
- un solo merge writer a `main`;
- índices globales derivados una vez por wave;
- Sources y contenido canónico fuera del perímetro de escritura de integración;
- FREE ONLY / Chat-only;
- 0 interacciones editoriales Cloudflare/D1.
