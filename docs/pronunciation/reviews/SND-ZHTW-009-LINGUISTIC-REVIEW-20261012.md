# MLS-SND — Revisión lingüística independiente de ZHTW-009

- **Entrada:** SND-ZHTW-009 — Romanización latina
- **Fecha:** 2026-10-12
- **Rama:** `snd/zhtw009-linguistic-review-wave-01`
- **Versión de entrada revisada:** blob `242a056f727b6b12e3977e728311ae11cb727ccc`
- **Resultado:** `LINGUISTIC_REVIEW / PASS`
- **Base evidencial:** SND-SRC-0080; source gate ZHTW-009 del 2026-10-11.

## 1. Comprobación lingüística y de alcance

| Control | Evaluación |
|---|---|
| Hanyu Pinyin se identifica como romanización, no IPA | PASS |
| Zhuyin/Bopomofo y Hanyu Pinyin conservan funciones separadas | PASS |
| El diccionario MOE se usa como evidencia institucional de consulta, no como corpus fonético | PASS |
| No se infiere exclusividad histórica de Hanyu Pinyin en Taiwán | PASS |
| No se universaliza la decisión a todo el MLS ni a todos los materiales de chino | PASS |
| El orden visual propuesto se trata como decisión MLS-SND, no como claim de la fuente | PASS |
| Los claims C01/C02 permanecen dentro del alcance de SND-SRC-0080 | PASS |

## 2. Coherencia con la arquitectura MLS-SND

La entrada es coherente con:

- `terminology.md`: romanización y transcripción fonética no son sinónimos;
- SND-REP-010: una romanización concreta debe identificarse y no se presume que codifique todo detalle fonético;
- SND-ZHTW-007: Zhuyin mantiene su función local propia;
- SND-ZHTW-008: Zhuyin e IPA no son sistemas equivalentes.

La presencia conjunta de Zhuyin, Hanyu Pinyin e IPA en una interfaz posible no crea una relación de equivalencia entre las tres capas.

## 3. Scope warning

SND-SRC-0080 demuestra la coexistencia operativa de Bopomofo y Hanyu Pinyin en un recurso lexicográfico institucional del MOE de Taiwán. No demuestra por sí sola patrones fonéticos del habla taiwanesa, historia completa de políticas de romanización ni obligación de usar Pinyin en otros contextos.

## 4. Cambios autorizados por esta revisión

Solo se promueve el estado de la versión revisada a `LINGUISTIC_REVIEW` y se añade la constancia del gate. No se cambian:

- claims;
- source IDs;
- localizadores;
- transcripciones;
- ejemplos;
- variedad;
- política global de romanización.

## 5. Próximo gate

Revisión editorial independiente de claridad, jerarquía y utilidad de la secuencia visual. No promover a `READY_FOR_COMPOSITION` sin pasar antes por `EDITORIAL_REVIEW`.
