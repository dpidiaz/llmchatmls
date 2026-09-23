# MLS R33 Evidence & Provenance — Gate 100 Final Report

**Fecha:** 2026-09-23 UTC  
**Gate ID:** `MLS-R33-EVIDENCE-GATE-100`  
**Resultado editorial:** **PASS**  
**Resultado de escalabilidad:** **CORRECT AND REPEAT**  
**Gate 500:** **NO AUTORIZADO TODAVÍA**

## 1. Resumen ejecutivo

Gate 100 completó las 100 entradas del manifiesto determinista, con 10 entradas por cada uno de los 10 idiomas.

Resultado final de certificación:

```yaml
entriesSelected: 100
entriesComplete: 100
entriesVerified: 100
entriesReviewedHuman: 0
exceptions: 0
needsEvidence: 0
externalDiscoveryPending: 0
conflictsCurrent: 0
```

La arquitectura Evidence/Provenance funcionó correctamente en calidad y seguridad: no quedaron entradas SOURCED sin cerrar, no quedaron excepciones, no hubo conflictos pendientes y no se fabricó ningún estado REVIEWED humano.

Sin embargo, el criterio de escalabilidad definido antes de ejecutar Gate 100 exige CORRECT AND REPEAT cuando los D1 reads crecen materialmente o cuando la mayoría de las entradas todavía requieren discovery externo desde cero. Ambas señales aparecieron.

Por tanto, Gate 100 **pasa el gate editorial**, pero **no debe escalar todavía a Gate 500**.

## 2. Certificación final

Fuente operativa: `command 0328.json`.

Dos bloques de 50 fueron certificados:

```yaml
block1:
  processed: 50
  complete: 50
  exception: 0
  needs_evidence: 0
  externalDiscoveryRequired: 0

block2:
  processed: 50
  complete: 50
  exception: 0
  needs_evidence: 0
  externalDiscoveryRequired: 0
```

Resultado combinado:

- 100/100 completas;
- 100/100 VERIFIED;
- 0 excepciones;
- 0 needsReview pendientes;
- 0 discovery pendiente;
- 0 conflictos actuales;
- 0 revisiones de artículo propuestas en el snapshot final.

## 3. Métricas finales de almacenamiento Evidence

Fuentes: `command 0329.json` + `command 0330.json`.

```yaml
entriesMeasured: 100
claimsCurrent: 149
evidenceLinksCurrent: 151
sourceReferencesAcrossEntries: 110
verificationReviewRows: 100
conflictsCurrent: 0
articleRevisionsCurrent: 0

entryOwnedBytes: 280925
referencedSourceBytes: 120582
logicalEvidenceBytes: 401507

averageClaimsPerEntry: 1.49
averageEvidenceLinksPerEntry: 1.51
averageSourceReferencesPerEntry: 1.10
averageLogicalEvidenceBytesPerEntry: 4015.07
```

`sourceReferencesAcrossEntries` no equivale a Sources únicas del Registry; Sources compartidas pueden contarse en más de una entrada.

## 4. Costo D1 observado

Para medir el costo operativo real del Gate se sumó la telemetría de los comandos Gate 100 desde triage inicial hasta certificación final (`0298–0328`), excluyendo las consultas posteriores de métricas.

```yaml
d1RowsRead: 134214
d1RowsWritten: 2099

averageD1RowsReadPerEntry: 1342.14
averageD1RowsWrittenPerEntry: 20.99
```

Las consultas de reporte `0329–0330` añadieron:

```yaml
reportingRowsRead: 2504
reportingRowsWritten: 0
```

Incluyendo reporting:

```yaml
totalRowsReadIncludingReporting: 136718
averageRowsReadIncludingReportingPerEntry: 1367.18
```

El triage inicial por sí solo consumió:

```yaml
first50RowsRead: 27630
second50RowsRead: 27797
initialTriageRowsRead: 55427
```

Esto representa aproximadamente 41% de los reads operativos del Gate.

## 5. Registry-first y external discovery

Triage inicial (`command 0298`):

```yaml
alreadyComplete: 1
needsEvidence: 99

registryFirst: 47
externalDiscoveryRequired: 52
exceptions: 0
```

El Registry ya redujo discovery repetido en una parte sustancial del lote, pero **52 de las 99 entradas que requerían Evidence todavía necesitaron discovery externo**.

Eso significa que, por un margen pequeño, la mayoría del trabajo nuevo siguió comenzando fuera del Registry.

## 6. Source reuse y operaciones

Observado durante los comandos de ejecución:

```yaml
sourceCreateOperations: 48
sourceReuseOperations: 57
sourceMetadataUpdateOperations: 7

proposalAttempts: 105
proposalFailures: 10

verificationAttempts: 101
verificationFailures: 2
```

Las 10 fallas de proposal correspondieron al conflicto de revisión italiano y fueron recuperadas mediante refresh de revision.

Las dos fallas de verificación fueron bloqueos correctos del APA Validator; las fichas fueron corregidas y posteriormente verificadas.

`sourceReuseOperations` incluye reutilización real, retries y enrichment; no debe interpretarse como 57 Sources únicas compartidas entre artículos.

## 7. Incidencias observadas

### English APA correction

Una entrada inglesa necesitó completar metadata APA antes de verificar.

### Portuguese APA corrections

Tres entradas portuguesas fueron detectadas por validación previa, enriquecidas y verificadas después.

### Italian evidence revision conflicts

Las 10 propuestas italianas recibieron inicialmente `EVIDENCE_REVISION_CONFLICT`. Se refrescaron los snapshots y las 10 terminaron VERIFIED.

### German legal-language APA correction

`MLS-V05-0951 — Rechtssprache` necesitó completar container, editors, publisher y pages. Tras el enrichment terminó VERIFIED.

### Control-plane concurrency

Hubo dos ejecuciones cuyo paso de guardado de resultado chocó con pushes concurrentes. El estado Evidence persistido no se perdió y los resultados finales quedaron presentes. La certificación final confirmó consistencia.

## 8. Control plane

Gate 100 usó:

```yaml
commandFiles: 33
resultFiles: 33
observedControlPlaneCommits: 64
observedCommandCommits: 33
observedResultCommits: 31
```

Dos resultados fueron recuperados mediante commits posteriores después de conflictos de escritura concurrente.

Comparado con Pilot 20:

```yaml
Pilot20:
  entries: 20
  controlPlaneCommits: 197
  commitsPerEntry: 9.85

Gate100:
  entries: 100
  controlPlaneCommits: 64
  commitsPerEntry: 0.64
```

Reducción aproximada del ruido de commits por entrada: **93.5%**.

E4 Control-plane scaling queda claramente mejorado.

## 9. Comparación contra Pilot 20

| Métrica | Pilot 20 | Gate 100 | Cambio |
|---|---:|---:|---:|
| Entradas | 20 | 100 | 5× |
| VERIFIED | 17 | 100 | mejora de cierre |
| Excepciones finales | 3 no VERIFIED | 0 | mejora |
| Claims / entrada | 2.75 | 1.49 | menor granularidad |
| Links / entrada | 4.05 | 1.51 | menor densidad |
| Logical Evidence bytes / entrada | 8819.95 | 4015.07 | -54.5% |
| D1 writes / entrada | 50.00 | 20.99 | -58.0% |
| D1 reads / entrada | 461.60 | 1342.14 | **+190.8%** |
| Control commits / entrada | 9.85 | 0.64 | -93.5% |
| Conflictos finales | 1 | 0 | 0 pendientes |
| Human REVIEWED en el gate | 0 | 0 | sin cambio |

Los bytes, writes y control-plane cost mejoraron sustancialmente.

El problema dominante es **read amplification**: los D1 reads por entrada casi se triplicaron frente a Pilot 20.

## 10. Evaluación de los criterios de escalabilidad

### Calidad y seguridad — PASS

- 100/100 VERIFIED.
- 0 excepciones finales.
- 0 falsos REVIEWED humanos.
- APA Validator bloqueó metadata incompleta correctamente.
- Evidence revisions bloquearon snapshots stale correctamente.
- Source Registry reutilizó Sources sin silent overwrite.
- R32 permaneció intacto.

### Storage — PASS

Promedio lógico Evidence: 4.0 KB/entrada, inferior al Pilot 20.

### Writes — PASS

20.99 rows written/entrada frente a 50 del Pilot 20.

### Control plane — PASS

0.64 commits/entrada frente a 9.85 del Pilot 20.

### Registry-first — PARTIAL

47 entradas pudieron comenzar Registry-first, pero 52 necesitaron external discovery.

El criterio previo decía CORRECT AND REPEAT si se seguía investigando desde cero la mayoría de entradas. Gate 100 queda justo del lado desfavorable de ese criterio.

### D1 reads — FAIL FOR SCALE

1342.14 rows read/entrada frente a 461.6 del Pilot 20.

El documento de preparación exige CORRECT AND REPEAT cuando los reads crecen materialmente. Este crecimiento es material.

## 11. Decisión

**PASS QUALITY / CORRECT AND REPEAT SCALABILITY**

No se debe iniciar Gate 500 todavía.

Gate 100 demuestra que el pipeline produce Evidence verificable a escala de 100, pero no demuestra todavía que el costo marginal de lectura D1 haya bajado.

## 12. Corrección requerida antes de Gate 500

Prioridad 1 — reducir read amplification de `triageBatchEvidenceMLS`.

Objetivo inmediato:

- evitar scans repetidos de Source Registry por entrada;
- preagrupar topics/language;
- reutilizar resultados candidatos dentro del mismo batch;
- evitar volver a leer metadata Source que ya se resolvió durante el batch;
- medir por separado triage, proposal y verify.

Prioridad 2 — aumentar Registry-first.

El Gate generó 48 Source-create operations y 57 reuse operations. El Registry ahora contiene más material reutilizable que al inicio; el siguiente repeat debe demostrar que ese aprendizaje reduce external discovery por debajo de la mitad.

Prioridad 3 — robustecer escritura concurrente del control plane.

Dos result saves chocaron con pushes paralelos. No hubo pérdida de Evidence, pero debe reducirse ese riesgo antes de mayor concurrencia.

## 13. Repeat recomendado

Crear un **Gate 100 Correction Repeat** sobre una muestra fresca y determinista antes de Gate 500.

El repeat debe verificar al menos:

```yaml
quality:
  complete: 100%
  exceptions: controlled
  falseVerified: 0

scale:
  averageD1RowsReadPerEntry: < 461.6 preferred
  minimumRequirement: materially lower than 1342.14
  externalDiscoveryRequired: < 50%
  controlPlaneCommitsPerEntry: <= 0.64
  logicalEvidenceBytesPerEntry: no material regression
  d1RowsWrittenPerEntry: no material regression
```

No es necesario cambiar el modelo Evidence ni regenerar artículos R32.

## 14. Estado final

```yaml
Gate100:
  editorial: PASS
  evidenceIntegrity: PASS
  apa: PASS
  sourceRegistry: PASS_WITH_SCALE_FINDING
  storage: PASS
  d1Writes: PASS
  d1Reads: CORRECT
  controlPlane: PASS
  finalDecision: CORRECT_AND_REPEAT
  gate500Authorized: false
```
