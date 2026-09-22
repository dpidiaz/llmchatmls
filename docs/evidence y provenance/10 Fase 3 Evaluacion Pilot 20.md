# MLS R33 Evidence & Provenance — Fase 3 Evaluación del Pilot 20

**Fecha:** 2026-09-21 / 2026-09-22 UTC  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Pilot result:** COMPLETE — PASS WITH FINDINGS  
**Decision:** **GO**  
**Gate 100:** **READY — SCALE RUNTIME NOT LIVE YET**

## 1. Resumen ejecutivo

El Pilot 20 demostró que la arquitectura R33 funciona en sus garantías principales:

- no produjo falsos VERIFIED observados;
- bloqueó un conflicto sustantivo real;
- bloqueó dos claims insuficientemente sustentados sin inventar contradicción;
- preservó R32 y evitó silent overwrite;
- mantuvo FREE ONLY;
- mantuvo APA 7 / URL-GT-2025 consistente;
- mantuvo Evidence runtime independiente de GitHub.

El piloto no justifica todavía Gate 100 porque dejó tres garantías sin demostrar y un problema de identidad de Source que debe corregirse antes de multiplicar escala:

1. DOI de recurso específico vs DOI de obra/contenedor;
2. reuse de Source entre artículos distintos;
3. lifecycle REVIEWED humano real.

Además, el control plane basado en un commit por comando produjo demasiado ruido operativo para un gate de 100 entradas.

La decisión no es STOP porque las garantías centrales funcionaron. Tampoco es GO porque escalar sin cerrar estos huecos convertiría hallazgos pequeños en deuda estructural.

## 2. Resultado cuantitativo del Pilot 20

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

Descriptivamente:

- 17/20 entradas = 85% llegaron a VERIFIED;
- 53/55 claims sustanciales = 96.36% alcanzaron cobertura suficiente.

Estos porcentajes no son una medida de accuracy del corpus.

## 3. Respuestas a las 14 preguntas obligatorias

### 3.1 ¿Qué porcentaje de claims quedó realmente verificado?

53 de 55 claims sustanciales alcanzaron cobertura suficiente: aproximadamente 96.36%.

Pero dos claims no tuvieron soporte suficiente y el sistema correctamente bloqueó las entradas correspondientes.

**Evaluación:** PASS.

### 3.2 ¿Cuántas fuentes se reutilizaron?

Se observaron 3 operaciones de reuse por retry/enrichment, incluida actualización de metadata sin cambiar Source ID.

No apareció reutilización natural de la misma Source entre dos artículos diferentes.

**Evaluación:** INCOMPLETE. Debe ejercitarse cross-entry reuse antes de Gate 100.

### 3.3 ¿Cuántos conflictos reales aparecieron?

1 conflicto sustantivo real:

`MLS-V04-0174 — celui-ci / celui-là`.

El backend bloqueó VERIFIED y creó una revisión propuesta sin overwrite.

**Evaluación:** PASS.

### 3.4 ¿Cuánto review manual se requiere?

No se fabricó ningún review humano:

```yaml
humanEditorialReviewEvents: 0
reviewedEntries: 0
```

Por tanto, el costo y comportamiento live de REVIEWED siguen sin medirse.

**Evaluación:** INCOMPLETE. Se requiere al menos un ejercicio humano real.

### 3.5 ¿Cuál es el costo D1 por entrada?

Promedio observado:

- 461.6 exact rows read / entrada;
- 50 exact rows written / entrada.

Extrapolación matemática, no forecast, a 10,133 entradas:

- ~4,677,393 rows read;
- ~506,650 rows written.

Con los límites actuales de Workers Free, 5M reads/día y 100k writes/día, reads podrían aproximarse al límite diario y writes lo excederían ampliamente si se intentara todo en un día.

**Evaluación:** PASS para gates/lotes controlados; FAIL para migración masiva en un día.

### 3.6 ¿Cuál es el costo GitHub por batch?

Evidence runtime:

```yaml
githubRequests: 0
githubMutations: 0
```

Control plane del Pilot:

```yaml
controlPlaneCommitsSinceBaseline: 197
controlBranchBlobDeltaBytes: 788553
githubTransportRequests: null
```

El Bridge funciona, pero un patrón cercano a múltiples commits por operación no es adecuado para Gate 100.

**Evaluación:** CORRECT BEFORE SCALE.

### 3.7 ¿Cuál es el crecimiento medio en bytes?

8,819.95 logical Evidence bytes por entrada.

Extrapolación matemática a 10,133 entradas: ~89.4 MB decimales (~85.2 MiB) de payload lógico medido con Sources referenciadas incluidas.

Esto no es tamaño físico SQLite y puede sobrecontar metadata Source compartida.

**Evaluación:** PASS.

### 3.8 ¿Cuántos false matches ocurrieron?

No se observó un false match de Source/Claim aceptado silenciosamente.

Sí se detectó preventivamente un riesgo de falso dedupe por DOI de obra compartido entre fichas distintas.

**Evaluación:** PASS en operación; arquitectura DOI requiere corrección.

### 3.9 ¿El modelo de claims es demasiado granular?

Promedio: 2.75 claims sustanciales por entrada.

El piloto pudo representar:

- reglas compactas;
- variación;
- pragmática;
- ortografía;
- pronunciación;
- datos numéricos;
- claims de frecuencia;
- conflictos.

No se observó explosión de claims por oración o ejemplo.

**Evaluación:** PASS.

### 3.10 ¿Los source tiers están funcionando?

Los tiers bloquearon correctamente autoridad insuficiente para claims normativos cuando aplicaba y permitieron combinar fuentes institucionales/académicas.

No se observó promoción por Tier X ni evidencia basada en IA.

**Evaluación:** PASS.

### 3.11 ¿La política por idioma necesita ajustes?

Los 10 idiomas fueron ejercitados.

Hallazgos de chino y coreano demostraron que las policies permiten gaps de evidencia sin inventar conflicto. Japonés manejó cambio normativo de romanización sin colapsar variación histórica.

No se requiere cambio global inmediato de tiers/policies.

**Evaluación:** PASS WITH MONITORING.

### 3.12 ¿El renderer APA produce salidas consistentes?

0 fallos APA finales.

1 ficha académica necesitó completar `articleNumber=e18257` antes de verificar; después el renderer quedó válido.

**Evaluación:** PASS.

### 3.13 ¿Virtuoso/Profesor IA pueden consumir el estado sin exagerarlo?

Foundation expone estado, sources, provenance y métricas privadas.

Pero no existe todavía una certificación live de Virtuoso/Profesor IA consumiendo:

- UNSOURCED;
- SOURCED;
- VERIFIED;
- REVIEWED;
- needsReview;
- revisión propuesta.

**Evaluación:** NOT DEMONSTRATED. No bloquea la corrección del backend, pero debe cerrarse antes del lanzamiento lector completo de R33.

### 3.14 ¿UNSOURCED sigue funcionando sin degradar R32?

Sí.

R32 siguió siendo legible y operativo; Evidence fue aditiva. Ninguna revisión propuesta sobrescribió `wiki_articles`.

**Evaluación:** PASS.

## 4. Hallazgos bloqueantes para Gate 100

### E1 — DOI identity scope — CLOSED LIVE

**Correction Repeat:** PASS LIVE. Commands 0274–0279 demostraron URLs granulares distintas con el mismo DOI de contenedor y re-verificación posterior.

Problema:

Un DOI puede identificar:

- el recurso granular exacto;
- una obra o contenedor que contiene varias fichas.

El Source Registry actual prioriza DOI sobre URL. Si el DOI de contenedor se copia a cada ficha, dos recursos distintos pueden colisionar.

Corrección requerida:

```
doiScope = resource | container
```

Regla objetivo:

- `resource`: DOI puede ser identidad primaria;
- `container`: DOI se conserva como metadata, pero NO identifica la Source granular;
- una Source con `doiScope=container` debe disponer de canonical URL o identidad granular equivalente;
- APA para una ficha granular no debe reemplazar su canonical URL por el DOI del contenedor.

### E2 — Cross-entry Source reuse — CLOSED LIVE

**Correction Repeat:** PASS LIVE. Commands 0269–0271 reutilizaron `MLS-SRC-13608E329726A3D4557A` entre artículos distintos y preservaron invalidación/re-verificación por snapshot.

Debe demostrarse live que dos artículos distintos pueden referenciar el mismo Source ID sin:

- duplicarlo;
- cambiar su metadata;
- invalidar incorrectamente la otra entrada.

### E3 — Human REVIEWED lifecycle — CLOSED LIVE

PASS LIVE. El usuario aprobó explícitamente `MLS-V10-0020` después de revisar la entrada y sus fuentes. Command 0285 registró un `editorial_review` con `reviewer_type=human`, preservó el mismo Evidence snapshot y promovió VERIFIED → REVIEWED. Estado final: 3/3 claims verificados, 3 Sources, 0 conflictos, needsReview=false, evidenceRevision=3.

### E4 — Control plane scaling — MITIGATED

**Correction Repeat:** batch envelope live command 0280 procesó 3/3 operaciones con un command/result pair. Build watch path externo queda documentado como configuración recomendada, no como cambio aplicado por repositorio.

Cloudflare Workers Builds observa por defecto cambios Git según Branch control / Build watch paths.

Los comandos/resultados de `mls chat bridge/*` no deberían generar versiones preview del Worker si no cambian runtime.

Corrección recomendada:

- excluir `mls chat bridge/*` de Build watch paths, o
- rediseñar el transporte de control para reducir commits/builds.

### E5 — Consumer evidence contract — CODE + CI PASS

**Correction Repeat:** contrato determinista implementado para UNSOURCED/SOURCED/VERIFIED/REVIEWED, needsReview y revisiones propuestas; Profesor IA lo recibe como system guidance y Virtuoso anota resultados después del reranking. PR #145 runs #337/#338 PASS; production deploy SKIPPED.

Virtuoso y Profesor IA necesitan una capa de consumo read-only que prohíba frases equivalentes a “comprobado” cuando el estado no sea VERIFIED/REVIEWED.

No requiere todavía cambiar ranking de búsqueda.

## 5. Correcciones no bloqueantes

- mantener tres revisiones de artículo como `proposed` hasta review/integración explícitos;
- no convertir `needsReview=0` en sinónimo de VERIFIED;
- seguir midiendo metadata corrections APA;
- mantener source pools concretos vacíos hasta verificación real.

## 6. Repeat mínimo requerido

No repetir las 20 entradas completas.

Crear un **Correction Repeat** pequeño y dirigido, suficiente para demostrar los huecos:

1. dos Sources con el mismo DOI de contenedor pero URLs granulares distintas → IDs distintos;
2. una Source con DOI de recurso → dedupe por DOI preservado;
3. una Source reutilizada entre dos artículos diferentes → mismo Source ID;
4. un VERIFIED sometido a review humano real → REVIEWED;
5. consumer contract con UNSOURCED / SOURCED / VERIFIED / REVIEWED;
6. certificar que control-plane transport no causa builds innecesarios o documentar la configuración externa pendiente.

## 7. Decision

**GO**

Interpretación:

- E1–E5 quedaron demostrados;
- el repeat dirigido cerró los huecos estructurales del Pilot 20;
- Gate 100 queda autorizado metodológicamente;
- Gate 100 debe usar batch triage + Registry-first + exception-first;
- no se autoriza volver al patrón artesanal por entrada del Pilot 20;
- la ejecución live del Gate 100 comienza únicamente cuando el runtime de scalability prep de PR #146 esté disponible.

## 8. Exit criteria de la corrección

Para reabrir la decisión:

- [x] DOI scope implementado y testeado.
- [x] Migración D1 aditiva/idempotente.
- [x] APA respeta DOI de contenedor vs recurso.
- [x] Cross-entry Source reuse demostrado live.
- [x] REVIEWED humano demostrado live.
- [x] Consumer evidence contract testeado.
- [x] Control-plane builds mitigados o aceptados con configuración documentada.
- [x] Full regression verde.
- [x] FREE ONLY preservado.
- [x] R32 preservado.

Solo entonces reevaluar GO hacia Gate 100.


## 9. Correction Repeat — actualización 2026-09-22

Documento detallado: `11 Correction Repeat E1 E2 E4 E5.md`.

Estado:

- E1: PASS LIVE;
- E2: PASS LIVE;
- E3: PENDING HUMAN;
- E4: PASS / MITIGATED;
- E5: CODE + CI PASS;
- full regression: PASS runs #337 y #338;
- production deploy en esos workflows: SKIPPED.

La decisión general permanece **CORRECT AND REPEAT** porque E3 no puede ser sustituido por una simulación de review humano.

Gate 100 continúa **NOT AUTHORIZED**.

## 10. E3 Human REVIEWED — cierre live 2026-09-22

- Entry: `MLS-V10-0020`.
- Command: `0285`.
- HTTP: 200.
- Before: VERIFIED, evidenceRevision 2.
- After: REVIEWED, evidenceRevision 3.
- Claims: 3/3 verified.
- Sources: 3.
- Conflicts: 0.
- needsReview: false.
- editorialReviewId: `MLS-REVW-6D2F925AD10C240E9AD96E59`.
- reviewedAt: `2026-09-22T06:04:13.978Z`.
- Human review was explicit; no synthetic reviewer event was created.

**Final Phase 3 decision: GO.**
