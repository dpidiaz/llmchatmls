# MLS R33 Evidence & Provenance — Pilot 20 Checkpoint 1–4

**Fecha:** 2026-09-21  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Run ID de verificación:** `MLS-R33-EVIDENCE-PILOT-20-20260921-A`  
**Estado:** PASS — continuar con entradas 5–8  
**Corpus canónico modificado:** no  
**Article revisions propuestas:** 0  
**Editorial reviews humanas:** 0

## 1. Start gate live

El preflight live se ejecutó contra `MLS-V10-0020` antes de iniciar el piloto.

Resultado:

- HTTP 200;
- `exactRowsRead=true`;
- `exactRowsWritten=true`;
- `d1RowsRead=6`;
- `d1RowsWritten=0`;
- 0 Sources, Claims, Links, Reviews y Revisions preexistentes para la entrada.

El gate de telemetría D1 queda cerrado.

## 2. Resultados por entrada

| # | Código | Estado final | Sources | Claims | Links | Conflicts | D1 read | D1 written | Logical Evidence bytes | Verification review |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | MLS-V10-0020 | VERIFIED | 3 | 3 | 4 | 0 | 472 | 50 | 7,787 | MLS-REVW-9233D767AFB48B91BE0A3E52 |
| 2 | MLS-V10-0140 | VERIFIED | 2 | 3 | 4 | 0 | 471 | 46 | 7,542 | MLS-REVW-7AD41DD7F8656E0C02478A13 |
| 3 | MLS-V01-0115 | VERIFIED | 1 | 2 | 2 | 0 | 365 | 29 | 4,527 | MLS-REVW-1091647B87AEC21E92955FA2 |
| 4 | MLS-V01-0613 | VERIFIED | 2 | 2 | 3 | 0 | 412 | 38 | 6,182 | MLS-REVW-BC9CD45275B9E714F1EC2AB0 |

Los D1 rows incluyen el ciclo completo de cada entrada:

`entry load → proposal → validate → verify → metrics`.

## 3. Métricas acumuladas

```yaml
entriesProcessed: 4
entriesVerified: 4
entriesReviewedHuman: 0
sourcesCreated: 8
sourcesReused: 0
sourcesUpdated: 0
claimsCreated: 10
claimsVerified: 10
evidenceLinks: 13
evidenceConflicts: 0
needsReview: 0
verificationAttempts: 4
verificationReviewsCreated: 4
articleRevisionsProposed: 0
d1RowsRead: 1720
d1RowsWritten: 163
logicalEvidenceBytes: 26038
averageD1RowsReadPerEntry: 430
averageD1RowsWrittenPerEntry: 40.75
averageEvidenceBytesPerEntry: 6509.5
averageSourcesPerEntry: 2
averageClaimsPerEntry: 2.5
averageEvidenceLinksPerEntry: 3.25
apaValidationFailures: 0
manualHumanReviewEvents: 0
```

### Source reuse

`sourcesReused=0` no se interpreta como fallo de dedupe.

Las primeras cuatro entradas usaron ocho fuentes bibliográficamente distintas. Todavía no apareció un caso real donde dos entradas intentaran registrar la misma fuente. La deduplicación cross-entry sigue pendiente de observación live, aunque sus contratos unitarios ya están certificados.

## 4. Costo D1 y FREE ONLY

Límites oficiales de Workers Free verificados el 2026-09-21:

- 5,000,000 rows read / día;
- 100,000 rows written / día;
- reset a 00:00 UTC.

Fuente oficial:
`https://developers.cloudflare.com/d1/platform/pricing/`

Cloudflare comenzó a hacer cumplir los límites diarios de Free tier el 2026-09-01:
`https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/`

Proyección puramente lineal a partir de las primeras cuatro entradas:

```yaml
pilot20ProjectedRowsRead: 8600
pilot20ProjectedRowsWritten: 815
pilot20ProjectedLogicalEvidenceBytes: 130190
```

Esto representa aproximadamente:

- 0.172% del límite diario de reads;
- 0.815% del límite diario de writes.

Por lo tanto, el Pilot 20 es compatible con FREE ONLY bajo el costo observado.

### No extrapolar esto como autorización de migración masiva

Una extrapolación matemática del promedio actual a 10,133 entradas produciría aproximadamente:

- 4,357,190 rows read;
- 412,920 rows written;
- 65,960,764 bytes lógicos de Evidence referenciado.

Esto **no** es una estimación final del corpus. El source reuse, la heterogeneidad de claims y futuras optimizaciones pueden cambiarla sustancialmente.

Aun así, la cifra de writes demuestra que el corpus completo no debe procesarse en un solo día bajo Workers Free. El diseño por gates y lotes diarios sigue siendo obligatorio.

## 5. GitHub / control plane

Evidence runtime:

```yaml
runtimeGitHubRequests: 0
runtimeGitHubMutations: 0
mainRepoEvidenceDataDeltaBytes: 0
```

El Bridge usado para control sí crea historial Git separado.

Comparación de `mlschatcontrol` desde `dfe7153429b0da0e0a5e62a7d6dd38657918c473` hasta `0a7f3835af6323e938fa46071b7f01c3575ff240`:

```yaml
controlPlaneCommits: 42
controlBranchBlobDeltaBytes: 147177
controlChangedFiles: 43
githubTransportRequests: null
```

`githubTransportRequests` queda `null` porque el número exacto de requests HTTP internos de checkout/push/API no está instrumentado. No se sustituye por una estimación.

La diferencia de 147,177 bytes pertenece al Bridge de control —comandos, resultados y extensión del script—, no a Evidence runtime.

## 6. Workers Builds observado

Los pushes a `mlschatcontrol` generan checks `Workers Builds: llmchatmls` y Version IDs.

La documentación oficial de Cloudflare indica que, para branches no productivos, el deploy por defecto es `wrangler versions upload`, que crea una versión preview sin promoverla a producción. La rama de producción efectiva sigue siendo configuración de Cloudflare y no puede demostrarse solo desde el check de GitHub.

Fuentes:
- `https://developers.cloudflare.com/workers/ci-cd/builds/configuration/`
- `https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/`

Acción pendiente operacional: auditar Branch control / Build watch paths y excluir `mls chat bridge/*` de Workers Builds si esos archivos no deben crear versiones preview.

Esto no afecta el estado epistemológico de las cuatro entradas, pero sí es una optimización recomendada antes de escalamiento prolongado.

## 7. Stop conditions audit

| Stop condition | Resultado |
| --- | --- |
| falso VERIFIED observado | NO |
| source metadata inventada | NO OBSERVADO |
| locator inventado | NO OBSERVADO |
| discovery tratado como verification | NO |
| version mismatch | NO |
| dedupe inestable | NO OBSERVADO; reuse live aún no ejercitado |
| silent overwrite | NO |
| contradicción ignorada | NO |
| variación legítima tratada como error | NO; entry 4 prueba optional backshift sin falso conflicto |
| APA metadata perdida | NO |
| telemetry requerida ausente | NO |
| FREE ONLY incompatible | NO |
| cuota D1 agotada | NO |

## 8. Decisión de checkpoint

**PASS — continuar con entradas 5–8.**

Razones:

- 4/4 entradas alcanzaron VERIFIED por guard backend;
- 10/10 claims sustanciales quedaron cubiertos;
- APA Validator quedó verde en las cuatro;
- 0 conflictos y 0 needsReview;
- no hubo cambios de artículo;
- costo D1 del piloto es compatible con FREE ONLY;
- logical Evidence growth sigue dentro de un rango pequeño para el piloto;
- el caso de optional backshift demostró que la policy puede representar variación sin convertirla en contradicción.

No se autoriza Gate 100 ni escalamiento de corpus por este checkpoint.
