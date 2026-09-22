# Gate 100 — Scalability Preparation

Estado: PREPARATION ONLY — Gate 100 todavía NO autorizado  
Sistema: MASTER LANGUAGE SYSTEM R33 Evidence & Provenance  
Repositorio: dpidiaz/llmchatmls

## Objetivo

Evitar que Gate 100 repita el patrón artesanal del Pilot 20.

El Pilot 20 fue deliberadamente intensivo en inspección para descubrir fallos de arquitectura. Gate 100 debe medir una arquitectura distinta:

```
BATCH TRIAGE
→ REGISTRY FIRST
→ SOURCE REUSE CANDIDATES
→ EXTERNAL DISCOVERY ONLY WHEN NEEDED
→ PROPOSAL
→ VALIDATE
→ VERIFY
→ EXCEPTIONS SEPARATE
```

No se inicia Gate 100 mientras E3 Human REVIEWED siga pendiente.

## Principios operativos

1. **No una búsqueda web por entrada.** Consultar Source Registry primero.
2. **Candidate is not approved.** Una Source reutilizable nunca equivale a evidencia válida para un claim nuevo.
3. **No CI por entrada.** CI certifica cambios de sistema, no artículos.
4. **No commit de control por operación individual cuando pueda agruparse.** El Bridge admite batches de hasta 50 operaciones.
5. **Exception-first.** needsReview, conflicto o revisión propuesta salen del camino automático.
6. **External discovery only when needed.** Si el Registry ofrece candidatos relevantes, se inspeccionan antes de buscar nuevas fuentes.
7. **Sin autorización implícita.** Las rutas de preparación devuelven `gate100Authorized:false`.

## Runtime preparado

### Reuse candidates

Endpoint privado read-only:

`POST /api/wiki/editorial/evidence/reuse-candidates`

Entrada:

- language
- topics
- limit

Salida:

- Sources activas ya usadas en Evidence;
- conteo de uso por entries y links;
- topics coincidentes;
- candidateScore determinista;
- `approved:false`;
- `reuseStatus:"candidate_only"`;
- `requiresClaimSpecificVerification:true`.

Su función es reducir discovery repetido, no aprobar bibliografía automáticamente.

### Batch triage

Endpoint privado read-only:

`POST /api/wiki/editorial/evidence/triage`

Máximo: 50 entradas.

Lanes:

- `complete` — VERIFIED/REVIEWED; no reprocesar.
- `exception` — needsReview o revisión propuesta; separar para atención manual.
- `resume_existing` — SOURCED; continuar Evidence existente.
- `needs_evidence` — todavía requiere Evidence.

Discovery modes:

- `none`
- `human_or_manual`
- `registry_first`
- `external_discovery`

## Bridge

Nuevas operaciones privadas:

- `candidatosReuseEvidenceMLS`
- `triageBatchEvidenceMLS`

Ambas son read-only.

El Bridge ya soporta envelopes de hasta 50 operaciones, por lo que Gate 100 no debe generar una secuencia commit→resultado por cada lectura individual cuando pueda agruparse.

## Métricas obligatorias de escala

Gate 100 debe comparar contra Pilot 20:

- entriesProcessed;
- Sources nuevas;
- Sources reutilizadas;
- crossEntrySourceReuse;
- registryFirst;
- externalDiscoveryRequired;
- exception count;
- D1 rows read/write por entrada;
- logical Evidence bytes por entrada;
- Bridge command pairs;
- control-plane commits;
- verification attempts;
- manual review burden.

No fijar todavía un porcentaje arbitrario de reuse. Primero medir Gate 100.

## Criterio de escalabilidad

Gate 100 solo será favorable si el costo marginal operativo por entrada baja respecto al Pilot 20.

Se debe considerar CORRECT AND REPEAT si:

- se sigue investigando desde cero la mayoría de entradas;
- reaparece un commit/control command por lectura trivial;
- Source Registry no reduce discovery repetido;
- exception handling bloquea el flujo normal;
- D1 reads/writes por entrada crecen materialmente;
- el sistema exige revisión manual de casi todas las entradas.

## Bloqueo humano

E3 Human REVIEWED continúa pendiente.

No crear:

- reviewerType=human ficticio;
- REVIEWED sintético;
- una aprobación implícita basada en ChatGPT.

Gate 100 permanece bloqueado hasta una revisión humana real sobre un snapshot VERIFIED vigente.

## Estado técnico previo a Gate 100

- E1 DOI scope: PASS LIVE.
- E2 cross-entry Source reuse: PASS LIVE.
- E4 control-plane batch: PASS LIVE.
- E5 consumer contract: PASS LIVE.
- E3 Human REVIEWED: PENDING HUMAN.
- Scalability prep: IMPLEMENTED / CI PENDING.

