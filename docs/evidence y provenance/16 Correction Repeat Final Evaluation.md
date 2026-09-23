# MLS R33 Evidence & Provenance — Correction Repeat Final Evaluation

**Fecha:** 2026-09-23 UTC  
**Pool:** `MLS-R33-CORRECTION-REPEAT-100`  
**Ledger:** Issue #672  
**Resultado de calidad:** **PASS**  
**Resultado de escalabilidad:** **CORRECT AND REPEAT**  
**Gate 500:** **NO AUTORIZADO**

## 1. Resumen ejecutivo

El Correction Repeat terminó con 100/100 entradas VERIFIED, 0 excepciones y 0 conflictos vigentes en el ledger. La calidad estructural, el storage lógico, los D1 writes, la reutilización del Source Registry y el ruido de commits mejoraron frente a Gate 100.

Sin embargo, el objetivo principal del repeat — demostrar que el costo marginal de lectura D1 se reduce de forma suficiente antes de Gate 500 — no queda satisfecho de manera robusta.

La ruta canónica mínima reconstruida para producir el estado Evidence final consumió aproximadamente 115,258 D1 rows read, equivalentes a 1,152.58 reads/entrada. Esto mejora 14.1% frente a Gate 100 (1,342.14), pero queda muy lejos del objetivo preferido de 461.6.

Además, si se contabiliza toda la actividad observada del Evidence Farm, incluyendo búsquedas duplicadas posteriores a la verificación y la recuperación del lease vencido, el costo asciende a 167,917 reads, o 1,679.17 reads/entrada: 25.1% peor que Gate 100.

El cuello de botella continúa siendo `triageBatchEvidenceMLS`: tres lotes de 25 consumieron 86,395 reads, equivalentes a 1,151.93 reads por entrada triada. En Gate 100 el triage inicial consumió 55,427 reads sobre 100 entradas, o 554.27 por entrada. Por tanto, el costo de triage por entrada aumentó aproximadamente 107.8%.

## 2. Fuentes evaluadas

- `docs/evidence y provenance/14 Gate 100 Final Report.md`
- `docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json`
- `MLS R32 EDITORIAL/R33 Evidence Farm Protocol R1.md`
- Ledger #672
- Batches efectivos #678, #679, #680, #681 y recuperación #686
- Resultados namespaced del MLS Chat Bridge en `mls chat bridge/results/r33-farm/MLS-R33-CORRECTION-REPEAT-100/`
- Medición read-only final de storage: `r33-report/MLS-R33-CORRECTION-REPEAT-100/metrics-01.json` y `metrics-02.json`

Los 1,996 D1 reads usados exclusivamente para esta medición final se consideran reporting y no forman parte del costo operativo del repeat.

## 3. Resultado final del pool

```yaml
entries: 100
verified: 100
exceptions: 0
pending: 0
activeBatches: 0
conflictsCurrent: 0
gate500Authorized: false
```

El último batch #686 cerró como `done`. El batch #679, que había realizado Evidence real pero no había persistido sus checkpoints del Farm, terminó como `expired / LEASE_TIMEOUT`; #686 recuperó sus 25 entradas sin duplicar escrituras Evidence.

## 4. Storage final

La medición de las 100 entradas devuelve:

```yaml
claimsCurrent: 100
evidenceLinksCurrent: 100
sourceReferencesAcrossEntries: 100
verificationReviewRows: 100
conflictsCurrent: 0
articleRevisionsCurrent: 0

entryOwnedBytes: 238468
referencedSourceBytes: 106467
logicalEvidenceBytes: 344935

averageClaimsPerEntry: 1.00
averageEvidenceLinksPerEntry: 1.00
averageSourceReferencesPerEntry: 1.00
averageLogicalEvidenceBytesPerEntry: 3449.35
```

Comparado con Gate 100:

- 4,015.07 → 3,449.35 logical bytes/entrada;
- mejora aproximada: 14.1%;
- no hay regresión material de storage.

**Resultado storage: PASS.**

## 5. D1 writes

Las operaciones Evidence que produjeron el estado final escribieron 1,836 filas D1:

```yaml
averageD1RowsWrittenPerEntry: 18.36
Gate100: 20.99
change: -12.5%
```

Los reintentos/reconciliaciones posteriores fueron esencialmente read-only, por lo que no aumentaron este total.

**Resultado writes: PASS.**

## 6. D1 reads

### 6.1 Ruta canónica mínima aceptada

Se reconstruyó la ruta que produjo el Evidence final, excluyendo búsquedas duplicadas posteriores a VERIFIED y el snapshot de recuperación #686.

```yaml
d1RowsRead: 115258
averageD1RowsReadPerEntry: 1152.58
Gate100: 1342.14
change: -14.1%
preferredTarget: <461.6
```

Hay mejora, pero sigue siendo un volumen alto.

### 6.2 Actividad observada total del Farm

Incluyendo búsquedas duplicadas, refreshes post-verificación y recuperación:

```yaml
d1RowsRead: 167917
averageD1RowsReadPerEntry: 1679.17
changeVsGate100: +25.1%
```

Esto muestra que la concurrencia y recuperación todavía pueden convertir una mejora teórica en una regresión operativa real.

### 6.3 Triage

Tres batches usaron `triageBatchEvidenceMLS` de forma comparable:

```yaml
entriesTriaged: 75
triageRowsRead: 86395
averageTriageRowsReadPerEntry: 1151.93

Gate100InitialTriageRowsRead: 55427
Gate100TriageRowsReadPerEntry: 554.27
change: +107.8%
```

La implementación actual ejecuta `triageEntry` secuencialmente y cada entrada llama a `reusableSourceCandidates`. Esta consulta hace JOIN + GROUP BY sobre Sources, EvidenceLinks, Claims y Articles y limita después a 200 filas. A medida que crece el Registry, ese patrón amplifica lectura.

**Resultado reads: FAIL FOR SCALE.**

## 7. Registry-first / external discovery

En las 75 entradas con triage explícito:

```yaml
registryFirst: 62
externalDiscoveryRequired: 13
externalDiscoveryRate: 17.33%
```

El lote #681 no usó `triageBatchEvidenceMLS`; consultó Sources directamente y luego propuso Evidence.

Sobre las 100 propuestas aceptadas:

```yaml
sourcesReused: 69
sourcesCreated: 31
sourcesUpdated: 6
```

Como proxy operacional, el Registry ya domina el trabajo y el objetivo de bajar external discovery por debajo de 50% parece cumplido ampliamente. Sin embargo, el indicador formal de triage no fue medido uniformemente para 25/100 entradas, por lo que no debe presentarse como una medición canónica completa de 100.

**Resultado Registry-first: PASS operacional / metodología incompleta.**

## 8. Control plane

Commits únicos que tocaron las rutas commands/results del pool durante la ejecución:

```yaml
controlPlaneCommits: 54
commitsPerEntry: 0.54
Gate100: 0.64
criterion: <=0.64
change: -15.6%
```

**Resultado commits: PASS.**

No obstante, se observó una carrera en Worker Events: checkpoints concurrentes pudieron escribir el cuerpo del Issue partiendo de snapshots obsoletos, causando una regresión temporal del agregado de resultados. La reconciliación secuencial restauró 25/25 y no se perdió Evidence en D1.

El problema no es pérdida de Evidence; es riesgo de lost update en el estado de coordinación GitHub.

**Resultado concurrencia: PASS final / WARN de consistencia.**

## 9. Auditabilidad Source ↔ Claim

Las 100 entradas tienen un claim sustancial, un EvidenceLink y al menos una Source contada por la métrica final.

Sin embargo, al inspeccionar los 100 links aceptados:

```yaml
evidenceLinksInspected: 100
linksWithLocator: 0
linksWithoutLocator: 100
uniqueSourcesReferenced: 42
```

Hay Sources generales reutilizadas por múltiples entradas — hasta 10 entradas por una misma Source. Esto puede ser válido para gramáticas o referencias amplias, pero sin page/chapter/section/urlFragment no se puede demostrar de forma eficiente dónde respalda cada Source el claim concreto.

El estado `VERIFIED` demuestra que el validator y el lifecycle aceptaron el snapshot. No demuestra por sí solo, de forma independiente, que `falseVerified = 0` desde el punto de vista semántico.

**Resultado auditabilidad: WARN / requiere endurecimiento antes de Gate 500.**

## 10. Comparación Gate 100 vs Correction Repeat

| Métrica | Gate 100 | Correction Repeat | Evaluación |
|---|---:|---:|---|
| VERIFIED | 100/100 | 100/100 | PASS |
| Excepciones | 0 | 0 | PASS |
| Logical bytes / entrada | 4015.07 | 3449.35 | PASS |
| D1 writes / entrada | 20.99 | 18.36 | PASS |
| D1 reads / entrada, ruta canónica | 1342.14 | 1152.58 | mejora insuficiente |
| D1 reads / entrada, observado total | 1342.14 | 1679.17 | FAIL |
| Triage reads / entrada | 554.27 | 1151.93 | FAIL |
| Source creates | 48 | 31 | PASS |
| Source reuse | 57 | 69 | PASS |
| Control commits / entrada | 0.64 | 0.54 | PASS |
| Links con locator | no certificado aquí | 0/100 | WARN |

## 11. Decisión

```yaml
CorrectionRepeat:
  quality: PASS
  evidenceLifecycle: PASS
  storage: PASS
  d1Writes: PASS
  registryReuse: PASS
  controlPlaneCommitRate: PASS
  d1Reads: FAIL_FOR_SCALE
  triageScaling: FAIL
  concurrencyConsistency: WARN
  claimSourceAuditability: WARN
  finalDecision: CORRECT_AND_REPEAT
  gate500Authorized: false
```

**Gate 500 no debe autorizarse todavía.**

## 12. Correcciones requeridas antes de Gate 500

### Prioridad 1 — Rediseñar `reusableSourceCandidates` / batch triage

Evitar un JOIN + GROUP BY completo por entrada.

Opciones compatibles:

- precargar una vez por idioma los candidatos y métricas de uso durante el batch;
- agrupar las entradas por idioma y reutilizar el mismo pool candidate en memoria;
- mantener estadísticas de uso de Sources precomputadas/materializadas en lugar de recalcular COUNT DISTINCT para cada entrada;
- filtrar por idioma/topic antes del agregado pesado;
- añadir/validar índices específicos para las rutas de JOIN;
- separar telemetría de article/context lookup y candidate lookup.

Objetivo: que el costo de triage crezca con idiomas/batches, no linealmente con cada entrada × tamaño del Registry.

### Prioridad 2 — Unificar el protocolo de medición

Las 100 entradas del próximo benchmark deben pasar por la misma ruta de clasificación, o debe versionarse formalmente una ruta nueva que sustituya `triageBatchEvidenceMLS`.

No mezclar 75 entradas con triage formal y 25 con lookup directo si el objetivo es medir external discovery comparable.

### Prioridad 3 — Eliminar lost updates de Worker Events

El worker debe refetch el estado más reciente del Issue antes de aplicar cada evento y usar una estrategia de retry/merge cuando otro evento lo haya cambiado.

No confiar exclusivamente en el snapshot del payload `issue_comment`.

### Prioridad 4 — Mejorar locators

Para claims sustanciales respaldados por libros, capítulos, documentos largos o páginas con secciones identificables, registrar page/pageRange/chapter/section/urlFragment cuando exista.

La meta no debe ser “poner locator artificial a todo”, sino hacer claim-specific la evidencia cuando el recurso lo permite.

## 13. Condición para la próxima reevaluación

Antes de cambiar `gate500Authorized` a true, ejecutar un benchmark fresco y homogéneo que demuestre simultáneamente:

```yaml
quality:
  verified: 100%
  exceptions: 0_or_controlled
  falseVerified: 0_after_audit

scale:
  externalDiscoveryRequired: <50%
  averageD1RowsReadPerEntry: materially_lower_than_1152.58
  preferredAverageD1RowsReadPerEntry: <461.6
  triageRowsReadPerEntry: materially_lower_than_554.27
  controlPlaneCommitsPerEntry: <=0.64
  d1RowsWrittenPerEntry: no_material_regression
  logicalEvidenceBytesPerEntry: no_material_regression

controlPlane:
  lostUpdateRace: eliminated_or_proven_safe
```

Hasta entonces, el estado correcto es:

**PASS QUALITY / CORRECT AND REPEAT SCALE / GATE 500 BLOCKED.**


## 14. Addendum — arquitectura GitHub-native

Después de esta evaluación se adoptó una regla arquitectónica más estricta: Cloudflare/D1 ya no forman parte del proceso editorial. Por tanto, las métricas D1 de este reporte quedan como diagnóstico histórico del pipeline sustituido, no como KPI del próximo gate.

El próximo benchmark debe certificar `0 D1 reads`, `0 D1 writes` y `0 interacciones Cloudflare editoriales`. Gate 500 permanece bloqueado hasta certificar el flujo GitHub-native.
