# MLS R33 Evidence & Provenance — Pilot 20 Checkpoint 17–20 y cierre

**Fecha:** 2026-09-21 / 2026-09-22 UTC  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Run ID:** `MLS-R33-EVIDENCE-PILOT-20-20260921-A`  
**Estado:** COMPLETE — PASS WITH FINDINGS — FASE 3 REQUIRED  
**Entradas procesadas:** 20/20  
**Gate 100 autorizado:** NO

## 1. Resultado del bloque 17–20

| # | Código | Estado final | Sources | Claims | Claims cubiertos | Links | Conflicts | Revisions propuestas | Logical Evidence bytes |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 17 | MLS-V08-0010 | VERIFIED | 3 | 3 | 3 | 3 | 0 | 0 | 7,951 |
| 18 | MLS-V08-0875 | SOURCED | 3 | 3 | 2 | 5 | 0 | 1 | 14,282 |
| 19 | MLS-V09-0155 | VERIFIED | 3 | 3 | 3 | 5 | 0 | 0 | 9,118 |
| 20 | MLS-V09-0825 | VERIFIED | 4 | 3 | 3 | 4 | 0 | 0 | 10,233 |

### Entrada 18 — hallazgo

El artículo canónico de `요약하면` afirmaba que el conector es **“frecuente”** en textos académicos y exposiciones.

La evidencia localizada demostró:

- significado de resumen/condensación;
- uso real en un texto académico;
- distinción funcional frente a `따라서`.

No demostró una frecuencia cuantitativa suficiente.

Por ello:

- se añadió un tercer claim sustancial de frecuencia;
- el link disponible se marcó como `contextualizes`, no como soporte suficiente;
- el backend devolvió `canVerify=false`;
- la entrada permaneció SOURCED;
- se creó la revisión propuesta `MLS-ARTREV-83AE727285B7DBD382F2EB5F`;
- no se modificó `wiki_articles`.

Esto es comportamiento esperado del sistema.

## 2. Métricas bloque 17–20

```yaml
entriesProcessed: 4
entriesVerified: 3
entriesSourcedNotVerified: 1
sourcesCreated: 13
sourceReuseOperations: 1
claimsCreated: 12
claimsCoverageQualified: 11
evidenceLinksCurrent: 17
conflicts: 0
needsReview: 0
articleRevisionsProposed: 1
humanEditorialReviews: 0
d1RowsRead: 1907
d1RowsWritten: 215
logicalEvidenceBytes: 41584
```

## 3. Métricas finales Pilot 20

```yaml
entriesProcessed: 20
entriesVerified: 17
entriesSourcedNotVerified: 3
entriesReviewed: 0
entriesNeedsReview: 1

sourcesCreated: 57
sourceRetryOrEnrichmentReuseOperations: 3
sourceMetadataUpdates: 1
crossEntrySourceReuse: 0

claimsCreated: 55
claimsCoverageQualified: 53
evidenceLinksCurrent: 81
conflicts: 1

verificationReviewsCreated: 17
humanEditorialReviewEvents: 0
articleRevisionsProposed: 3
articleRevisionsIntegrated: 0

d1RowsRead: 9232
d1RowsWritten: 1000
logicalEvidenceBytes: 176399

averageD1RowsReadPerEntry: 461.6
averageD1RowsWrittenPerEntry: 50
averageEvidenceBytesPerEntry: 8819.95
averageSourcesCreatedPerEntry: 2.85
averageClaimsPerEntry: 2.75
averageEvidenceLinksPerEntry: 4.05

apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 1
```

Los porcentajes descriptivos del piloto son:

- entradas VERIFIED: 17/20 = 85%;
- claims con cobertura suficiente: 53/55 ≈ 96.36%.

Estos porcentajes **no son una puntuación de exactitud** ni autorización de escalamiento.

## 4. Tres entradas correctamente bloqueadas

### MLS-V04-0174 — celui-ci / celui-là

- SOURCED;
- 1 conflicto sustantivo;
- needsReview=true;
- revisión de artículo propuesta;
- VERIFIED bloqueado.

### MLS-V07-0813 — 沒有啦

- SOURCED;
- un overclaim pragmático no quedó suficientemente sustentado;
- revisión propuesta;
- VERIFIED bloqueado.

### MLS-V08-0875 — 요약하면

- SOURCED;
- claim de frecuencia no sustentado cuantitativamente;
- revisión propuesta;
- VERIFIED bloqueado.

El hecho de que el piloto no termine 20/20 VERIFIED es una señal positiva del guard: el sistema no forzó confianza donde la evidencia era insuficiente.

## 5. Hallazgos de arquitectura

### 5.1 Dedupe e idempotencia

Funcionó correctamente en retries/enrichment:

- misma Source reutilizada;
- metadata enriquecida sin nuevo Source ID;
- Claims y Links reutilizados cuando correspondía.

Todavía no apareció de manera natural reutilización de la misma Source entre dos entradas diferentes:

`crossEntrySourceReuse: 0`

Esto debe probarse antes o durante Gate 100.

### 5.2 Granularidad DOI

Se encontró un problema de modelado potencial: un DOI puede identificar una obra/contenedor completo mientras varias páginas específicas del recurso tienen metadata distinta.

Caso observado: diccionario de preposiciones IDS/grammis para entradas como `mit` y `laut`.

Durante el piloto se evitó una falsa colisión usando la URL específica de la ficha `laut` como identidad, sin registrar el DOI de la obra contenedora en esa ficha específica.

Antes de Gate 100 debe definirse explícitamente:

```
resourceSpecificDoi
vs
containerOrWorkDoi
```

El Source Registry no debe asumir que cualquier DOI presente identifica necesariamente el recurso granular almacenado.

### 5.3 Evidence gap sin contradicción

Entradas 16 y 18 demuestran que un claim puede quedar sin verificar aunque no exista una fuente contradictoria.

`no contradiction != verified`

Este comportamiento debe preservarse.

### 5.4 Revisión humana

No se fabricó ningún evento REVIEWED.

```yaml
humanEditorialReviewEvents: 0
reviewedEntries: 0
```

El lifecycle REVIEWED necesita un ejercicio live real antes del escalamiento amplio.

## 6. FREE ONLY / D1

El Pilot 20 completo consumió:

- 9,232 exact rows read;
- 1,000 exact rows written.

Esto es compatible con el presupuesto Free observado para el piloto.

No debe extrapolarse como autorización de procesar las 10,133 entradas en un solo día.

## 7. GitHub / control plane

```yaml
evidenceRuntimeGitHubRequests: 0
evidenceRuntimeGitHubMutations: 0
controlPlaneCommitsSinceBaseline: 197
controlBranchBlobDeltaBytes: 788553
githubTransportRequests: null
```

Los pushes de `mlschatcontrol` continúan generando Workers Builds/Version IDs. Debe auditarse Branch control / Build watch paths antes del escalamiento sostenido.

## 8. Stop-condition audit final

| Stop condition | Resultado |
| --- | --- |
| falso VERIFIED observado | NO |
| source metadata inventada | NO OBSERVADO |
| locator inventado | NO OBSERVADO |
| discovery tratado como verification | NO |
| version mismatch silencioso | NO |
| dedupe no determinista | NO OBSERVADO |
| silent overwrite | NO |
| contradicción sustantiva ignorada | NO |
| evidence gap ignorado | NO |
| variación legítima tratada como error | NO OBSERVADO |
| APA metadata perdida | NO |
| telemetry ausente | NO |
| FREE ONLY incompatible con Pilot 20 | NO |
| cuota D1 agotada | NO |

## 9. Decisión de checkpoint

**PASS WITH FINDINGS — Pilot 20 COMPLETE.**

No se autoriza Gate 100 todavía.

Siguiente fase obligatoria:

**FASE 3 — EVALUACIÓN**

Debe producir exactamente una decisión:

- GO;
- CORRECT AND REPEAT;
- STOP.

La evaluación debe resolver o clasificar explícitamente los hallazgos de source identity, revisiones propuestas, REVIEWED humano, cross-entry reuse y control-plane builds antes de escalar.
