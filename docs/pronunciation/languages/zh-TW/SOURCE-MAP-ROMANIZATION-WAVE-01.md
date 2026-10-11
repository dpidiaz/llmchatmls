# zh-TW romanization source gate — source map local

Estado: **LOCAL_SOURCE_CANDIDATE**.

Este ID es local a la wave y no debe transformarse en `SND-SRC-*` hasta deduplicación/canonicalización por el integrador.

## ZHTW-ROM-S01 — Revised Mandarin Chinese Dictionary

- **Tier propuesto:** A — recurso lexicográfico institucional del Ministry of Education, R.O.C. (Taiwan).
- **APA 7 propuesta:** Ministry of Education, R.O.C. (Taiwan). (2021–). *Revised Mandarin Chinese Dictionary, Taiwan Academic Network Version 6*. https://dict.revised.moe.edu.tw/
- **Idioma/alcance:** mandarín; recurso institucional taiwanés de consulta lexicográfica.
- **Cobertura usada por MLS-SND:** coexistencia operativa de Bopomofo y Hanyu Pinyin como capas de búsqueda/consulta y visualización de pronunciación.
- **Localizadores verificados:**
  - Basic Search: campo “Please enter Chinese, Bopomofo, Hanyu Pinyin”;
  - Basic Search: “Bopomofo Keypad” y “Hanyu Pinyin Keypad”;
  - entrada 博: campos “Bopomofo” y “Hanyu Pinyin”;
  - entrada 模: campos “Bopomofo” y “Hanyu Pinyin”.
- **Acceso:** gratuito en sitio oficial.
- **Fecha de verificación:** 2026-10-11.
- **Limitación:** demuestra que Hanyu Pinyin funciona como capa latina institucional de consulta en este recurso; **no** prueba que sea la única romanización histórica de Taiwán ni que sea una transcripción fonética exhaustiva.
- **Estado:** CANDIDATE_FOR_CANONICALIZATION.

## Gate propuesto

Después de asignar/reutilizar un ID global:

1. sustituir `ZHTW-ROM-S01` en ZHTW-009;
2. ejecutar SOURCE-ID-INTEGRITY;
3. promover ZHTW-009 de DRAFTED a EVIDENCE_CHECKED si no cambia el contenido sustantivo;
4. actualizar la política zh-TW del Transcription Guide en una wave editorial separada, no aquí.
