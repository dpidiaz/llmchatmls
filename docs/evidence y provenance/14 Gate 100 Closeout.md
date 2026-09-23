# MLS R33 Evidence & Provenance — Gate 100 Closeout

**Fecha:** 2026-09-23 UTC  
**Gate:** R33 Fase 4 — Gate 100  
**Manifest:** `docs/evidence y provenance/13 Gate 100 Manifest.json`  
**Resultado funcional:** COMPLETE — 100/100 VERIFIED  
**Decisión de escalado:** **CORRECT AND REPEAT**  
**Gate 500:** **BLOCKED hasta cerrar R33-G100-C1 (triage D1) y repetir métricas**

## 1. Resumen ejecutivo

Gate 100 completó las 100 entradas exactas del manifest, 10 por idioma y sin sustituir silenciosamente ninguna entrada.

La certificación final (`command 0328`) devolvió:

- 100/100 `complete`;
- 0 `exception`;
- 0 `resume_existing`;
- 0 `needs_evidence`;
- 0 `externalDiscoveryRequired`;
- 0 excepciones finales.

Todas las entradas quedaron en `VERIFIED`. No se fabricó `REVIEWED` humano durante Gate 100; el lifecycle humano requerido ya había sido demostrado antes del gate en Fase 3/E3.

El gate confirma estabilidad de Evidence, APA, verificación, recuperación de errores, batching y operación chat-native. Sin embargo, **no autoriza todavía Gate 500** porque incumple dos criterios de escalabilidad escritos en la preparación del gate:

1. el costo D1 total de lectura por entrada aumentó materialmente respecto al Pilot 20;
2. 52 de 99 entradas que requerían Evidence comenzaron en `external_discovery`, es decir, todavía se investigó desde cero una ligera mayoría.

El principal costo D1 está localizado: `batchTriage` ejecuta `reusableSourceCandidates()` por entrada, y esa función repite un `JOIN + GROUP BY` del Source Registry. Es un patrón N+1 corregible.

## 2. Resultado cuantitativo

```yaml
entriesProcessed: 100
entriesVerified: 100
entriesCompleteFinal: 100
entriesExceptionsFinal: 0
entriesNeedsEvidenceFinal: 0
externalDiscoveryPendingFinal: 0

claimsCurrent: 149
evidenceLinksCurrent: 151
conflictsCurrent: 0
verificationReviewRows: 100
articleRevisionRows: 0
sourceReferencesAcrossEntries: 110  # no equivale a Sources únicas

logicalEvidenceBytes: 401507
averageEvidenceBytesPerEntry: 4015.07

d1RowsReadObservedGate: 136718
d1RowsWrittenObservedGate: 2099
averageD1RowsReadPerEntry: 1367.18
averageD1RowsWrittenPerEntry: 20.99

initialRegistryFirst: 47
initialExternalDiscovery: 52
initialAlreadyComplete: 1
initialEntriesNeedingEvidence: 99

bridgeCommandFilesObserved: 33  # commands 0298–0330
recoverableFailedResultFiles: 3
finalCertificationFailures: 0
```

### Comparación con Pilot 20

| Métrica | Pilot 20 | Gate 100 | Cambio |
| --- | ---: | ---: | ---: |
| D1 reads / entrada | 461.60 | 1367.18 | +196.18% |
| D1 writes / entrada | 50.00 | 20.99 | -58.02% |
| Evidence bytes / entrada | 8819.95 | 4015.07 | -54.48% |
| VERIFIED | 17/20 | 100/100 | mejora funcional |
| Excepciones finales | 3 no VERIFIED / 1 needsReview | 0 | mejora funcional |

El crecimiento lógico proyectado linealmente a 10,133 entradas, usando el promedio Gate 100, sería ~40.68 MB decimales. Es una extrapolación matemática, no tamaño físico SQLite ni forecast.

## 3. D1: causa del incremento de reads

De los 136,718 reads observados en commands 0298–0330:

- triage/read-only de selección y certificación: **105,954 reads**;
- participación del triage en reads totales: **77.50%**;
- métricas finales 0329–0330: 2,504 reads;
- resto del flujo operativo, excluyendo triage y métricas: **28,260 reads**, o **282.60 reads/entrada**.

Por tanto, el pipeline Evidence principal sí redujo el costo de lectura frente al Pilot 20. El aumento total procede del triage.

### Root cause confirmado

En `MLS R32 EDITORIAL/evidence scale.js`:

`batchTriage()` recorre las entradas secuencialmente y cada `triageEntry()` puede llamar `reusableSourceCandidates()`.

`reusableSourceCandidates()` ejecuta para cada entrada una consulta que:

- une `wiki_sources`;
- une `wiki_evidence_links`;
- une `wiki_evidence_claims`;
- une `wiki_articles`;
- agrupa por Source;
- ordena por uso;
- limita a 200 filas.

Para 50 entradas del mismo batch se repite el scan muchas veces aun cuando múltiples entradas comparten idioma y el pool base de Sources es reutilizable.

**Clasificación:** N+1 de triage / candidate discovery.

## 4. Source Registry / discovery

El triage inicial de las 100 entradas produjo:

```yaml
alreadyComplete: 1
needsEvidence: 99
registryFirst: 47
externalDiscovery: 52
exceptions: 0
```

Sobre las 99 que necesitaban Evidence:

- Registry-first: 47/99 = 47.47%;
- External discovery: 52/99 = 52.53%.

Esto demuestra reuse útil del Registry, pero todavía deja una ligera mayoría investigada desde cero. El documento de preparación de Gate 100 especifica `CORRECT AND REPEAT` si se sigue investigando desde cero la mayoría de entradas.

Las métricas de storage cuentan Sources referenciadas por entrada y no permiten reconstruir de forma fiable el número de Sources únicas creadas/reutilizadas durante todo el gate. No se inventa esa cifra en este closeout.

## 5. Incidencias y recuperación

Gate 100 tuvo tres resultados intermedios no exitosos, todos recuperados sin pérdida de estado:

1. `command 0301`: verificación inglesa con una excepción APA; metadata enriquecida y re-verificada.
2. `command 0311`: `EVIDENCE_REVISION_CONFLICT` italiano por concurrencia; se refrescó la revisión y el bloque terminó VERIFIED.
3. `command 0319`: una fuente alemana (`MLS-V05-0951 — Rechtssprache`) no pasaba APA por metadata bibliográfica incompleta; se completaron container, editors, publisher y pages, y terminó VERIFIED.

También se observó una colisión de control-plane al intentar reservar un número de command ya creado por otro worker. GitHub rechazó la sobrescritura y el flujo se reubicó sin pisar comandos existentes.

**Resultado:** 0 errores terminales y 0 excepciones en certificación final.

## 6. Evaluación de criterios

### Correctness
**PASS.** 100/100 VERIFIED, 0 excepciones finales, 0 needs_evidence.

### Idempotency / optimistic concurrency
**PASS WITH EVIDENCE.** Los conflictos de revisión se detectaron y se recuperaron mediante refresh; no hubo overwrite silencioso.

### APA 7 / URL-GT-2025
**PASS WITH RECOVERABLE FINDINGS.** Dos correcciones de metadata fueron necesarias; las entradas afectadas terminaron verificadas.

### Source Registry reuse
**PASS WITH SCALING FINDING.** 47 de 99 necesidades de Evidence pudieron empezar Registry-first, pero 52 requirieron external discovery.

### Storage
**PASS.** 4,015.07 bytes lógicos/entrada, -54.48% frente al Pilot 20.

### D1 writes
**PASS.** 20.99 writes/entrada, -58.02% frente al Pilot 20.

### D1 reads
**FAIL FOR SCALE / CORRECTABLE.** 1,367.18 reads/entrada, +196.18% frente al Pilot 20. El 77.50% se concentra en triage.

### Control plane
**PASS WITH MONITORING.** Gate 100 usó envelopes batch y 33 command files para el recorrido 0298–0330, muy por debajo del patrón granular del Pilot. La cifra no se compara directamente con los 197 commits del Pilot porque son unidades distintas.

### Human REVIEWED
**PRECONDITION ALREADY PASS.** No se generó REVIEWED humano sintético en Gate 100.

## 7. Decisión

`CORRECT AND REPEAT`

No se abre Gate 500 todavía.

La decisión no es STOP porque:

- 100/100 terminaron VERIFIED;
- storage y writes mejoraron materialmente;
- no hubo falsos VERIFIED observados ni conflictos terminales;
- los fallos intermedios fueron recuperables;
- el cuello de botella está localizado y es arquitectónicamente corregible.

No se declara GO porque el criterio de Gate 100 exige que el costo marginal operativo por entrada baje respecto al Pilot 20, y los reads totales no lo hicieron.

## 8. Corrección requerida — R33-G100-C1

Optimizar `batchTriage` para eliminar el N+1 de Source candidates.

Diseño objetivo:

1. cargar el pool base reutilizable de Sources **una vez por idioma por batch**;
2. puntuar localmente ese pool contra los topics de cada entrada;
3. conservar exactamente el contrato actual:
   - `approved:false`;
   - `candidate_only`;
   - claim-specific verification obligatoria;
4. no cambiar semantics de lanes ni discovery modes;
5. mantener endpoint read-only;
6. añadir test que demuestre que 50 entradas del mismo idioma no ejecutan 50 scans del Registry.

## 9. Repeat dirigido

Después de R33-G100-C1:

- repetir triage sobre las mismas 100 entradas o una muestra congelada equivalente sin reescribir Evidence;
- medir exact rows read;
- verificar igualdad funcional de lanes/candidates;
- objetivo de decisión: demostrar que reads/entrada ya no crecen materialmente frente al Pilot 20 y que el batch no presenta N+1.

Si pasa:

`GO → GATE 500`

Si no pasa:

`CORRECT AND REPEAT`

## 10. Evidencia operacional

- `command 0298` — triage inicial.
- `commands 0299–0327` — versiones, proposals, verificaciones y correcciones.
- `command 0328` — certificación final 100/100 complete.
- `command 0329` — métricas primeras 50.
- `command 0330` — métricas segundas 50.

