# SND-REP-009 — Ortografía y pronunciación

**Estado:** EDITORIAL_REVIEW — PASS_WITH_CROSS_PROFILE_WARNING.  
**Dominio:** escritura / pronunciación.  
**Idioma:** transversal.

## 1. Relacionadas, pero distintas

MLS-SND tratará la ortografía y la pronunciación como capas relacionadas pero analíticamente distintas.

Una ortografía puede codificar información útil sobre una palabra sin constituir una transcripción fonética estrecha de cada realización.

## 2. No existe una única relación universal escritura–sonido

El tomo no clasificará los diez idiomas mediante una escala simplista de “se escribe como se pronuncia” frente a “no se escribe como se pronuncia”.

En cada perfil se investigará por separado:

- qué información codifica la escritura;
- qué relaciones grafía–pronunciación son productivas;
- qué procesos fonológicos/fonéticos alteran la realización superficial;
- qué excepciones y variantes son relevantes.

## 3. El ejemplo de una ortografía no define las demás

*Essentials of Linguistics* utiliza la ortografía inglesa para mostrar por qué una descripción de sonidos necesita una notación independiente: una misma realización puede corresponder a grafías diferentes.

En otros perfiles MLS-SND documentará relaciones distintas. Por ejemplo, el ruso requiere considerar reducción, asimilación y palatalización; el coreano distingue hangul, Romanización Revisada e IPA; el mandarín de Taiwán puede mostrar caracteres, Zhuyin e IPA con funciones diferentes.

## 4. Regla para entradas por idioma

Una sección “Relación con la escritura” deberá distinguir entre:

1. **hecho ortográfico**;
2. **análisis fonológico**;
3. **realización fonética**;
4. **convención de transcripción/romanización**, si existe.

Una capa no se usará como evidencia automática de otra.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| REP009-C01 | Una ortografía puede no ofrecer una correspondencia uno-a-uno suficiente para describir sonidos; el texto ejemplifica esto con inglés | SND-SRC-0024 | §3.6, discusión inicial sobre spelling y transcripción | ejemplo inglés / principio metodológico | VERIFIED |
| REP009-C02 | La Romanización Revisada coreana se basa en pronunciación estándar pero omite detalles como longitud vocálica | SND-SRC-0012 | “Basic Principles” + “Summary”, Note 2 | coreano / romanización | VERIFIED |
| REP009-C03 | El manual del MOE taiwanés mantiene un sistema Zhuyin con símbolos y marcas tonales propios | SND-SRC-0011 | “List of Phonetic Symbols” y tablas de referencia | mandarín de Taiwán | VERIFIED |

## 6. Fuentes

- SND-SRC-0024 — Anderson et al., §3.6.
- SND-SRC-0011 — Ministry of Education, Taiwan, Zhuyin manual.
- SND-SRC-0012 — National Institute of Korean Language, Romanization of Korean.

## 7. Nota editorial

Las cuatro capas enumeradas son una regla de estructura MLS-SND. No se afirma que todos los idiomas necesiten mostrar las cuatro en cada entrada.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 9. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `ce5414298a7e65942c0c1939d0863ddde225d9f6`.
- **Resultado:** PASS_WITH_CROSS_PROFILE_WARNING → `LINGUISTIC_REVIEW`.
- **Principio:** ortografía y pronunciación permanecen capas distintas; ninguna grafía se usa como evidencia automática de realización.
- **Ejemplos cross-profile:** las menciones de ruso, coreano y zh-TW funcionan como navegación/ilustración; su evidencia lingüística reside en las entradas específicas de esos perfiles y no crea claims autónomos aquí.
- **Terminología:** coherente con la regla canónica `ortografía ≠ pronunciación`.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.

## 10. Revisión editorial wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `d4c2c9b2851c74b1abfc46fceb6366b035541ca8`.
- **Resultado:** PASS_WITH_CROSS_PROFILE_WARNING → `EDITORIAL_REVIEW`.
- **Consistencia:** la entrada mantiene `ortografía ≠ pronunciación` y distingue hecho ortográfico, análisis fonológico, realización y convención de representación.
- **Alcance:** los ejemplos ruso/coreano/zh-TW siguen siendo navegación ilustrativa; no se convierten en claims transversales.
- **Siguiente gate:** composition readiness con la advertencia cross-profile preservada.
