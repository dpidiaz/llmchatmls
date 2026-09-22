# MLS R33 Evidence & Provenance — Pilot 20 Checkpoint 13–16

**Fecha:** 2026-09-21  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Run ID:** `MLS-R33-EVIDENCE-PILOT-20-20260921-A`  
**Estado:** PASS WITH FINDING — continuar con entradas 17–20  
**Corpus canónico modificado:** no  
**Article revisions propuestas en este bloque:** 1  
**Editorial reviews humanas:** 0

## 1. Resultados por entrada

| # | Código | Estado final | Sources | Claims | Claims cubiertos | Links | Conflicts | Revisions | Logical Evidence bytes |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 13 | MLS-V06-0010 | VERIFIED | 2 | 2 | 2 | 4 | 0 | 0 | 6,706 |
| 14 | MLS-V06-0822 | VERIFIED | 3 | 3 | 3 | 5 | 0 | 0 | 8,988 |
| 15 | MLS-V07-0152 | VERIFIED | 4 | 3 | 3 | 5 | 0 | 0 | 9,391 |
| 16 | MLS-V07-0813 | SOURCED | 4 | 4 | 3 | 8 | 0 | 1 proposed | 17,892 |

## 2. Hallazgo principal — entrada 16

La entrada canónica `MLS-V07-0813` afirma que la partícula **啦** reduce por sí misma la fuerza del rechazo en `沒有啦` y enumera una serie de tonos interpersonales como efecto de la partícula.

La investigación del piloto sí confirmó:

- usos discursivo-pragmáticos de **沒有** en el mandarín de Taiwán;
- el uso de **沒有** como respuesta a elogios y agradecimientos;
- el ejemplo documentado `你中文說得很流利。— 沒有啦，我中文還有待加強。`;
- **啦** como partícula final del mandarín de Taiwán;
- su función descrita en la literatura como cierre de unidad discursiva y/o señal de ajuste explícito o implícito;
- que su contribución es contextual y no equivale a una traducción léxica fija.

No se encontró evidencia suficiente para sostener como regla general la formulación causal más fuerte:

> `啦` → reduce necesariamente la fuerza del rechazo / produce por sí sola un repertorio fijo de tonos.

Por ello se modelaron 4 claims sustanciales, pero solo 3 alcanzaron cobertura verificable. El cuarto recibió únicamente links `contextualizes`; el backend respondió:

```yaml
status: SOURCED
claimsTotal: 4
claimsVerified: 3
coverageComplete: false
citationReady: false
canVerify: false
```

Esto evita citation laundering.

Se creó una revisión propuesta:

`MLS-ARTREV-76D3ACB29540CC3F85EA22E2`

La revisión sustituye la causalidad no demostrada por la formulación sustentada: **啦** marca un ajuste pragmático y su efecto concreto depende de la interacción, el contexto y la prosodia.

El artículo R32 no fue sobrescrito.

## 3. Hallazgos secundarios

### Entrada 13 — romanización japonesa

La norma oficial japonesa vigente desde 2025 usa `し = shi`. La documentación oficial también permite contrastar con sistemas anteriores donde aparecía `si`.

La Evidence claim evita describir `si` como un simple artificio pedagógico y lo trata correctamente como diferencia de romanización histórica/sistemática.

La entrada alcanzó VERIFIED porque la formulación del claim verificable fue compatible con la información canónica sustancial y las fuentes oficiales.

### Entrada 14 — “conector formal”

El piloto confirmó que `接続詞` organiza relaciones discursivas y que formas como `したがって`, `さらに`, `一方` y `ただし` desempeñan relaciones distintas.

También confirmó que “conector formal” no es una categoría gramatical cerrada: la distribución depende del género y del tipo de texto.

### Entrada 15 — 億 en Taiwán

Las cuatro Sources provinieron del diccionario oficial del Ministerio de Educación de Taiwán.

Se confirmó:

- `億 = 100,000,000`;
- `萬 = 10,000`;
- `億 = 萬 × 萬`;
- `億` es `數詞`, no `量詞`.

## 4. Métricas del bloque 13–16

```yaml
entriesProcessed: 4
entriesVerified: 3
entriesSourcedNotVerified: 1
sourcesCreated: 13
sourcesReusedCrossEntry: 0
claimsCreated: 12
claimsCoverageQualified: 11
evidenceLinks: 22
evidenceConflicts: 0
needsReviewByConflict: 0
articleRevisionsProposed: 1
verificationReviewsCreated: 3
humanReviewEvents: 0
apaValidationFailures: 0
d1RowsRead: 1906
d1RowsWritten: 238
logicalEvidenceBytes: 42977
averageEvidenceBytesPerEntry: 10744.25
```

## 5. Métricas acumuladas 1–16

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
averageD1RowsReadPerEntry: 457.8125
averageD1RowsWrittenPerEntry: 49.0625
averageEvidenceBytesPerEntry: 8425.9375
averageSourcesPerEntry: 2.75
averageClaimsPerEntry: 2.6875
averageEvidenceLinksPerEntry: 4
apaValidationFailures: 0
humanReviewEvents: 0
```

Las dos entradas no VERIFIED son distintas:

- entrada 9: `SOURCED + needsReview` por conflicto sustantivo;
- entrada 16: `SOURCED` por un claim sustancial insuficientemente respaldado, sin inventar una contradicción.

## 6. D1 / FREE ONLY

El bloque completo consumió:

- 1,906 exact rows read;
- 238 exact rows written.

Acumulado a 16 entradas:

- 7,325 exact rows read;
- 785 exact rows written.

El piloto continúa ampliamente dentro del presupuesto D1 Free observado. Estas cifras no autorizan una migración masiva.

## 7. GitHub / control plane

```yaml
evidenceRuntimeGitHubRequests: 0
evidenceRuntimeGitHubMutations: 0
controlPlaneCommitsSincePilotBaseline: 158
controlBranchBlobDeltaBytes: 621522
githubTransportRequestCount: null
```

El crecimiento corresponde al Bridge de control, comandos y resultados; no a Evidence runtime.

## 8. Stop conditions audit

| Condición | Resultado |
| --- | --- |
| falso VERIFIED | NO OBSERVADO |
| source metadata inventada | NO OBSERVADO |
| locator inventado | NO OBSERVADO |
| discovery tratado como verification | NO |
| version mismatch | NO |
| dedupe inestable | NO OBSERVADO |
| silent overwrite | NO |
| claim no sustentado forzado a VERIFIED | NO — entrada 16 fue bloqueada |
| contradicción sustantiva ignorada | NO |
| variación regional tratada como error | NO |
| APA perdida | NO |
| telemetry ausente | NO |
| FREE ONLY incompatible | NO |
| cuota agotada | NO |

## 9. Decisión

**PASS WITH FINDING — continuar con entradas 17–20.**

El hallazgo de la entrada 16 valida el objetivo del piloto: la infraestructura distingue entre “hay fuentes relacionadas” y “el claim exacto está suficientemente sustentado”.

No se autoriza Gate 100 ni integración automática de las revisiones propuestas.
