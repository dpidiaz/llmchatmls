# MLS R33 Evidence & Provenance — Pilot 20 Checkpoint 9–12

**Fecha:** 2026-09-21  
**Pilot ID:** `MLS-R33-EVIDENCE-PILOT-20`  
**Run ID de verificación:** `MLS-R33-EVIDENCE-PILOT-20-20260921-A`  
**Estado:** PASS WITH FINDING — continuar con entradas 13–16  
**Corpus canónico modificado:** no  
**Article revisions propuestas:** 1  
**Editorial reviews humanas:** 0

## 1. Resultado del bloque

| # | Código | Estado final | Sources | Claims | Links | Conflicts | needsReview | D1 read | D1 written | Logical Evidence bytes | Verification review |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 9 | MLS-V04-0174 | SOURCED | 4 | 3 | 5 | 1 | 1 | 319 | 67 | 13,804 | — |
| 10 | MLS-V04-0927 | VERIFIED | 3 | 3 | 4 | 0 | 0 | 512 | 50 | 8,336 | MLS-REVW-BA0940C45861004A4DEADF9E |
| 11 | MLS-V05-0165 | VERIFIED | 3 | 3 | 3 | 0 | 0 | 481 | 45 | 7,598 | MLS-REVW-C8A4165EC128410C3E76E092 |
| 12 | MLS-V05-0881 | VERIFIED | 3 | 3 | 4 | 0 | 0 | 512 | 50 | 8,232 | MLS-REVW-3D2B7F91162A1EB49AFA446F |

Los D1 rows incluyen exactamente las operaciones realmente ejecutadas.

## 2. Hallazgo principal — entrada 9

`MLS-V04-0174 — celui-ci / celui-là` produjo el primer conflicto sustantivo real del Pilot 20.

La versión canónica decía, en esencia:

- `-ci` = primero de dos elementos;
- `-là` = segundo de dos elementos.

Las fuentes OQLF/CNRTL consultadas muestran que esa formulación no es segura como regla general. En referencia textual de dos antecedentes:

- `celui-ci` puede retomar el último mencionado;
- `celui-là` puede retomar el primero.

Además:

- `-ci/-là` expresan principalmente proximidad/distancia o contraste contextual;
- en lengua hablada `-là` puede aparecer sin oposición estricta de distancia.

Resultado R33:

```yaml
status: SOURCED
claimsTotal: 3
claimsVerified: 3
sourcesTotal: 4
conflictsTotal: 1
needsReview: true
canVerify: false
```

El backend bloqueó VERIFIED por:

`unresolved_substantive_conflict`

Se creó únicamente una revisión propuesta:

`MLS-ARTREV-624FF06CE1F0EB39C9214F60`

La revisión:

- corrige la regla insegura;
- conserva el artículo R32 intacto;
- no integra automáticamente el cambio;
- espera flujo editorial/review posterior.

Esto valida una propiedad central de R33:

**Evidence puede descubrir que un artículo canónico necesita corrección sin sobrescribirlo ni promoverlo falsamente a VERIFIED.**

## 3. Entradas 10–12

### MLS-V04-0927 — c’est pourquoi

- 3/3 Claims;
- 3 Sources;
- 4 Links;
- 0 conflictos;
- APA 7 válida;
- VERIFIED.

Se evitó convertir comparaciones de estilo con `donc` o `par conséquent` en reglas absolutas. El claim central se limitó a la relación de consecuencia.

### MLS-V05-0165 — keinem/keiner/keinem en dativo

- 3/3 Claims;
- 3 Sources;
- 3 Links;
- 0 conflictos;
- APA 7 válida;
- VERIFIED.

Claims cubiertos:

- paradigma de `kein-` en dativo;
- `-n` del dativo plural;
- `mit` + dativo.

### MLS-V05-0881 — laut + dativo/genitivo

- 3/3 Claims;
- 3 Sources;
- 4 Links;
- 0 conflictos;
- APA 7 válida;
- VERIFIED.

La formulación verificada es deliberadamente más cauta que la versión pedagógica inicial:

- `laut` atribuye información a una fuente;
- dativo es el patrón ordinario;
- genitivo también está documentado, pero es menos frecuente;
- no se enseña uno de los dos como única opción correcta.

## 4. Source identity granularity finding

El diccionario de preposiciones de IDS/grammis puede compartir un DOI de obra entre fichas distintas, por ejemplo `mit` y `laut`.

El Source Registry prioriza DOI sobre URL para identidad.

Si se usara ese DOI común como identidad para cada ficha individual, dos recursos distintos podrían colisionar como si fueran la misma Source.

Mitigación aplicada en la entrada 12:

- la ficha específica `laut` se registró por su canonical URL;
- no se usó el DOI de obra como identidad de esa ficha;
- no se produjo falso dedupe.

Hallazgo de arquitectura:

**el Source Registry necesita distinguir entre DOI de recurso específico y DOI de obra/contenedor compartido antes del Gate 100.**

No bloquea el Pilot 20, pero debe entrar a Fase 3 como criterio de evaluación.

## 5. Métricas del checkpoint 9–12

```yaml
entriesProcessed: 4
entriesVerified: 3
entriesSourcedNeedsReview: 1
sourcesCreated: 13
sourceReuseOperations: 0
sourceMetadataUpdates: 0
crossEntrySourceReuse: 0
claimsCreated: 12
claimsVerifiedByCoverage: 12
evidenceLinksCreated: 16
evidenceConflicts: 1
needsReview: 1
verificationAttempts: 3
verificationReviewsCreated: 3
articleRevisionsProposed: 1
d1RowsRead: 1824
d1RowsWritten: 212
logicalEvidenceBytes: 37970
averageD1RowsReadPerEntry: 456
averageD1RowsWrittenPerEntry: 53
averageEvidenceBytesPerEntry: 9492.5
averageSourcesPerEntry: 3.25
averageClaimsPerEntry: 3
averageEvidenceLinksPerEntry: 4
apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 0
manualHumanReviewEvents: 0
```

El mayor tamaño medio del bloque se explica principalmente por la entrada 9:

- 1 conflicto persistido;
- 2 revisiones de artículo almacenadas: baseline + proposed;
- 4 Sources y 5 Links.

## 6. Métricas acumuladas 1–12

```yaml
entriesProcessed: 12
entriesVerified: 11
entriesSourcedNeedsReview: 1
entriesReviewedHuman: 0
sourcesCreated: 31
sourceReuseOperations: 2
sourceMetadataUpdates: 1
crossEntrySourceReuse: 0
claimsCreated: 31
claimReuseOperations: 2
claimsVerifiedByCoverage: 31
evidenceLinks: 42
evidenceLinkReuseOperations: 3
evidenceConflicts: 1
needsReview: 1
verificationAttempts: 11
verificationReviewsCreated: 11
articleRevisionsProposed: 1
d1RowsRead: 5419
d1RowsWritten: 547
logicalEvidenceBytes: 91838
averageD1RowsReadPerEntry: 451.5833333333333
averageD1RowsWrittenPerEntry: 45.583333333333336
averageEvidenceBytesPerEntry: 7653.166666666667
averageSourcesPerEntry: 2.5833333333333335
averageClaimsPerEntry: 2.5833333333333335
averageEvidenceLinksPerEntry: 3.5
apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 1
manualHumanReviewEvents: 0
```

Importante:

`claimsVerifiedByCoverage=31` no significa que 31 Claims estén en una entrada VERIFIED. Los tres Claims de la entrada 9 tienen cobertura Evidence suficiente, pero el conflicto sustantivo del artículo bloquea el estado VERIFIED global.

## 7. Proyección lineal del Pilot 20

Basada únicamente en los primeros 12 casos:

```yaml
pilot20ProjectedRowsRead: 9031.666666666666
pilot20ProjectedRowsWritten: 911.6666666666667
pilot20ProjectedLogicalEvidenceBytes: 153063.33333333334
```

El Pilot 20 sigue siendo compatible con FREE ONLY bajo el costo observado.

No extrapolar esto como autorización de migración masiva.

## 8. GitHub / control plane

Evidence runtime continúa sin usar GitHub como runtime DB:

```yaml
runtimeGitHubRequests: 0
runtimeGitHubMutations: 0
mainRepoEvidenceDataDeltaBytes: 0
```

Control plane del bloque 9–12:

```yaml
controlHead: d6357426b2c0b1850c4b0c49525f12cca9878476
controlPlaneCommitsBlock: 38
controlBranchBlobDeltaBytesBlock: 154359
controlChangedFilesBlock: 41
```

Acumulado desde el baseline del Pilot control plane:

```yaml
controlPlaneCommits: 121
controlBranchBlobDeltaBytes: 456479
controlChangedFiles: 127
githubTransportRequests: null
```

El crecimiento pertenece al Bridge de control, no a Evidence runtime.

## 9. Stop conditions audit

| Stop condition | Resultado |
| --- | --- |
| falso VERIFIED observado | NO |
| source metadata inventada | NO OBSERVADO |
| locator inventado | NO OBSERVADO |
| discovery tratado como verification | NO |
| version mismatch | NO |
| dedupe no determinista | NO |
| cross-entry Source reuse | AÚN NO OBSERVADO |
| silent overwrite | NO |
| contradicción sustantiva ignorada | NO; entry 9 quedó bloqueada |
| variación tratada como error | NO |
| APA metadata perdida | NO |
| telemetry requerida ausente | NO |
| FREE ONLY incompatible | NO |
| cuota D1 agotada | NO |
| Source identity demasiado gruesa por DOI de obra | HALLAZGO; mitigado manualmente por URL |

## 10. Decisión de checkpoint

**PASS WITH FINDING — continuar con entradas 13–16.**

Razones:

- el sistema bloqueó correctamente un caso con conflicto real;
- no hubo falso VERIFIED;
- no hubo overwrite;
- 3 de 4 entradas llegaron a VERIFIED;
- la entrada restante quedó correctamente en `SOURCED + needsReview`;
- la revisión de artículo quedó propuesta, no integrada;
- D1 sigue dentro de FREE ONLY;
- APA sigue estable;
- el hallazgo de granularidad DOI puede evaluarse en Fase 3 sin detener el Pilot 20.

No se autoriza Gate 100 ni escalamiento del corpus.
