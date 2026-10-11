# SND-JA-004 — Consonantes: mapa general y realizaciones documentadas

**Estado:** RESEARCHED_PARTIAL.  
**Idioma:** japonés.  
**Variedad / alcance:** japonés de referencia con controles contemporáneos puntuales; no exhaustivo.  
**Dominio:** fonología / fonética / pronunciación.  
**Tipo de alcance:** REFERENCE_VARIETY + CORPUS_OBSERVED para subfenómenos documentados.  
**Nivel de representación:** fonológico / fonético.  
**Dependencias:** SND-JA-001, SND-JA-002, SND-JA-005.  
**Versión:** wave-04.

## 1. Qué es

Esta entrada organiza el **sistema consonántico** del japonés como un mapa de investigación y separa dos niveles:

1. categorías consonánticas de referencia;
2. realizaciones fonéticas y alternancias condicionadas.

La fuente canónica SND-SRC-0023, Okada (1991), sigue siendo útil como *Illustration of the IPA* para el mapa de base, pero su fecha obliga a comprobar con evidencia posterior cualquier afirmación sobre uso fonético contemporáneo.

## 2. Por qué importa separar fonología y fonética

Una misma categoría fonológica puede presentar realizaciones distintas según contexto, hablante o estructura morfofonológica.

Por eso MLS-SND no derivará automáticamente la fonética desde:

- una fila de kana;
- una romanización;
- una tabla IPA antigua;
- una única forma léxica.

Las entradas de escritura y romanización son capas distintas.

## 3. Mapa general: estado de evidencia

**SND-SRC-0023** aporta una descripción IPA compacta del japonés y se conserva como ancla de referencia.

En esta wave no se vuelve a declarar un inventario completo como “actual” sin control contemporáneo. El objetivo inmediato es:

- conservar un baseline canónico;
- añadir evidencia moderna donde existe;
- marcar huecos que requieren revisión segmental reciente.

Resultado: **SOURCE_MAPPED para el sistema general; evidencia contemporánea selectiva para fenómenos concretos**.

## 4. /r/ y /d/: categorías distintas con propiedades articulatorias próximas

NINJAL documenta en 2026 que /r/ y /d/ del japonés pueden ser articulatoriamente parecidos porque ambos implican elevación de la punta de la lengua y contacto con la zona anterior del paladar/alvéolos.

La distinción, sin embargo, no se reduce a “la misma consonante”:

- /r/ presenta contacto más breve;
- /d/ mantiene el cierre durante más tiempo;
- el lugar de contacto también difiere de manera útil para la percepción.

En un análisis del *Corpus of Spontaneous Japanese* con aproximadamente 200 hablantes y seis entornos vocálicos, NINJAL reporta sistemáticamente una duración media menor para /r/ que para /d/.

## 5. Variabilidad de /r/

La misma fuente muestra que la localización del contacto articulatorio de /r/ puede variar con el entorno vocálico.

En muestras de hablantes de japonés estándar procedentes de Tokio, la posición de contacto cambia entre secuencias como /ara/ e /iri/. La fuente trata la explicación articulatoria detallada como hipótesis, de modo que MLS-SND conserva dos niveles:

- **observación documentada:** existe variación de contacto;
- **explicación propuesta:** parte de esa variación puede reflejar la influencia de las vocales vecinas.

No se convertirá esa hipótesis en regla absoluta.

## 6. Alternancias p~h~b: no son tres “lecturas arbitrarias”

NINJAL documenta contadores como 匹, donde aparecen realizaciones con /p/, /h/ y /b/ según el numeral.

Ejemplos de la fuente incluyen:

- 一匹 con /p/;
- 二匹 con /h/;
- 三匹 con /b/.

La distribución se explica mediante morfofonología e historia del japonés, no como si cada consonante fuera intercambiable libremente.

Este caso es útil porque muestra que un mapa consonántico necesita distinguir:

- inventario de categorías;
- alternancias condicionadas;
- historia fonológica;
- realizaciones de palabras concretas.

## 7. Sokuon y consonantes

La explicación de NINJAL para contadores también relaciona determinados casos con 促音.

Eso no autoriza a tratar っ como una consonante IPA autónoma en todos los contextos. Su análisis pertenece a la estructura moraica/fonológica y debe coordinarse con JA-002 y JA-005.

## 8. Relación con kana

Una fila de kana puede ser útil para localizar una serie ortográfica, pero **no es por sí sola un inventario fonético**.

Especialmente:

- ラ行 no fija una única realización estrecha de /r/;
- ハ行 no impide alternancias condicionadas con /p/ o /b/;
- combinaciones gráficas y procesos morfofonológicos deben analizarse por separado.

Por eso JA-004 y JA-008 se enlazan, pero no se fusionan.

## 9. Variación

Esta entrada registra solo variación respaldada por las fuentes usadas.

La evidencia contemporánea de esta wave permite afirmar de manera acotada que:

- /r/ presenta variabilidad articulatoria documentada;
- la relación /r/–/d/ implica diferencias de duración y contacto;
- ciertas formas con /p~h~b/ están condicionadas morfofonológicamente.

No se generaliza desde esos casos a toda la geografía o sociedad japonesa.

## 10. Comparación útil

Para estudiantes de lenguas con /r/ alveolar aproximante o vibrante, no es adecuado identificar automáticamente el japonés /r/ con una sola “r” de otro idioma.

Etiqueta recomendada: **SEMEJANZA_PARCIAL**.

La comparación debe basarse en articulación y distribución documentadas, no en la letra latina usada en romanización.

## 11. Advertencias de equivalencia

**Kana row ≠ fonema único con realización fija.**  
**Romanización ≠ IPA.**  
**/r/ japonés ≠ automáticamente la r de otra lengua.**  
**Alternancia p~h~b ≠ variación libre.**

## 12. Entradas relacionadas

- SND-JA-001 — Referencia de Tokio/lengua común y límites.
- SND-JA-002 — Mora.
- SND-JA-005 — Estructura moraica/silábica.
- SND-JA-008 — Kana y pronunciación.
- SND-JA-010 — Romanización.
- SND-REP-002 — Qué es el IPA.
- SND-REP-007 — Transcripción fonológica y fonética.

## 13. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| JA004-C01 | Existe una fuente canónica de referencia IPA para el japonés, útil como baseline pero con advertencia de fecha | SND-SRC-0023 | Okada 1991, pp. 94–96; registro canónico | mapa general | CANONICAL_SOURCE_WITH_DATE_WARNING |
| JA004-C02 | /r/ y /d/ presentan semejanza articulatoria pero diferencias de duración y lugar de contacto | JA-W04-S01 | 「調音運動の分析」「持続時間の分析」「接触位置」 | japonés estándar; datos de la fuente | SOURCED_PENDING_REGISTRY |
| JA004-C03 | En ~200 hablantes del CSJ, la duración media de /r/ es menor que la de /d/ en los seis entornos vocálicos reportados | JA-W04-S01 | 「持続時間の分析」, tabla /r/ vs /d/ | corpus de habla; posiciones internas de palabra | SOURCED_PENDING_REGISTRY |
| JA004-C04 | El lugar de contacto de /r/ muestra variación contextual y la explicación por influencia vocálica se presenta como hipótesis | JA-W04-S01 | 「母音の影響」「まとめ」 | muestras de estándar/Tokio en la página | SOURCED_PENDING_REGISTRY |
| JA004-C05 | Contadores de la serie ハ pueden mostrar alternancias p~h~b condicionadas por el numeral | JA-W04-S02 | 「匹はハ行音で始まる助数詞」, tabla 1 | fenómeno morfofonológico específico | SOURCED_PENDING_REGISTRY |
| JA004-C06 | La explicación institucional vincula parte de las realizaciones con 促音 y con cambio histórico de la serie ハ | JA-W04-S02 | 「ハ行音の特殊性」 y desarrollo posterior | fenómeno histórico/morfofonológico | SOURCED_PENDING_REGISTRY |

## 14. Fuentes APA 7

Maekawa, K. (2026, July 27). *子供がラ行とダ行を区別できないのはなぜですか*. ことば研究館, National Institute for Japanese Language and Linguistics. https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-246/

Kubozono, H. (2024, November 27). *「匹」に「ひき」「びき」「ぴき」の読み方があるのはなぜですか*. ことば研究館, National Institute for Japanese Language and Linguistics. https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-225/

Okada, H. (1991). Japanese. *Journal of the International Phonetic Association, 21*(2), 94–96. https://doi.org/10.1017/S002510030000445X

## 15. Nota editorial

- SND-SRC-0023 permanece como baseline, no como prueba única de actualidad.
- JA-W04-S01 y JA-W04-S02 son fuentes contemporáneas puntuales, no sustitutos de una descripción segmental completa.
- La entrada no fija todavía un inventario contemporáneo definitivo.
- Una futura wave debe añadir una fuente segmental amplia y reciente antes de considerar EVIDENCE_CHECKED global.
- No se mezcla evidencia de Tokio, corpus general y explicación histórica sin indicar su alcance.

## Gate de salida

**Resultado:** RESEARCHED_PARTIAL.

Pendiente para EVIDENCE_CHECKED:
1. canonicalizar/deduplicar JA-W04-S01/S02;
2. añadir al menos una descripción segmental amplia contemporánea;
3. revisar el inventario completo contra esa fuente;
4. auditoría lingüística independiente;
5. verificar coherencia con JA-002/005/008/010.
