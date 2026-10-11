# SND-KO-002 — Sistema consonántico: mapa de evidencia

**Estado:** EVIDENCE_CHECKED como mapa de evidencia; inventario contemporáneo completo pendiente.
**Idioma:** coreano.
**Variedad:** estándar normativo / Seúl descriptivo, según la fuente.
**Dominio:** consonantes / alcance / cambio.

## 1. Qué valida esta entrada

Esta entrada **no publica todavía una tabla consonántica contemporánea definitiva**.

Su función es distinguir qué partes del sistema ya cuentan con:
- una base institucional normativa;
- una referencia fonética histórica;
- evidencia acústica contemporánea de Seúl;
- o solo un gap de investigación.

## 2. Capa normativa

Las *Standard Pronunciation Rules* del National Institute of Korean Language enumeran **19 consonantes** para el coreano estándar.

La norma organiza esas consonantes en categorías como:
- sonidos lax/plain;
- aspirated;
- tense;
- nasales;
- líquida.

MLS-SND trata esta fuente como **NORMATIVE**. La existencia de 19 consonantes normativas no demuestra por sí sola una realización fonética única en el habla espontánea contemporánea.

## 3. Capa histórica/descriptiva

Lee (1993) ofrece una *Illustration of the IPA* del coreano y sirve como punto de partida para la organización segmental.

Por su fecha, MLS-SND no la utiliza como prueba autosuficiente de la implementación fonética actual de Seúl.

## 4. Oclusivas: cluster contemporáneo fuerte

El cluster de oclusivas ya cuenta con evidencia contemporánea específica de Seúl:

- SND-SRC-0021 analiza categorías lax, tense y aspirated en posiciones iniciales y mediales;
- SND-SRC-0033 documenta cambio en curso en el peso relativo de VOT y f0.

Por eso los detalles acústicos se delegan en **SND-KO-003**, mientras esta entrada registra el cluster como cubierto.

## 5. Africadas: cambio paralelo documentado

Lee (2016) compara oclusivas y africadas de Seúl en hablantes mayores y jóvenes.

El estudio encuentra que el cambio acústico observado en las oclusivas aparece de manera consistente también en las africadas dentro de su diseño, utilizando medidas de duración y f0.

Esto permite marcar **africadas** como cluster con evidencia contemporánea, sin convertir el artículo en un inventario total de africadas.

## 6. Fricativas: evidencia acústica contemporánea

Lee & Jongman (2016) comparan Seúl y South Kyungsang y estudian acústicamente las fricativas mediante duración y centro de gravedad.

La investigación incluye hablantes de Seúl y documenta un contraste de fricativas en la comparación generacional/dialectal.

MLS-SND utiliza esta fuente para establecer que el cluster **fricativas** ya posee evidencia acústica moderna, no para fijar por sí sola una tabla fonética completa.

## 7. Clusters todavía abiertos

| Cluster | Base normativa/histórica | Evidencia contemporánea | Estado editorial |
|---|---|---|---|
| Oclusivas | SND-SRC-0032 + SND-SRC-0020 | SND-SRC-0021 + SND-SRC-0033 | EVIDENCE_CHECKED; detalle en KO-003 |
| Africadas | SND-SRC-0032 + SND-SRC-0020 | KO-W2-S01 | EVIDENCE_CHECKED como mapa |
| Fricativas | SND-SRC-0032 + SND-SRC-0020 | KO-W2-S02 | EVIDENCE_CHECKED como mapa |
| Nasales | SND-SRC-0032 + SND-SRC-0020 | pendiente estudio descriptivo específico | OPEN_QUESTION |
| Líquida / ㄹ | SND-SRC-0032 + SND-SRC-0020 | pendiente alofonía contemporánea específica | OPEN_QUESTION |
| Codas | SND-SRC-0032 | procesos normativos disponibles; descripción fonética contemporánea integral pendiente | OPEN_QUESTION |

## 8. Por qué el tiempo importa

La evidencia contemporánea demuestra que al menos parte del sistema consonántico cambia en su **implementación acústica**.

Por eso MLS-SND separará siempre:

1. inventario/categorías normativas;
2. análisis fonológico de una fuente;
3. realización fonética;
4. posición prosódica;
5. fecha/generación.

Un símbolo o letra de Hangul no se tratará como una descripción acústica autosuficiente.

## 9. Evidencia R33

| claim_id | afirmación | fuente | localizador | alcance | estado |
|---|---|---|---|---|---|
| KO002-C01 | NIKL enumera 19 consonantes para el coreano estándar | SND-SRC-0032 | Standard Pronunciation Rules, cap. 2, Rule 2 / tabla de consonantes | norma estándar | VERIFIED |
| KO002-C02 | Lee 1993 es una Illustration of the IPA útil como referencia segmental histórica | SND-SRC-0020 | JIPA 23(1), pp. 28–31 | histórico/descriptivo | VERIFIED |
| KO002-C03 | El contraste de oclusivas de Seúl tiene evidencia contemporánea específica y sensible a posición | SND-SRC-0021 | abstract; Study 1; Study 2; Discussion | Seúl | VERIFIED |
| KO002-C04 | El cambio lax/aspirated en Seúl implica cambio en el peso VOT/f0 | SND-SRC-0033 | abstract; pp. 120–144 | Seúl / cambio | VERIFIED |
| KO002-C05 | Lee 2016 encuentra cambio acústico consistente entre oclusivas y africadas de Seúl | KO-W2-S01 | abstract; pp. EL491–EL496 | Seúl / mayores-jóvenes | VERIFIED |
| KO002-C06 | Lee & Jongman 2016 aportan evidencia acústica de fricativas con Seúl como grupo comparativo | KO-W2-S02 | abstract; pp. 157–184 | Seúl vs. South Kyungsang | VERIFIED |

## 10. Gate

**EVIDENCE_CHECKED como mapa de cobertura.**

No significa:
- inventario consonántico contemporáneo completo;
- que Lee 1993 describa sin cambios el Seúl actual;
- que la norma NIKL equivalga a corpus espontáneo;
- que nasales/líquidas/codas estén cerradas.

Antes de integración:
1. canonicalizar KO-W2-S01 y KO-W2-S02;
2. reescribir esos IDs a SND-SRC globales;
3. ejecutar nuevamente source-ID integrity;
4. someter KO-002 a LINGUISTIC_REVIEW independiente.
