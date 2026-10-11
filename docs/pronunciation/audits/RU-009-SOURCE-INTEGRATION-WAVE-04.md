# RU-009 source integration and R33 gate — wave 04

**Fecha:** 2026-10-11  
**Entrada:** SND-RU-009  
**Origen de investigación:** #7292, reaplicado limpiamente sobre matriz actual.

## Resultado

- SOURCE CANONICALIZATION: PASS
- LOCAL-ID CLEANUP: PASS
- CLAIM↔SOURCE↔LOCATOR: PASS
- RU-009: EVIDENCE_CHECKED

## Fuente canonicalizada

`RU-PROP-001` → **SND-SRC-0097**

Lopatin, V. V. (Ed.). (2006). *Правила русской орфографии и пунктуации. Полный академический справочник*. Москва: Эксмо.

Verificación:
- Instituto Vinogradov RAN — registro bibliográfico institucional;
- Gramota — “Общие сведения о русском письме”;
- Gramota — “Основной принцип употребления букв”.

## Claims

- RU009-C01 — PASS.
- RU009-C02 — PASS.
- RU009-C03 — PASS.
- RU009-C04 — PASS.

## Scope guard

SND-SRC-0097 es una fuente ortográfica/gráfica.

No se usa como:
- corpus de habla;
- evidencia acústica;
- inventario fonético;
- regla completa de pronunciación letra→sonido.

Las realizaciones concretas siguen dependiendo de SND-SRC-0015/0016 y de entradas fonéticas específicas.

## Integridad

- 0 IDs locales en RU-009.
- 1 nueva fuente global.
- 1 nueva entrada física.
- No se modifican RU-001…008.
- No se modifica STATUS/Inventory desde esta worker wave.

## Gate

**PASS → EVIDENCE_CHECKED.**

Siguiente gate:
- LINGUISTIC_REVIEW independiente;
- después EDITORIAL_REVIEW.

No hay promoción automática a composición.
