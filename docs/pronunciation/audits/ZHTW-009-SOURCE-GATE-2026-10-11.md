# ZHTW-009 — Source gate audit

Fecha: **2026-10-11**.

## Resultado

**PASS_LOCAL_SOURCE_MAP**

ZHTW-009 cuenta ahora con una fuente institucional verificable del Ministry of Education de Taiwán que respalda los dos claims mínimos necesarios para su decisión editorial provisional.

## Claims comprobados

### ZHTW009-C01

El *Revised Mandarin Chinese Dictionary* permite búsqueda mediante chino, Bopomofo y Hanyu Pinyin, e incluye teclados separados para Bopomofo y Hanyu Pinyin.

**Localizador:** Basic Search.

### ZHTW009-C02

Entradas individuales del diccionario muestran campos separados de Bopomofo y Hanyu Pinyin.

**Localizadores verificados:** 博 y 模.

## Qué demuestra

La evidencia permite afirmar que Hanyu Pinyin funciona como una capa latina institucional de consulta junto a Bopomofo dentro de un recurso contemporáneo del MOE de Taiwán.

## Qué no demuestra

No demuestra que:

- Hanyu Pinyin sea la única romanización histórica de Taiwán;
- Hanyu Pinyin equivalga a IPA;
- el MOE exija que todo material lingüístico presente ambas capas;
- la política de romanización de MLS para otros contenidos chinos deba ser idéntica.

## Bloqueo restante

**Solo canonicalización de fuente.**

La entrada no debe pasar a EVIDENCE_CHECKED mientras conserve el ID local `ZHTW-ROM-S01`.

Tras asignar/reutilizar un `SND-SRC-*` global y ejecutar SOURCE-ID-INTEGRITY, el contenido actual puede entrar al gate EVIDENCE_CHECKED sin investigación adicional si no cambia sustantivamente.
