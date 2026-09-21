# MLS R33 Evidence & Provenance — Pilot 20 Checkpoint 5–8

**Fecha:** 2026-09-21  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Run ID de verificación:** `MLS-R33-EVIDENCE-PILOT-20-20260921-A`  
**Estado:** PASS — continuar con entradas 9–12  
**Corpus canónico modificado:** no  
**Article revisions propuestas:** 0  
**Editorial reviews humanas:** 0

## 1. Resultado del bloque

| # | Código | Estado final | Sources | Claims | Links | Conflicts | D1 read | D1 written | Logical Evidence bytes | Verification review |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 5 | MLS-V02-0180 | VERIFIED | 2 | 2 | 3 | 0 | 412 | 38 | 6,144 | MLS-REVW-2C738DF782FD386F6864237E |
| 6 | MLS-V02-0959 | VERIFIED | 2 | 2 | 3 | 0 | 524 | 42 | 6,110 | MLS-REVW-830295FC7DF3C1E1BDF2AEA8 |
| 7 | MLS-V03-0122 | VERIFIED | 2 | 2 | 3 | 0 | 412 | 38 | 6,209 | MLS-REVW-514DF1E98EE9188E540193E0 |
| 8 | MLS-V03-0648 | VERIFIED | 4 | 3 | 4 | 0 | 527 | 54 | 9,367 | MLS-REVW-51AB26866CC7729189204D52 |

Los D1 rows incluyen el ciclo completo realmente ejecutado.

Para la entrada 6 hubo un ciclo adicional deliberado:

`proposal → validate → metadata enrichment → re-proposal → revalidate → verify`

Esto explica su costo mayor y forma parte de la medición real, no se elimina de las métricas.

## 2. Métricas del checkpoint 5–8

```yaml
entriesProcessed: 4
entriesVerified: 4
sourcesCreated: 10
sourceReuseOperations: 2
sourceMetadataUpdates: 1
crossEntrySourceReuse: 0
claimsCreated: 9
claimReuseOperations: 2
claimsVerified: 9
evidenceLinksCreated: 13
evidenceLinkReuseOperations: 3
evidenceConflicts: 0
needsReview: 0
verificationAttempts: 4
verificationReviewsCreated: 4
articleRevisionsProposed: 0
d1RowsRead: 1875
d1RowsWritten: 172
logicalEvidenceBytes: 27830
averageD1RowsReadPerEntry: 468.75
averageD1RowsWrittenPerEntry: 43
averageEvidenceBytesPerEntry: 6957.5
averageSourcesPerEntry: 2.5
averageClaimsPerEntry: 2.25
averageEvidenceLinksPerEntry: 3.25
apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 1
manualHumanReviewEvents: 0
```

## 3. Dedupe e idempotencia live

La entrada `MLS-V02-0959` produjo el primer ejercicio live del dedupe.

Primera propuesta:

- 2 Sources creadas;
- 2 Claims creados;
- 3 EvidenceLinks creados.

Tras detectar que el artículo académico de *Alfa* carecía de `articleNumber=e18257`, se reenvió la propuesta con metadata enriquecida.

Resultado:

- Sources creadas: 0;
- Sources reutilizadas: 2;
- Sources actualizadas: 1;
- Claims creados: 0;
- Claims reutilizados: 2;
- Links creados: 0;
- Links reutilizados: 3.

No cambió ningún ID.

Esto demuestra en runtime:

- dedupe por DOI/URL;
- enriquecimiento conservador;
- idempotencia de Claim y EvidenceLink;
- ausencia de duplicación al corregir metadata antes de VERIFIED.

**Todavía no se ha observado source reuse cross-entry.** Las entradas 1–8 han usado fuentes bibliográficamente distintas entre artículos. No confundir el reuse de un retry/enrichment con reuse entre artículos.

## 4. APA / metadata correction

En la primera validación de `MLS-V02-0959`:

- el estado global era `citationReady=true` porque el claim tenía otro link APA-ready;
- la Source académica de *Alfa* devolvía `citation=null` por falta de `articleNumber`.

Antes de VERIFIED se completó:

`articleNumber=e18257`

La revalidación produjo:

`Cunha, G. X. (2024). As relações textuais como procedimentos para a atribuição de ações na interação. Alfa: Revista de Linguística, 68, e18257. https://doi.org/10.1590/1981-5794-e18257`

No se registró como `apaValidationFailure` porque el backend nunca bloqueó `canVerify`; sí se registra como **metadata correction before verification**.

Lección del piloto: `citationReady` agregado no debe impedir revisar la calidad bibliográfica individual de cada Source enlazada.

## 5. Métricas acumuladas 1–8

```yaml
entriesProcessed: 8
entriesVerified: 8
entriesReviewedHuman: 0
sourcesCreated: 18
sourceReuseOperations: 2
sourceMetadataUpdates: 1
crossEntrySourceReuse: 0
claimsCreated: 19
claimsVerified: 19
evidenceLinks: 26
evidenceConflicts: 0
needsReview: 0
verificationAttempts: 8
verificationReviewsCreated: 8
articleRevisionsProposed: 0
d1RowsRead: 3595
d1RowsWritten: 335
logicalEvidenceBytes: 53868
averageD1RowsReadPerEntry: 449.375
averageD1RowsWrittenPerEntry: 41.875
averageEvidenceBytesPerEntry: 6733.5
averageSourcesPerEntry: 2.25
averageClaimsPerEntry: 2.375
averageEvidenceLinksPerEntry: 3.25
apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 1
manualHumanReviewEvents: 0
```

## 6. FREE ONLY

Límites D1 Workers Free confirmados el 2026-09-21:

- 5,000,000 rows read / día;
- 100,000 rows written / día;
- 5 GB storage total;
- reset diario a 00:00 UTC.

Fuente oficial:
`https://developers.cloudflare.com/d1/platform/pricing/`

El enforcement de límites diarios de Free tier está vigente desde 2026-09-01:
`https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/`

### Proyección lineal actual del Pilot 20

Basada únicamente en el promedio observado de las primeras ocho entradas:

```yaml
pilot20ProjectedRowsRead: 8987.5
pilot20ProjectedRowsWritten: 837.5
pilot20ProjectedLogicalEvidenceBytes: 134670
```

Equivale aproximadamente a:

- 0.180% del límite diario de reads;
- 0.838% del límite diario de writes.

El Pilot 20 continúa ampliamente compatible con FREE ONLY.

### Extrapolación matemática al corpus completo — no es forecast final

Con 10,133 entradas:

```yaml
linearCorpusRowsRead: 4553516.875
linearCorpusRowsWritten: 424319.375
linearCorpusLogicalEvidenceBytes: 68230555.5
```

La proyección de reads queda cerca del límite diario; la de writes lo supera por más de cuatro veces.

No procesar el corpus completo en un día. Los gates 20 → 100 → 500 → 1000 y el batching diario siguen siendo obligatorios.

## 7. GitHub / control plane

Evidence runtime continúa sin GitHub como base de datos:

```yaml
runtimeGitHubRequests: 0
runtimeGitHubMutations: 0
mainRepoEvidenceDataDeltaBytes: 0
```

Control plane del bloque 5–8, comparando `mlschatcontrol` desde `0a7f3835af6323e938fa46071b7f01c3575ff240` hasta `d7603214cd79b6fbb132d033b2b0e9168d0c59de`:

```yaml
controlPlaneCommits: 41
controlBranchBlobDeltaBytes: 154943
controlChangedFiles: 44
githubTransportRequests: null
```

Acumulado desde el baseline del Pilot control plane `dfe7153429b0da0e0a5e62a7d6dd38657918c473`:

```yaml
controlPlaneCommits: 83
controlBranchBlobDeltaBytes: 302120
controlChangedFiles: 87
```

El crecimiento pertenece a comandos/resultados del Bridge, no a Evidence runtime.

## 8. Workers Builds

Los pushes a `mlschatcontrol` continúan produciendo checks `Workers Builds: llmchatmls` con Version IDs.

No apareció una regresión funcional, pero el costo/ruido operacional continúa siendo una recomendación abierta:

- auditar Branch control;
- auditar Build watch paths;
- excluir `mls chat bridge/*` cuando sea seguro hacerlo si no se desea crear una versión preview por cada comando.

No modificar esta integración dentro del Pilot 20 salvo que se convierta en bloqueo real.

## 9. Stop conditions audit

| Stop condition | Resultado |
| --- | --- |
| falso VERIFIED observado | NO |
| source metadata inventada | NO OBSERVADO |
| locator inventado | NO OBSERVADO |
| discovery tratado como verification | NO |
| version mismatch | NO |
| dedupe no determinista | NO; retry/enrichment live preservó IDs |
| cross-entry dedupe aún no ejercitado | PENDIENTE DE OBSERVACIÓN |
| silent overwrite | NO |
| contradicción sustantiva ignorada | NO |
| variación tratada como error | NO |
| APA metadata perdida | NO; una metadata incompleta fue corregida antes de VERIFIED |
| telemetry requerida ausente | NO |
| FREE ONLY incompatible | NO |
| cuota D1 agotada | NO |

## 10. Decisión de checkpoint

**PASS — continuar con entradas 9–12.**

Razones:

- 8/8 entradas acumuladas están VERIFIED;
- 19/19 claims sustanciales acumulados están verificados;
- 26 EvidenceLinks acumulados;
- 0 conflictos;
- 0 needsReview;
- 0 cambios de artículo;
- 0 editorial reviews humanas;
- dedupe/idempotencia live ejercitados correctamente;
- APA correction loop funcionó antes de VERIFIED;
- D1 continúa dentro de FREE ONLY con amplio margen para Pilot 20.

No se autoriza Gate 100 ni escalamiento del corpus.
