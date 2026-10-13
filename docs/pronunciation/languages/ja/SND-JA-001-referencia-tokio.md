# SND-JA-001 — Tokio como ancla de referencia y sus límites

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** japonés.
**Variedad:** Tokio / lengua común para el ancla prosódica.
**Dominio:** variedad / prosodia.

## 1. Decisión editorial

MLS-SND utilizará el habla de Tokio/lengua común como ancla principal para explicar el acento léxico japonés, pero no la presentará como representación de toda la diversidad prosódica japonesa.

## 2. Base documental

El National Institute for Japanese Language and Linguistics mantiene recursos específicos sobre acento de Tokio.

El Tokyo Accent corpus/dictionary documenta 12,803 palabras seleccionadas por variación esperada y registra patrones de 19 hablantes, además de información de diccionarios de acento.

El proyecto NINJAL/OJAD describe explícitamente la lengua común con base en hablantes del dialecto de Tokio como referencia para información de acento orientada a enseñanza y consulta.

## 3. Variación

Los propios recursos muestran que el acento presenta variación y cambio. Por eso una entrada no deberá convertir un patrón de Tokio en regla universal del japonés.

## 4. Dimensión temporal

Los datos principales de SND-SRC-0013 fueron recogidos entre 1982 y 1984. Para afirmaciones sobre uso actual se requerirá, cuando sea material, evidencia contemporánea adicional.

SND-SRC-0014 respalda la elección de la lengua común / habla de Tokio como referencia para el recurso OJAD, pero el proyecto institucional se ejecutó entre 2010 y 2013 y su página de detalle indica que terminó en octubre de 2013 sin actualizaciones previstas. Por tanto, OJAD puede documentar la **función de referencia** adoptada por el proyecto, pero no debe usarse por sí solo como prueba de que todos sus patrones describen sin cambio el uso contemporáneo.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador | estado |
|---|---|---|---|---|
| JA001-C01 | El recurso Tokyo Accent registra 12,803 palabras y 19 hablantes | SND-SRC-0013 | descripción principal del recurso | VERIFIED |
| JA001-C02 | La selección y documentación buscan reflejar variación del acento de Tokio | SND-SRC-0013 | descripción/metodología; prólogo pp. 3–10 | VERIFIED |
| JA001-C03 | OJAD adopta la lengua común (dialecto de Tokio) como referencia de acento para su recurso | SND-SRC-0014 | NINJAL OJAD: 概要 y プロジェクトの詳細; referencia explícita a 共通語（東京方言） | VERIFIED |
| JA001-C04 | La investigación base del Tokyo Accent se realizó 1982–1984 | SND-SRC-0013 | descripción principal | VERIFIED |
| JA001-C05 | El proyecto OJAD/NINJAL se ejecutó entre 2010 y 2013; la página de detalle indica que terminó en octubre de 2013 y que no hay actualizaciones previstas | SND-SRC-0014 | metadatos del proyecto + “プロジェクトの詳細” | VERIFIED |

## 6. Fuentes

Shibata, T. (superv.), Mase, Y., & Sato, R. (Eds.). (1985/2013). 東京語アクセント資料. National Institute for Japanese Language and Linguistics. https://mmsrv.ninjal.ac.jp/tokyo_accent/

National Institute for Japanese Language and Linguistics. (s. f.). 日本語教育のためのコーパスを利用したオンライン日本語アクセント辞書の開発. https://www.ninjal.ac.jp/research/cr-project/project/pubpro/accentdictionary/

## 7. Entradas relacionadas

- SND-JA-006 — Acento tonal de Tokio.
- SND-JA-007 — Variación y cambio acentual.
- SND-JA-008 — Kana y pronunciación.
- SND-JA-009 — Kanji, lecturas y pronunciación.

## 8. Nota editorial

**REFERENCE_FIXED** se limita al papel de ancla prosódica principal; no implica que toda descripción del japonés deba reducirse a Tokio.

Las fechas de los recursos permanecen visibles porque forman parte del alcance de la evidencia, no como nota bibliográfica secundaria.

## 9. Auditoría y gate editorial

- **Fecha:** 2026-10-11.
- **Resultado R33:** EVIDENCE_CHECKED.
- **LINGUISTIC_REVIEW:** PASS_WITH_DATE_SCOPE_WARNING.
- **EDITORIAL_REVIEW:** PASS_WITH_EDITORIAL_CHANGES.
- **Comprobación:** el recurso Tokyo Accent documenta 12,803 palabras, 19 hablantes, diversidad esperada del acento de Tokio y trabajo de campo de 1982–1984; NINJAL/OJAD declara explícitamente la lengua común (dialecto de Tokio) como referencia de acento para su recurso. La evidencia de variación se atribuye a Tokyo Accent, no se sobreextiende al texto de OJAD. El proyecto OJAD terminó en 2013 y no se usa por sí solo como prueba de vigencia contemporánea.
- **Límite:** REFERENCE_FIXED se limita al papel de ancla prosódica; no convierte Tokio en descripción universal de todo Japón.


## 10. Gate de salida

Esta entrada no pasa todavía a READY_FOR_COMPOSITION.

Condiciones preservadas:
1. Tokio/lengua común funciona como ancla prosódica, no como japonés universal;
2. los datos 1982–1984 no se presentan como frecuencia contemporánea;
3. OJAD documenta una referencia institucional del proyecto, no una actualización continua hasta 2026;
4. cualquier afirmación contemporánea deberá usar bibliografía actual cuando la fecha sea material.

## 11. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `66ab98b7acb0994708510f1e1ef79c011bdf44eb`.
- **Resultado:** PASS_WITH_DATE_SCOPE_WARNING → `READY_FOR_COMPOSITION`.
- **Alcance:** Tokio/lengua común sigue siendo ancla prosódica, no japonés universal.
- **Warning temporal:** los datos 1982–1984 y el cierre de OJAD en 2013 permanecen visibles; COMPOSITION no los presenta como frecuencia contemporánea.
- **Reader-facing:** incluir §§1–4, 6–8; excluir tabla R33 y metadata de auditoría/gates.
- **Pronunciation Quick Layer:** NOT_APPLICABLE; entrada de alcance/referencia sin forma léxica concreta.
- **Written-only:** PASS.

