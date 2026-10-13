# MLS-SND — Source canonicalization wave 02

**Fecha:** 2026-10-11  
**Tipo:** integración de fuentes + SOURCE-ID-INTEGRITY.

## Objetivo

Resolver IDs locales ya integrados en entradas de comparación y español de Guatemala sin cambiar el alcance lingüístico de los claims.

## Mapeo canónico

| ID local de procedencia | ID canónico | Fuente |
|---|---|---|
| CMP-PROP-001 | SND-SRC-0051 | Lee & Iverson (2017) |
| CMP-PROP-002 | SND-SRC-0052 | Cavar et al. (2025) |
| ESGT-W2-S01 | SND-SRC-0053 | Baird (2020) |
| ESGT-W04-SRC-01 | SND-SRC-0054 | Baird & Regan (2025) |
| ESGT-W04-SRC-02 | SND-SRC-0055 | RAE/ASALE (2010), Ortografía |
| ESGT-W04-SRC-03 | SND-SRC-0056 | RAE/ASALE (2012), Ortografía básica §2.4.2 |

Los aliases locales se conservan únicamente en source maps/provenance de las waves; las entradas y sus tablas de claims usan IDs canónicos.

## Deduplicación

- SND-SRC-0051 y SND-SRC-0052 ya habían sido canonicalizadas por otra wave; se reutilizaron y no se duplicaron.
- SND-SRC-0053…0056 estaban libres en el Source Registry al iniciar esta integración.
- DOI/URL, autoría, año, título y alcance fueron comparados con los source maps de origen.

## Gate por entrada

### SND-CMP-001

- claims C01/C02 mantienen los mismos localizadores auditados;
- solo cambia la identidad del source ID;
- las fuentes canónicas 0051/0052 son las mismas obras;
- resultado: **EVIDENCE_CHECKED**.

### SND-ESGT-003

- C01–C05 continúan respaldados por SND-SRC-0025;
- C06–C07 usan SND-SRC-0053 y permanecen limitados explícitamente al abstract;
- no se añaden valores formánticos, estadística ni claims internos no visibles;
- resultado: **EVIDENCE_CHECKED** para el texto vigente.

### SND-ESGT-009

- SND-SRC-0054 corresponde a la misma obra Baird & Regan (2025) verificada en la wave;
- se mantienen población, fenómeno y límites de contacto;
- resultado: **EVIDENCE_CHECKED**.

### SND-ESGT-010

- SND-SRC-0055/0056 corresponden a recursos oficiales RAE/ASALE usados por la wave;
- se mantiene la distinción fuente ortográfica ≠ descripción fonética guatemalteca;
- resultado: **EVIDENCE_CHECKED**.

## Entradas no promovidas

**SND-ESGT-004** permanece DRAFTED. Su bloqueo no es de identidad de fuente: requiere revisión lingüística de terminología descriptiva histórica y de la función de mapa consonántico.

## SOURCE-ID-INTEGRITY

Criterios:

- todo ID canónico citado por las cuatro entradas existe en el Source Registry de esta branch;
- no quedan IDs locales como referencias activas en sus tablas de claims;
- los source maps históricos conservan el mapeo por trazabilidad;
- canonicalizar una fuente no cambia por sí solo su tier, alcance o localizadores;
- no se promueve ninguna entrada más allá de EVIDENCE_CHECKED.

**Resultado:** PASS para esta wave, sujeto a una última comprobación de colisiones contra la rama matriz inmediatamente antes del merge.
