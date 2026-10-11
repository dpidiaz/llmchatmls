# MLS-SND — SOURCE-ID-INTEGRITY audit

**Fecha:** 2026-10-11  
**SHA auditado:** `2d2e782916519f36952b39629df433f798413ec1`  
**Rama observada:** `feat/mls-snd-foundation`

> El nombre histórico de la wave era “96/79”, pero el árbol real había avanzado mientras otros chats integraban trabajo. El audit usa el SHA congelado y, por tanto, reporta el corte efectivo **106/91**.

## 1. Resultado

**PASS estructural/referencial — 106 entradas / 91 fuentes.**

- 106 archivos de entrada `SND-*.md`.
- 106 IDs parseables.
- 106 IDs únicos.
- 0 IDs duplicados.
- 91 IDs canónicos `SND-SRC-0001…SND-SRC-0091`.
- 0 referencias `SND-SRC-*` inexistentes entre las 106 entradas escaneadas.
- 106/106 entradas contienen al menos una referencia canónica `SND-SRC-*`.
- 0 entradas en `READY_FOR_COMPOSITION`.

Este PASS **no** valida la corrección semántica de cada claim, el localizador exacto, la licencia de reutilización ni la calidad lingüística. Solo certifica integridad de IDs, presencia referencial y distribución de estados para este SHA.

## 2. Distribución real de estados

| Estado | Entradas |
|---|---:|
| EDITORIAL_REVIEW | 44 |
| LINGUISTIC_REVIEW | 34 |
| EVIDENCE_CHECKED | 22 |
| SOURCE_MAPPED | 2 |
| DRAFTED | 1 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **106** |

## 3. Distribución física por bloque

| Bloque | Entradas |
|---|---:|
| FND | 18 |
| REP | 12 |
| CMP | 1 |
| REF | 1 |
| es-GT / ESGT | 7 |
| en-US / ENUS | 8 |
| pt-BR-rio / PTBR | 2 |
| Italiano / IT | 9 |
| Francés / FR | 9 |
| Alemán / DE | 7 |
| zh-TW / ZHTW | 8 |
| Coreano / KO | 10 |
| Japonés / JA | 6 |
| Ruso / RU | 8 |
| **Total** | **106** |

## 4. Source Registry

En el SHA auditado se detectan **91 IDs canónicos únicos**, desde:

- `SND-SRC-0001`
- hasta `SND-SRC-0091`

El conteo y los extremos implican continuidad numérica para el conjunto de IDs únicos observado.

## 5. Hallazgo de coordinación

El `STATUS.md` leído antes del audit todavía declaraba un snapshot de **96 entradas / 79 fuentes** y contenía una tabla de distribución que seguía sumando 90.

El árbol congelado demuestra que ese documento quedó obsoleto por integraciones paralelas posteriores.

**Regla:** no corregir `STATUS.md` a partir de estimaciones. El integrador debe regenerarlo desde un SHA concreto usando este audit o un linter equivalente.

## 6. Entradas pre-gate todavía visibles

El corte conserva estados anteriores a EVIDENCE_CHECKED:

- 2 SOURCE_MAPPED;
- 1 DRAFTED;
- 1 RESEARCHED;
- 1 RESEARCHED_PARTIAL;
- 1 IN_PROGRESS.

Su mera presencia de un `SND-SRC-*` canónico **no autoriza promoción automática**.

## 7. Alcance del scan

El scan fue exhaustivo para:

- archivos `SND-*.md` presentes en el árbol;
- unicidad de IDs derivables del nombre canónico;
- encabezado `**Estado:**`;
- referencias `SND-SRC-####`;
- existencia de esos IDs en el Source Registry del mismo SHA.

No pretende ser exhaustivo para:

- IDs locales con formatos arbitrarios que no sigan `SND-SRC-####`;
- claims sin tabla R33;
- exactitud de páginas/secciones;
- metadata APA;
- permisos/licencias;
- coherencia lingüística.

Esos controles deben permanecer en gates separados.

## 8. Recomendación

1. Integrar este audit como nuevo corte estructural.
2. Regenerar `STATUS.md` solo después de fijar un SHA de coordinación.
3. Mantener separado el futuro linter de claims/localizadores.
4. No inferir `READY_FOR_COMPOSITION` de `EDITORIAL_REVIEW`.
5. Repetir este scan después de la siguiente ola grande de integraciones.

## 9. Conclusión

**SOURCE-ID-INTEGRITY-106-2026-10-11: PASS estructural/referencial.**

El proyecto tiene más avance del que refleja el snapshot anterior: 106 entradas únicas y 91 fuentes canónicas en el SHA auditado.
