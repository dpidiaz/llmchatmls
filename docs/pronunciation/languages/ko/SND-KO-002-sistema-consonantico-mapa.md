# SND-KO-002 — Sistema consonántico: mapa de evidencia

**Estado:** EDITORIAL_REVIEW — PASS_WITH_SCOPE_WARNING como mapa de evidencia, no como inventario consonántico canónico.
**Idioma:** coreano.
**Ancla descriptiva:** Seúl, cuando la fuente lo especifique.
**Dominio:** consonantes / mapa de investigación.

## 1. Regla

MLS-SND no publicará todavía una tabla consonántica contemporánea canónica a partir de una única *Illustration of the IPA* de 1993.

Lee (1993) se conserva como punto de partida histórico, pero el perfil debe comprobar cada cluster contra estudios más recientes antes de convertirlo en una descripción contemporánea.

## 2. Clusters

| Cluster | Base histórica | Evidencia contemporánea | Estado |
|---|---|---|---|
| Oclusivas lax / tense / aspirated | SND-SRC-0020 | SND-SRC-0021 + SND-SRC-0033 | EVIDENCE_AVAILABLE |
| Fricativas | SND-SRC-0020 | actualización específica todavía no integrada | SOURCE_MAPPED |
| Africadas | SND-SRC-0020 | actualización específica todavía no integrada | SOURCE_MAPPED |
| Nasales | SND-SRC-0020 | procesos/contexto contemporáneos todavía no integrados | SOURCE_MAPPED |
| Líquidas | SND-SRC-0020 | alofonía contemporánea todavía no integrada | SOURCE_MAPPED |
| Codas | base normativa/perfil general | fuente fonética contemporánea todavía pendiente | SOURCE_MAPPED |

## 3. Por qué el tiempo importa

La literatura reciente muestra que incluso dentro del cluster de oclusivas la implementación acústica contemporánea no puede resumirse mediante una sola pista fija.

Schweizer, Ahn y Kwon (2026) describen el contraste de tres categorías —lax, tense y aspirated— en varias posiciones prosódicas y encuentran diferencias importantes entre posición inicial de frase/AP y posición medial de palabra.

Bang et al. (2018) documentan además un cambio en curso en Seúl en el que f0 gana peso frente a VOT para el contraste lax–aspirated en posición inicial de frase.

Por eso un inventario que solo enumere símbolos no basta para explicar la pronunciación contemporánea.

## 4. Qué sí queda validado en esta entrada

Esta entrada valida únicamente cuatro decisiones de mapa:

1. Lee (1993) es una fuente histórica de referencia IPA para coreano.
2. Esa fuente no debe tratarse como descripción contemporánea exhaustiva por sí sola.
3. El cluster de oclusivas ya cuenta con evidencia contemporánea específica integrada en MLS-SND.
4. Fricativas, africadas, nasales, líquidas y codas continúan explícitamente abiertos dentro de este mapa.

## 5. Qué no queda validado

Esta entrada **no** valida:

- una tabla consonántica final del coreano contemporáneo;
- realizaciones modernas de todos los clusters;
- una única descripción válida para todo el coreano;
- equivalencia simple entre categorías coreanas y “sonora/sorda”;
- procesos de coda sin fuente fonética contemporánea específica.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| KO002-C01 | Lee (1993) es una *Illustration of the IPA* de coreano publicada en JIPA, vol. 23(1), pp. 28–31 | SND-SRC-0020 | ficha Cambridge; información bibliográfica y tipo “Illustrations of the IPA” | coreano / referencia histórica | VERIFIED |
| KO002-C02 | El estudio de 2026 analiza oclusivas lax, tense y aspirated del coreano de Seúl en posiciones IP-initial, AP-initial y word-medial | SND-SRC-0021 | Abstract + §1 Introduction | coreano de Seúl | VERIFIED |
| KO002-C03 | La realización acústica del contraste de oclusivas depende de la posición prosódica | SND-SRC-0021 | Abstract + §4 Discussion + §5 Conclusion | coreano de Seúl | VERIFIED |
| KO002-C04 | En el cambio descrito para Seúl, f0 ha ganado peso frente a VOT en el contraste lax–aspirated en posición inicial | SND-SRC-0033 | Abstract / Journal of Phonetics 66, pp. 120–144 | coreano de Seúl | VERIFIED |

## 7. Fuentes

Lee, H. B. (1993). Korean. *Journal of the International Phonetic Association, 23*(1), 28–31. https://doi.org/10.1017/S0025100300004758

Bang, H.-Y., Sonderegger, M., Kang, Y., Clayards, M., & Yoon, T.-J. (2018). The emergence, progress, and impact of sound change in progress in Seoul Korean: Implications for mechanisms of tonogenesis. *Journal of Phonetics, 66*, 120–144.

Schweizer, D., Ahn, S., & Kwon, H. (2026). Acoustic properties of Seoul Korean stops in phrase-initial and word-medial positions. *Journal of the International Phonetic Association, 56*, e6. https://doi.org/10.1017/S002510032510087X

## 8. Gate

**R33 claim-level audit: PASS para el alcance de mapa de evidencia.**

La promoción a EVIDENCE_CHECKED no significa que todos los clusters consonánticos estén investigados. Significa que:

- los claims presentes están respaldados;
- los gaps están explícitamente registrados;
- no se presenta una tabla final sin evidencia suficiente.

## 9. Relacionado con

- SND-KO-001 — Estándar y habla de Seúl
- SND-KO-003 — Oclusivas y cambio contemporáneo en Seúl
- SND-FND-006 — Consonantes: parámetros articulatorios
- SND-FND-017 — Variación

## 10. Revisión lingüística wave 01

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `b9153a934ce582dce9b1a6fa8fe1167537442406`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Validez del gate:** se valida la arquitectura del **mapa parcial**, no una tabla consonántica canónica completa.
- **Temporalidad:** Lee (1993) permanece como referencia histórica con advertencia de fecha; los claims contemporáneos del cluster de oclusivas se apoyan en evidencia específica de Seúl de 2018/2026.
- **Alcance:** los resultados de Seúl no se extrapolan a todo el coreano; los clusters sin actualización específica continúan `SOURCE_MAPPED`.
- **Análisis:** lax / tense / aspirated se mantienen como categorías del cluster estudiado; no se reducen a “sonora/sorda” ni a una única pista acústica.
- **Gaps preservados:** fricativas, africadas, nasales, líquidas y codas siguen abiertos; esta revisión no los completa por analogía.
- **Siguiente gate:** EDITORIAL_REVIEW independiente del mapa; el inventario consonántico final requiere investigación adicional antes de cualquier composición que lo presente como completo.

## 11. Revisión editorial wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `4d1875c5e1bad9e51987c7f0c31e44dd86b1d61b`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Objeto editorial:** mapa parcial de evidencia, no inventario consonántico contemporáneo completo.
- **Jerarquía:** la advertencia histórica de Lee (1993) precede a la tabla de clusters y los gaps permanecen visibles antes del gate.
- **Temporalidad/variedad:** los datos contemporáneos de 2018/2026 siguen delimitados a Seúl y a los contextos prosódicos citados.
- **Terminología:** lax / tense / aspirated se conserva sin reducirse a “sonora/sorda”; VOT y f0 no se presentan como pistas universales fijas.
- **Gaps preservados:** fricativas, africadas, nasales, líquidas y codas continúan `SOURCE_MAPPED`; esta revisión no los completa por analogía.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness del mapa actual, manteniendo explícita su condición parcial.
