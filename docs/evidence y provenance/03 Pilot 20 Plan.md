# MLS R33 Evidence & Provenance — Pilot 20 Plan

**Estado:** IN PROGRESS — CHECKPOINT 13–16 PASS WITH FINDING (16/20)  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Manifest:** `04 Pilot 20 Manifest.json`  
**Selection base commit:** `a369cff3e0c6b096c1a48b62931f2e1f7f4ce529`

Este documento gobierna la Fase 2. El start gate live ya fue aprobado y el piloto está en ejecución controlada. No autoriza escalamiento más allá de los checkpoints definidos.

## 1. Objetivo

Probar R33 Evidence & Provenance sobre una muestra pequeña, deliberadamente heterogénea y versionada antes de cualquier escalamiento.

La muestra debe revelar:

- falsos VERIFIED;
- problemas de deduplicación;
- sobrefragmentación de claims;
- conflictos y variación legítima;
- carga APA;
- costo D1 por entrada;
- crecimiento lógico de Evidence;
- carga de revisión humana;
- regresiones R32.

## 2. Muestra bloqueada

La muestra tiene 20 entradas: exactamente 2 por cada uno de los 10 idiomas MLS.

| # | Código | Idioma | Nivel | Título | Foco |
| ---: | --- | --- | --- | --- | --- |
| 1 | MLS-V10-0020 | Español Guatemala | G1 | Las 27 letras del abecedario español | ortografía / norma |
| 2 | MLS-V10-0140 | Español Guatemala | G4 | Consideraciones semánticas | derivación / semántica / entrada larga |
| 3 | MLS-V01-0115 | Inglés | A2 | Artículo cero con comidas | artículos / uso |
| 4 | MLS-V01-0613 | Inglés | B2 | Ausencia de retroceso temporal cuando el contenido sigue siendo verdadero | opcionalidad / estilo indirecto |
| 5 | MLS-V02-0180 | Portugués brasileño | A2 | Mais y menos como cuantificadores | cuantificación |
| 6 | MLS-V02-0959 | Portugués brasileño | B1 | Enfim | pragmática brasileña / entrada corta |
| 7 | MLS-V03-0122 | Italiano | A2 | Artículo partitivo del/della/dei/degli/delle | morfosintaxis |
| 8 | MLS-V03-0648 | Italiano | B1 | Relación oposición–contraste | discurso / contraste |
| 9 | MLS-V04-0174 | Francés | A1 | celui-ci / celui-là | pronombres |
| 10 | MLS-V04-0927 | Francés | B1 | Conector c'est pourquoi | cohesión / causalidad |
| 11 | MLS-V05-0165 | Alemán | A2 | keinem/keiner/keinem en dativo | caso / morfología |
| 12 | MLS-V05-0881 | Alemán | C1 | laut + dativo/genitivo según estructura | variación / registro / posible conflicto aparente |
| 13 | MLS-V06-0010 | Japonés | A1 | さ行 さしすせそ | escritura / pronunciación |
| 14 | MLS-V06-0822 | Japonés | C1 | 接続詞 formal | discurso formal / académico |
| 15 | MLS-V07-0152 | Chino Taiwán | A1 | 億 | cantidad / dato exacto |
| 16 | MLS-V07-0813 | Chino Taiwán | B2 | Marcador conversacional 沒有啦 | pragmática / variación taiwanesa |
| 17 | MLS-V08-0010 | Coreano | A1 | Consonante ㅅ | escritura / pronunciación |
| 18 | MLS-V08-0875 | Coreano | C1 | Conector académico 요약하면 | registro académico |
| 19 | MLS-V09-0155 | Ruso | A2 | До/после + genitivo | régimen / caso |
| 20 | MLS-V09-0825 | Ruso | B1 | Fecha: третьего сентября | fecha / caso / cantidad |

Baseline de la muestra:

- 20 entradas;
- 10 idiomas;
- 2 entradas por idioma;
- 42,966 caracteres de artículo;
- media: 2,148.3 caracteres;
- mínimo: 1,052;
- máximo: 6,529;
- niveles: A1, A2, B1, B2, C1, G1 y G4;
- al menos cuatro familias AUTOOPT no `unknown` en la muestra, además de casos donde AUTOOPT se abstiene.

## 3. Regla de identidad

Antes de procesar una entrada:

1. el código debe existir;
2. el archivo debe coincidir con `contentBlobSha` del manifest;
3. `generatedAt` debe coincidir;
4. `promptVersion` debe ser 32.0;
5. metadata de idioma, título y nivel debe coincidir.

Si cualquiera cambia:

**PILOT_ENTRY_VERSION_MISMATCH**

No sustituir automáticamente por otra entrada. Actualizar el manifest mediante un cambio explícito y volver a certificarlo.

## 4. Flujo por entrada

```
LOAD EXACT ENTRY VERSION
→ LOAD LANGUAGE SOURCE POLICY
→ CHECK SOURCE REGISTRY / DEDUPE
→ CLAIM CLUSTERS
→ APPROVED SOURCE POOL
→ EXTERNAL DISCOVERY ONLY IF NEEDED
→ VERIFY SOURCE METADATA
→ READ RELEVANT EVIDENCE
→ MAP SOURCE ↔ CLAIM
→ CONFLICT / VARIATION CHECK
→ APA VALIDATOR
→ PROPOSAL
→ READ-ONLY VALIDATE
→ VERIFY ONLY IF BACKEND ALLOWS
→ ARTICLE REVISION PROPOSAL IF NEEDED
→ EDITORIAL REVIEW WHEN APPLICABLE
→ MEASURE
→ CHECKPOINT
```

Un resultado de búsqueda no es evidencia. Una fuente registrada no vuelve VERIFIED a un claim. Una referencia APA bien formada no demuestra que la fuente sustente el claim.

## 5. Métricas obligatorias

### Globales

- entriesProcessed;
- sourcesCreated;
- sourcesReused;
- sourceDeduplication;
- claimsTotal;
- claimsVerified;
- evidenceLinks;
- evidenceConflicts;
- needsReview;
- verificationAttempts;
- D1RowsRead;
- D1RowsWritten;
- GitHubRequests;
- GitHubMutations;
- repoSizeDelta;
- averageEvidenceBytesPerEntry;
- averageSourcesPerEntry;
- apaValidationFailures;
- manualReviewBurden.

### Por entrada

Registrar además:

- beforeEvidenceStatus;
- afterEvidenceStatus;
- articleHash / generatedAt;
- sourcePolicyVersion;
- source IDs usados;
- claim IDs;
- links;
- conflictos;
- verificationReviewId;
- editorialReviewId;
- articleRevisionProposed;
- logicalEvidenceBytes;
- D1 rows leídas/escritas;
- número de llamadas de verificación;
- eventos humanos de revisión.

**manualReviewBurden** se expresa inicialmente como número de intervenciones humanas y entradas `needsReview`; no inventar minutos de trabajo si no fueron medidos.

## 6. Instrumentación — gate previo al inicio

El piloto no debe comenzar hasta que estas métricas sean observables:

- [x] `proposal` distingue Sources creadas, reutilizadas y actualizadas; también reporta creación/reutilización de Claims, Links y conflictos.
- [x] Cada operación Evidence puede reportar telemetry D1 por request y consume `rows_read/rows_written` únicamente cuando Cloudflare los proporciona.
- [x] Si D1 no entrega metadata exacta, `d1RowsRead/d1RowsWritten` permanecen `null` y `observedRowsRead/observedRowsWritten` se muestran por separado; nunca se presentan como billed rows.
- [x] Existe medición read-only de logical Evidence bytes por entrada mediante `/api/wiki/editorial/evidence/metrics`.
- [x] Manifest integrity test verde en GitHub Actions run #316.
- [x] Foundation + Pilot-preparation certification verde en GitHub Actions run #316.
- [x] **Live preflight:** aprobado sobre el runtime real; Cloudflare devolvió `exactRowsRead=true` y `exactRowsWritten=true` antes de procesar la primera entrada.

GitHub runtime para Evidence debe permanecer en cero. Cualquier uso de GitHub por el proceso de control/documentación se cuenta aparte como `GitHubRequests` / `GitHubMutations`, no como dependencia runtime.

## 7. Orden de ejecución

Procesar secuencialmente en orden 1–20 al inicio.

No paralelizar las primeras entradas. La concurrencia ya tiene tests unitarios; el piloto debe priorizar observabilidad y depuración.

Checkpoint obligatorio después de:

- entradas 1–4;
- entradas 5–8;
- entradas 9–12;
- entradas 13–16;
- entradas 17–20.

Si un checkpoint descubre un problema estructural, detener antes de continuar.

## 8. Stop conditions

Detener el piloto si aparece cualquiera de estos casos:

- falso VERIFIED;
- source metadata inventada;
- locator inventado;
- source discovery tratado como verification;
- mismatch de versión de entrada;
- dedupe no determinista;
- overwrite silencioso;
- contradicción sustantiva ignorada;
- variación regional tratada como error sin fundamento;
- APA metadata perdida;
- telemetry requerida no disponible;
- D1 FREE ONLY incompatible con el costo observado;
- circuit breaker / cuota gratuita agotada.

## 9. Correcciones de artículo

Una discrepancia factual no autoriza overwrite directo.

Ruta:

```
Evidence finding
→ proposed article revision
→ editorial validation
→ evidence validation
→ explicit integration decision
```

El Pilot 20 puede crear una revisión `proposed`, pero no debe integrar automáticamente esa revisión al artículo canónico.

## 10. Gate de salida

Phase 2 solo puede cerrarse cuando las 20 entradas estén contabilizadas y las métricas permitan responder las preguntas de Fase 3.

No avanzar a 100 si:

- existe un falso VERIFIED;
- no se puede medir costo/crecimiento;
- source dedupe es inestable;
- las policies producen falsos conflictos;
- el modelo de claims resulta excesivamente granular;
- FREE ONLY queda comprometido.

## 11. Estado actual

**IN PROGRESS — CHECKPOINT 13–16 PASS WITH FINDING (16/20).**

Estado canónico acumulado:

```yaml
entriesProcessed: 16
entriesVerified: 14
entriesSourcedNotVerified: 2
entriesReviewedHuman: 0
sourcesCreated: 44
retryOrEnrichmentSourceReuseOperations: 2
sourceMetadataUpdates: 1
crossEntrySourceReuse: 0
claimsCreated: 43
claimsCoverageQualified: 42
evidenceLinks: 64
evidenceConflicts: 1
needsReviewByConflict: 1
articleRevisionsProposed: 2
articleRevisionsIntegrated: 0
verificationReviewsCreated: 14
d1RowsRead: 7325
d1RowsWritten: 785
logicalEvidenceBytes: 134815
averageEvidenceBytesPerEntry: 8425.9375
apaValidationFailures: 0
humanReviewEvents: 0
```

Entradas pendientes: 17–20. En el control plane, 17 y 19 ya alcanzaron VERIFIED, 18 quedó SOURCED por un gap de evidencia con revisión propuesta y 20 está cargada pero aún no procesada; esos resultados se incorporarán al checkpoint final 17–20 antes de cerrar el Pilot.

Checkpoint detallado 13–16: `08 Pilot 20 Checkpoint 13 a 16.md`.

Decisión vigente: **PASS WITH FINDING — continuar 17–20.**

No se autoriza Gate 100 ni integración automática de revisiones propuestas.