# MLS-SND — SOURCE-ID-INTEGRITY / STATUS audit 106/91

**Fecha:** 2026-10-11  
**SHA de coordinación:** `6020ef0ca75053cdd73a14aaf32896cef02b1704`  
**Rama:** `feat/mls-snd-foundation`

## 1. Definición de entrada canónica

Para este audit cuentan únicamente archivos `SND-*.md` en:

- `docs/pronunciation/fundamentals/`
- `docs/pronunciation/representation/`
- `docs/pronunciation/comparative/`
- `docs/pronunciation/reference/`
- `docs/pronunciation/languages/<perfil>/`

No cuentan como entradas los artefactos en:

- `audits/`
- `reviews/`
- `claims/`
- `editorial/`

aunque su nombre comience por `SND-`.

## 2. Resultado estructural

**PASS — 106 entradas canónicas / 91 fuentes canónicas.**

- 106 archivos de entrada.
- 106 IDs parseables.
- 106 IDs únicos.
- 0 IDs duplicados.
- 91 fuentes canónicas únicas.
- rango canónico: `SND-SRC-0001…SND-SRC-0091`.
- 0 referencias `SND-SRC-*` inexistentes en el scan completo previo.
- 0 entradas `READY_FOR_COMPOSITION`.

## 3. Método reproducible

### Scan completo base

Se escanearon las 106 entradas presentes en:

`2d2e782916519f36952b39629df433f798413ec1`

contra el Source Registry del mismo SHA.

Resultado:

- 106 IDs únicos;
- 91 fuentes;
- ninguna referencia `SND-SRC-*` fuera del registro.

### Diff incremental hasta este SHA

Entre `2d2e782…` y `6020ef0…` no se añadió ni retiró ninguna entrada canónica.

Cambios materiales de estado:

1. **FND-014:** EVIDENCE_CHECKED → LINGUISTIC_REVIEW.
2. **KO-002:** SOURCE_MAPPED → EVIDENCE_CHECKED.

Ambas entradas usan únicamente fuentes ya canónicas.

También se añadió un archivo de review cuyo nombre empieza por `SND-`; queda correctamente excluido por la definición de entrada canónica.

## 4. Distribución canónica de estados

| Estado | Entradas |
|---|---:|
| EDITORIAL_REVIEW | 44 |
| LINGUISTIC_REVIEW | 35 |
| EVIDENCE_CHECKED | 22 |
| SOURCE_MAPPED | 1 |
| DRAFTED | 1 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **106** |

## 5. Distribución por bloque

| Bloque | Entradas | Estado resumido |
|---|---:|---|
| FND | 18 | 10 EDITORIAL_REVIEW; 3 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| REP | 12 | 7 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| CMP | 1 | 1 EVIDENCE_CHECKED |
| REF | 1 | 1 IN_PROGRESS |
| ESGT | 7 | 2 EDITORIAL_REVIEW; 3 EVIDENCE_CHECKED; 1 SOURCE_MAPPED; 1 DRAFTED |
| ENUS | 8 | 2 EDITORIAL_REVIEW; 6 EVIDENCE_CHECKED |
| PTBR | 2 | 2 EDITORIAL_REVIEW |
| IT | 9 | 9 LINGUISTIC_REVIEW |
| FR | 9 | 3 EDITORIAL_REVIEW; 6 LINGUISTIC_REVIEW |
| DE | 7 | 6 LINGUISTIC_REVIEW; 1 RESEARCHED |
| ZHTW | 8 | 6 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED; 1 RESEARCHED_PARTIAL |
| KO | 10 | 9 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED |
| JA | 6 | 2 EDITORIAL_REVIEW; 4 LINGUISTIC_REVIEW |
| RU | 8 | 8 EDITORIAL_REVIEW |
| **Total** | **106** | |

## 6. Entradas todavía pre-gate

- **SOURCE_MAPPED:** ESGT-002.
- **DRAFTED:** ESGT-004.
- **RESEARCHED:** DE-008.
- **RESEARCHED_PARTIAL:** ZHTW-003.
- **IN_PROGRESS:** REF-002.

Estas cinco entradas no se promueven por el mero hecho de usar fuentes canónicas.

## 7. Source Registry

El Source Registry vigente en el SHA de coordinación es **v0.19** y contiene 91 IDs canónicos.

La integridad de identidad de fuente está separada de:

- exactitud de localizadores;
- suficiencia de evidencia por claim;
- licencias;
- revisión lingüística;
- revisión editorial.

## 8. Hallazgo sobre snapshots previos

`STATUS.md`, `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md` todavía conservaban conteos 96/79 y prioridades ya resueltas (por ejemplo ZHTW-009 y KO-002).

Este audit sustituye esos conteos para el SHA indicado.

## 9. Gate

**STATUS-RECONCILIATION-106-91: PASS.**

Este PASS autoriza reconciliar hot files globales con el corte 106/91. No autoriza cambios lingüísticos ni promoción automática de otras entradas.
