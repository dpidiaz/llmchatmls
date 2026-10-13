# ZHTW-009 — Source gate audit

Fecha: **2026-10-11**.

## Resultado

**PASS → EVIDENCE_CHECKED**

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

## Canonicalización

El antiguo ID local `ZHTW-ROM-S01` fue deduplicado y registrado como **SND-SRC-0080**.

Comprobación posterior:
- la obra es la misma fuente institucional auditada;
- los localizadores Basic Search / 博 / 模 no cambiaron;
- los dos claims siguen dentro del mismo alcance;
- no queda ningún ID local en la entrada canónica;
- no se amplió la política de romanización fuera de zh-TW.

## Gate final

**SOURCE-ID-INTEGRITY local: PASS.**  
**ZHTW-009: EVIDENCE_CHECKED.**  
Siguiente gate: **LINGUISTIC_REVIEW**.
