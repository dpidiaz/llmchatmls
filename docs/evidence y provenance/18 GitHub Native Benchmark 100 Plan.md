# MLS R33 — GitHub-native Benchmark 100 Plan

**Fecha:** 2026-09-23 UTC  
**Pool:** `MLS-R33-GITHUB-NATIVE-BENCHMARK-100`  
**Estado:** READY / AUTHORIZED  
**Gate 500:** BLOCKED hasta cierre favorable

## Por qué existe este benchmark

PR #688 migró el proceso editorial a GitHub-native y materializó 100 artefactos históricos del Correction Repeat. La auditoría del diff confirmó:

- 100/100 artefactos `architecture: github-native`;
- 100/100 con `migratedFromD1Snapshot: true`;
- 100/100 con al menos un link cuyo `locator` quedó vacío en la migración.

Por tanto, ese lote demuestra persistencia y compatibilidad, pero no certifica una ejecución fresca con 0 D1/Cloudflare editorial ni la política de locators.

## Muestra fresca

Manifest: `17 GitHub Native Benchmark 100 Pool.json`.

- 100 entradas;
- 10 idiomas × 10;
- exclusión de Pilot 20 + Gate 100 + Correction Repeat = 220 códigos previos;
- selección determinista por cuantiles sobre el corpus restante;
- cada entrada bloqueada por `contentBlobSha`.

## Pipeline obligatorio

`claim → heartbeat → GitHub article → GitHub Source Registry → Evidence Git → local/CI validation → VERIFIED → checkpoint artefacto+commit+hash → finish`

Prohibido en editorial:

- Cloudflare;
- D1;
- MLS Chat Bridge;
- Workers AI/runtime APIs.

## Exit criteria

```yaml
entries: 100
verified: 100
falseVerified: 0
cloudflareEditorialInteractions: 0
d1EditorialInteractions: 0
migratedFromD1Snapshot: 0
lostUpdates: 0
locatorPolicy: PASS
reviewedHumanFabricated: 0
```

El benchmark no autoriza por sí solo Gate 500 hasta que exista reporte final persistente con esas mediciones.
