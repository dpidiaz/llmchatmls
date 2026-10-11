# SND-JA-008 — Kana y pronunciación

**Estado:** DRAFTED.  
**Idioma:** japonés.  
**Variedad / alcance:** japonés contemporáneo; referencia ortográfica general.  
**Dominio:** escritura / pronunciación / fonología.  
**Tipo de alcance:** NORMATIVE + ANALYTICAL_CHOICE.  
**Nivel de representación:** ortográfico / fonológico; no fonético estrecho.  
**Dependencias:** SND-JA-002, SND-JA-003, SND-JA-005; canonicalización de JA-W03-S01 y JA-W03-S02.  
**Versión:** wave-03.

## 1. Qué es

**Kana** es el nombre general de los silabarios japoneses hiragana y katakana. Para MLS-SND, kana es ante todo una **capa ortográfica**: está estrechamente relacionada con la organización sonora del japonés, pero no se tratará como si fuera una transcripción IPA.

La norma oficial `現代仮名遣い` parte del principio de escribir las palabras de acuerdo con la fonología del japonés contemporáneo, pero conserva convenciones ortográficas y excepciones históricas. La misma norma declara además que no pretende decidir entre pronunciaciones que presentan variación.

Por eso:

**kana ≠ sonido fonético exacto**.

## 2. Por qué importa en japonés

La relación entre kana y pronunciación es mucho más sistemática que la de muchas ortografías alfabéticas, pero esa sistematicidad puede inducir a dos errores:

1. creer que cada carácter escrito equivale siempre a una unidad fonética independiente;
2. creer que la grafía determina una única realización fonética estrecha.

La escritura kana representa de forma útil unidades y contrastes de la lengua, pero varias convenciones muestran que la relación no es una simple sustitución carácter→sonido.

## 3. Representación

La norma oficial organiza el sistema, entre otras categorías, en:

- **直音** (*chokuon*): unidades kana básicas;
- **拗音** (*yōon*): combinaciones con や・ゆ・よ pequeños;
- **撥音** (*hatsuon*): ん;
- **促音** (*sokuon*): っ;
- **長音** (*chōon*): vocales largas representadas mediante convenciones ortográficas específicas.

En MLS-SND, estas etiquetas describen **formas de representación ortográfica**. Cuando sea necesario especificar contraste fonológico o realización fonética, se usará una capa separada.

## 4. Kana y mora

NINJAL explica la **拍（モーラ）**, mora, como una unidad temporal de la pronunciación japonesa y la relaciona con unidades kana, incluidos casos como きゃ・きゅ・きょ.

Esto ayuda a entender por qué “un carácter = una sílaba” es una descripción insuficiente. Por ejemplo:

- きゃ se escribe con dos caracteres gráficos, pero funciona como una unidad de tipo yōon;
- ん y っ reciben tratamiento ortográfico propio;
- la duración vocálica puede requerir más de un signo kana.

La descripción detallada de mora y estructura moraica pertenece a SND-JA-002 y SND-JA-005; aquí solo se establece la consecuencia ortográfica.

## 5. Yōon: pequeños や・ゆ・よ

En `現代仮名遣い`, los **拗音** se representan con や, ゆ o よ pequeños después de otra kana cuando corresponde.

**SOURCE_EXAMPLE:** しゃ, しゅ, りゃ aparecen entre los ejemplos oficiales.

No deben analizarse como una mera secuencia de dos unidades pronunciadas de manera independiente por el solo hecho de contener dos caracteres.

## 6. ん y っ

La norma trata separadamente:

- **ん** como 撥音;
- **っ** como 促音.

**SOURCE_EXAMPLE:** がっこう es ejemplo oficial de 促音.

MLS-SND no inferirá desde la forma escrita una única realización fonética estrecha de ん o っ en todos los contextos. Sus realizaciones contextuales requieren fuentes fonéticas/fonológicas específicas.

## 7. Vocales largas

La norma de kana moderno ofrece convenciones distintas según la serie vocálica. Entre sus patrones:

- en la serie /a/, se añade あ;
- en la serie /i/, se añade い;
- en la serie /u/, se añade う;
- para ciertos valores largos de /e/ y /o/ existen convenciones y excepciones ortográficas específicas.

**SOURCE_EXAMPLE:** おかあさん, くうき y きょう aparecen en la norma oficial.

La consecuencia editorial es importante: **una vocal larga no se representa mediante una única estrategia gráfica universal en hiragana**.

## 8. Convenciones ortográficas que no equivalen mecánicamente a pronunciación

La propia norma incluye excepciones basadas en la tradición ortográfica.

Tres casos especialmente claros son las partículas:

- は se escribe は;
- へ se escribe へ;
- を se escribe を.

Estas grafías se conservan por convención gramatical y ortográfica; no deben usarse como prueba autónoma de una correspondencia fonética literal carácter→sonido.

La norma también conserva patrones como お en determinadas palabras históricamente condicionadas y い en formas cuya realización puede corresponder a una vocal larga o a una secuencia vocálica.

## 9. Variación y límites de la norma

`現代仮名遣い` declara expresamente que:

- no intenta decidir entre pronunciaciones alternativas de palabras con variación;
- no cubre como objetivo principal sonidos dialectales especiales;
- no cubre de la misma manera préstamos y sonidos extranjeros;
- sus reglas no tienen por qué corresponder a las de romanización o braille.

Por eso, una entrada de kana no puede sustituir una descripción fonética de Tokio, de una región determinada ni de un registro concreto.

## 10. Comparación útil

Para lectores familiarizados con alfabetos, puede ser útil decir que kana es una escritura fonológicamente informativa.

Etiqueta MLS-SND: **SEMEJANZA_PARCIAL**.

La comparación con un alfabeto deja de ser útil si induce a pensar que:

- cada signo corresponde a un fonema;
- cada carácter corresponde a una sílaba;
- la ortografía especifica todos los detalles fonéticos;
- las excepciones gramaticales y tradicionales desaparecen.

## 11. Advertencia de equivalencia

**Kana ≠ IPA.**  
**Carácter gráfico ≠ fonema.**  
**Carácter gráfico ≠ siempre una mora.**  
**Grafía normativa ≠ realización fonética estrecha.**

MLS-SND mantendrá estas capas separadas incluso cuando la correspondencia práctica sea muy regular.

## 12. Ejemplos

| forma | función aquí | etiqueta |
|---|---|---|
| しゃ | ejemplo de 拗音 | SOURCE_EXAMPLE |
| がっこう | ejemplo de 促音 | SOURCE_EXAMPLE |
| おかあさん | ejemplo de vocal larga escrita con あ | SOURCE_EXAMPLE |
| きょう | ejemplo de patrón de vocal larga en serie オ | SOURCE_EXAMPLE |
| は / へ / を como partículas | excepción ortográfica normativa | SOURCE_EXAMPLE |

Los ejemplos sirven para ilustrar la convención de escritura; no constituyen por sí solos una transcripción fonética.

## 13. Entradas relacionadas

- SND-JA-002 — Mora.
- SND-JA-003 — Vocales y duración.
- SND-JA-005 — Estructura moraica/silábica.
- SND-JA-010 — Romanización.
- SND-REP-009 — Ortografía y pronunciación.
- SND-REP-010 — Romanización.
- SND-REP-012 — Sistemas locales de anotación.

## 14. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| JA008-C01 | La norma moderna de kana toma la fonología contemporánea como principio, con excepciones de tradición ortográfica | JA-W03-S01 | 前書き 1 | norma general de escritura | SOURCED_PENDING_REGISTRY |
| JA008-C02 | La norma no pretende fijar una única pronunciación cuando existe variación | JA-W03-S01 | 前書き 6 | límites normativos | SOURCED_PENDING_REGISTRY |
| JA008-C03 | La norma excluye de su objetivo principal ciertos sonidos dialectales y de préstamos | JA-W03-S01 | 前書き 5 | límites normativos | SOURCED_PENDING_REGISTRY |
| JA008-C04 | Kana y romanización/braille no tienen correspondencia normativa necesaria uno-a-uno | JA-W03-S01 | 前書き 7 | sistemas de escritura | SOURCED_PENDING_REGISTRY |
| JA008-C05 | La norma distingue 直音, 拗音, 撥音, 促音 y 長音 | JA-W03-S01 | 本文 第1 §§1–5 | ortografía normativa | SOURCED_PENDING_REGISTRY |
| JA008-C06 | En 拗音 se usan や・ゆ・よ pequeños; っ representa 促音 | JA-W03-S01 | 本文 第1 §2 y §4 | ortografía normativa | SOURCED_PENDING_REGISTRY |
| JA008-C07 | La representación de vocales largas sigue convenciones por serie y no una única estrategia gráfica | JA-W03-S01 | 本文 第1 §5 | ortografía normativa | SOURCED_PENDING_REGISTRY |
| JA008-C08 | は・へ・を como partículas y otros casos conservan convenciones ortográficas especiales | JA-W03-S01 | 本文 第2 §§1–3, 6, 付記 | excepciones ortográficas | SOURCED_PENDING_REGISTRY |
| JA008-C09 | NINJAL define 拍（モーラ） como unidad temporal de pronunciación y la ejemplifica mediante unidades kana, incluido yōon | JA-W03-S02 | párrafo 「拍とは」 | explicación institucional | SOURCED_PENDING_REGISTRY |

## 15. Fuentes APA 7

Agency for Cultural Affairs, Government of Japan. (1986). *現代仮名遣い* [Modern kana usage] (Cabinet Notification No. 1, July 1, 1986). https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gendaikana/

National Institute for Japanese Language and Linguistics. (s. f.). *早口言葉はなぜ難しいのですか* [Why are tongue twisters difficult?]. ことば研究館. https://kotoba.ninjal.ac.jp/qa/yokuaru/qa-81/

## 16. Nota editorial

- Esta entrada trata la norma de kana como evidencia **ortográfica**, no como descripción fonética exhaustiva.
- Los ejemplos normativos no autorizan por sí solos una transcripción IPA.
- La descripción de mora detallada permanece en JA-002/005.
- Katakana para préstamos y sonidos extranjeros requiere una entrada/fuente específica si se amplía el alcance; la norma base consultada declara esos fenómenos fuera de su objetivo principal.
- JA-W03-S01 y JA-W03-S02 deben deduplicarse/canonicalizarse antes de integrar esta entrada en la rama matriz.

## Gate de salida

**Resultado de esta wave:** DRAFTED.

Para avanzar:
1. canonicalizar JA-W03-S01/S02;
2. reescribir los claims a IDs globales;
3. repetir auditoría R33;
4. revisión lingüística independiente;
5. comprobar consistencia con JA-002/003/005 y JA-010 antes de composición.
