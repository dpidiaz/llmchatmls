# MLS-SND — Source-ID Integrity Audit v2

**Fecha:** 2026-10-11.  
**Rama auditada:** snapshot de `feat/mls-snd-foundation` capturado por `snd/source-id-integrity-wave-02`.  
**Resultado:** **PASS**.

## 1. Alcance

Se auditaron todos los archivos físicos cuyo nombre canónico cumple `SND-*.md` bajo:

- `fundamentals/`;
- `representation/`;
- `comparative/`;
- `reference/`;
- `languages/**/`.

No se contaron claims, README, worklogs, notas de investigación ni archivos editoriales.

## 2. Snapshot detectado

- **Entradas físicas únicas:** 79.
- **Fuentes canónicas en Source Registry:** 56 (`SND-SRC-0001…0056`).
- **Referencias canónicas inexistentes:** 0.
- **IDs de fuente locales/no canónicos en entradas:** 0.
- **Entradas promovidas sin ninguna referencia canónica:** 0.

## 3. Distribución física por gate

| Estado | Entradas |
|---|---:|
| LINGUISTIC_REVIEW | 42 |
| EVIDENCE_CHECKED | 30 |
| SOURCE_MAPPED | 2 |
| DRAFTED | 2 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| **Total** | **79** |

## 4. Resultado por área

### Fundamentos

- 18 entradas.
- 12 LINGUISTIC_REVIEW.
- 6 EVIDENCE_CHECKED.
- 0 referencias rotas.
- 0 IDs locales.

### Representación + comparación + referencia

- 14 entradas.
- 5 LINGUISTIC_REVIEW.
- 8 EVIDENCE_CHECKED.
- 1 IN_PROGRESS.
- 0 referencias rotas.
- 0 IDs locales.

Este bloque ya incluye físicamente:

- REP-003 — Cómo leer consonantes del IPA.
- REP-004 — Cómo leer vocales del IPA.

### de + en-US + es-GT + fr

- 15 entradas.
- 2 LINGUISTIC_REVIEW.
- 10 EVIDENCE_CHECKED.
- 1 SOURCE_MAPPED.
- 1 DRAFTED.
- 1 RESEARCHED.
- 0 referencias rotas.
- 0 IDs locales.

### it + ja + ko

- 14 entradas.
- 9 LINGUISTIC_REVIEW.
- 4 EVIDENCE_CHECKED.
- 1 SOURCE_MAPPED.
- 0 referencias rotas.
- 0 IDs locales.

### pt-BR-rio + ru + zh-TW

- 18 entradas.
- 14 LINGUISTIC_REVIEW.
- 2 EVIDENCE_CHECKED.
- 1 RESEARCHED_PARTIAL.
- 1 DRAFTED.
- 0 referencias rotas.
- 0 IDs locales.

## 5. Cambio respecto del STATUS snapshot

El `STATUS.md` consultado durante esta wave todavía declaraba **77** entradas físicas y señalaba REP-003/004 como ausentes.

El escaneo físico encuentra **79** porque REP-003 y REP-004 ya existen en la matriz.

La distribución del STATUS también quedó desfasada. El audit detecta:

- 42 LINGUISTIC_REVIEW, no 40;
- 30 EVIDENCE_CHECKED, no 26;
- 2 DRAFTED, no 4;
- 1 RESEARCHED, no 3;
- los demás estados se mantienen dentro del total físico de 79.

Esto es **drift de snapshot**, no un fallo de integridad de fuentes.

## 6. Regla del audit

Se consideró referencia canónica únicamente un token con forma `SND-SRC-NNNN` presente como heading real del Source Registry vigente.

También se buscaron tokens de fuente con prefijos locales (por ejemplo, IDs de waves) dentro de las entradas. Resultado: **0**.

No se sustituyeron IDs ni se interpretó similitud textual como equivalencia.

## 7. Gate

**SOURCE-ID-INTEGRITY-02: PASS 79/79.**

Este PASS reemplaza, para este snapshot, el PASS histórico 60/60. No debe proyectarse automáticamente sobre integraciones futuras: cualquier wave que añada/promueva entradas o fuentes requiere nuevo reescaneo.

## 8. Seguimiento de integración

Después de este snapshot:

1. #7375 fusionó el fix del linter que evita falsos positivos `SND-SRC-* → SND-*-###` y añade `DANGLING_LOCAL_SOURCE_ID`;
2. #7381 fusionó la reconciliación de `STATUS.md` a 79 entradas / 56 fuentes y marcó REP-003/004 como presentes;
3. ninguna de esas dos integraciones modifica entradas lingüísticas ni el Source Registry, por lo que el universo 79/56 auditado aquí permanece materialmente igual;
4. el scan debe repetirse después del siguiente lote que sí añada/promueva entradas o fuentes.
