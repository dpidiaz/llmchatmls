# SND-JA-006 — Acento tonal de Tokio como referencia

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** japonés.  
**Variedad:** lengua común / dialecto de Tokio como ancla prosódica.  
**Dominio:** prosodia / acento.

## 1. Alcance

MLS-SND utilizará el acento de la lengua común con referencia al dialecto de Tokio como **ancla prosódica principal** para explicar el sistema de acento japonés.

Esta decisión no convierte Tokio en una representación de toda la diversidad prosódica de Japón.

## 2. Qué aporta OJAD

El proyecto NINJAL/OJAD fue desarrollado como diccionario de acento para docentes y estudiantes de japonés.

Su descripción institucional declara explícitamente que trabaja con el acento de la **lengua común (dialecto de Tokio)** y que busca ofrecer información sistemática de acento para enseñanza y consulta.

## 3. No basta el acento de la palabra aislada

La página del proyecto explica que, para producir patrones de pitch naturales, no basta con conocer únicamente el patrón acentual de una palabra aislada.

También son relevantes los patrones después de:

- flexión;
- conexión con otros elementos;
- transformaciones de acento asociadas.

Por eso MLS-SND no reducirá este tema a una marca estática sobre una forma de diccionario.

## 4. Terminología del tomo

Las fuentes institucionales hablan de **アクセント** y de patrones de pitch.

MLS-SND puede utilizar **acento tonal** como etiqueta editorial de consulta cuando ayude a distinguir este sistema de:

- tono léxico de lenguas tonales;
- acento entendido solo como intensidad;
- entonación de frase.

La etiqueta editorial no debe proyectarse hacia la fuente como si NINJAL hubiera usado exactamente esa terminología española.

## 5. Qué no se afirma aquí

Esta entrada todavía no fija:

- una tipología completa de todos los patrones de acento del japonés;
- reglas universales para todas las palabras;
- un único patrón válido para todos los hablantes;
- equivalencia entre acento de Tokio y prosodia japonesa en general.

La variación se trata en SND-JA-007.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| JA006-C01 | OJAD se desarrolló como diccionario en línea de acento para docentes y estudiantes de japonés | SND-SRC-0014 | NINJAL OJAD, líneas 8–15, “プロジェクトの成果” y “概要” | proyecto OJAD | VERIFIED |
| JA006-C02 | El proyecto toma como referencia la lengua común (dialecto de Tokio) | SND-SRC-0014 | NINJAL OJAD, “概要”, referencia explícita a 共通語（東京方言） | referencia prosódica | VERIFIED |
| JA006-C03 | El proyecto señala que el patrón natural de pitch requiere considerar no solo palabras aisladas sino formas flexionadas y conectadas | SND-SRC-0014 | NINJAL OJAD, “概要”, explicación de 孤立単語・活用後・連結後 | alcance pedagógico/prosódico | VERIFIED |
| JA006-C04 | OJAD incluye información de tipo de acento en forma de diccionario y formas flexionadas | SND-SRC-0014 | NINJAL OJAD, “概要”, información prevista del diccionario | recurso de consulta | VERIFIED |

## 7. Fuente

National Institute for Japanese Language and Linguistics. (s. f.). *日本語教育のためのコーパスを利用したオンライン日本語アクセント辞書の開発*. https://www.ninjal.ac.jp/research/cr-project/project/pubpro/accentdictionary/

## 8. Relacionado con

- SND-JA-001 — Tokio como ancla de referencia y sus límites.
- SND-JA-007 — Variación y cambio acentual.
- SND-FND-014 — Acento tonal.
- SND-FND-015 — Entonación.

## 9. Gate editorial

Claim ↔ source ↔ locator comprobados el 2026-10-11 contra la página institucional de NINJAL.

- **LINGUISTIC_REVIEW:** PASS_WITH_NOTE.
- **EDITORIAL_REVIEW:** PASS_WITH_EDITORIAL_CHANGES.
- **Dependencia terminológica:** SND-FND-014 conserva la política general de “acento tonal / pitch accent”.

El uso de **acento tonal** sigue siendo una etiqueta editorial de consulta: no se atribuye a NINJAL como traducción oficial ni se usa para convertir el japonés en una categoría tipológica universal cerrada.

JA-007 ya está `READY_FOR_COMPOSITION`, y los fundamentos prosódicos SND-FND-014 (acento tonal) y SND-FND-015 (entonación) también están cerrados para composición. La dependencia arquitectónica que bloqueaba esta entrada queda satisfecha para su alcance actual; una tipología exhaustiva de todos los patrones japoneses sigue fuera del núcleo aprobado.

## 10. Reconciliación editorial de dependencias

- **Fecha:** 2026-10-13.
- **Versión de partida:** blob `8cec7ad23bc699d563bf26ecf48e09452d2a0d2d`.
- **Resultado:** PASS_DEPENDENCIES_RESOLVED — permanece `EDITORIAL_REVIEW` y puede volver a composition readiness.
- **Dependencias satisfechas:** SND-JA-007, SND-FND-014 y SND-FND-015 están `READY_FOR_COMPOSITION`; JA-001 ya había superado el gate de composición.
- **Límite preservado:** Tokio/lengua común sigue siendo ancla prosódica, no representación de toda la diversidad japonesa.
- **Terminología:** “acento tonal” sigue siendo rótulo editorial definido localmente, no traducción oficial de NINJAL ni categoría tipológica universal cerrada.
- **Cambios lingüísticos/R33:** ninguno.

## 11. Composition readiness wave 02 — 2026-10-13

- **Versión evaluada:** blob `ce9287ce9d040316be528514d573a147a350a947`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Blocker previo:** dependencias prosódicas resueltas; JA-007, FND-014 y FND-015 están listos para composición.
- **Proyección reader-facing:** encabezado + §§1–5, §7 y §8.
- **Metadata interna excluida:** §6 (tabla R33), §§9–10 (gates/reconciliación) y este bloque.
- **Fuentes y fundamento:** derivado de SND-SRC-0014; OJAD se presenta como recurso institucional de lengua común/dialecto de Tokio para enseñanza y consulta.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — no hay forma léxica objetivo ni patrón individual que deba recibir respelling.
- **Autonomía escrita:** PASS; no requiere audio.
- **Open questions no bloqueantes:** tipología exhaustiva de patrones y variación adicional fuera del núcleo actual.
- **Regla para COMPOSITION:** no puede convertir Tokio en representación de toda la prosodia japonesa, atribuir “acento tonal” a NINJAL como traducción oficial ni reducir pitch natural a palabra aislada.
