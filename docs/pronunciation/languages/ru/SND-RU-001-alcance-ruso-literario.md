# SND-RU-001 — Ruso literario contemporáneo: alcance de referencia

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** ruso.  
**Dominio:** variedad / alcance descriptivo / norma.  
**Referencia editorial:** ruso literario contemporáneo, con separación obligatoria entre descripción fonética y ortoepía.

## 1. Por qué el alcance necesita dos capas

MLS-SND no utilizará una sola grabación, una sola ciudad ni un diccionario normativo como si cada uno describiera por sí solo todo el ruso contemporáneo.

Para el perfil se distinguen:

- una **capa descriptiva fonética/fonológica**, siempre ligada a la variedad y a los hablantes de la fuente;
- una **capa ortoépica**, destinada a documentar norma y variantes cuando una fuente especializada las codifica.

## 2. Moscú y San Petersburgo en la fuente descriptiva

Yanushevskaya y Bunčić señalan que tradicionalmente se reconocen dos grandes estándares de pronunciación, Moscú y San Petersburgo, y que sus diferencias se han reducido considerablemente en el ruso contemporáneo.

Los autores también mencionan el surgimiento de un estándar general que integra rasgos de ambas tradiciones.

## 3. Alcance exacto de la Illustration of the IPA

La Illustration de 2015 se basa en un hombre de poco más de cuarenta años, nacido y educado universitariamente en San Petersburgo. Los autores describen su pronunciación como representativa del estándar de San Petersburgo y de una norma más joven emergida en las décadas precedentes.

Por ello MLS-SND no etiquetará sus transcripciones estrechas simplemente como “la pronunciación rusa” sin indicar este alcance.

## 4. Capa ortoépica

El Instituto de la Lengua Rusa V. V. Vinogradov describe el *Большой орфоэпический словарь русского языка* de 2017 como una obra sobre pronunciación literaria rusa contemporánea que fija la norma y sus variantes, con pronunciación y acento de más de 80 000 palabras y atención a diferencias generacionales.

Esa obra es apropiada para preguntas normativas y lexicográficas, pero no se tratará como una transcripción de toda el habla espontánea.

## 5. Decisión editorial

El estado `REFERENCE_FIXED` del perfil ruso se limita a la **referencia ortoépica literaria**. Las descripciones fonéticas concretas conservarán siempre la etiqueta de su fuente y variedad.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| RU001-C01 | Tradicionalmente se reconocen estándares de Moscú y San Petersburgo y sus diferencias se han reducido | SND-SRC-0015 | Yanushevskaya & Bunčić 2015, p. 221, párrafo inicial sobre pronunciation standards | artículo / ruso contemporáneo | VERIFIED |
| RU001-C02 | La Illustration se basa en un hablante nacido y educado en San Petersburgo y los autores lo presentan como representativo de ese estándar | SND-SRC-0015 | p. 221, párrafo “The present Illustration…” | hablante y estándar declarados por los autores | VERIFIED |
| RU001-C03 | Las transcripciones estrechas del artículo se basan en la pronunciación del hablante | SND-SRC-0015 | pp. 221–222, nota sobre broad/narrow transcriptions | Illustration específica | VERIFIED |
| RU001-C04 | El diccionario de 2017 presenta pronunciación literaria contemporánea, norma y variantes, y cubre más de 80 000 palabras | SND-SRC-0016 | página institucional del Instituto Vinogradov, descripción bibliográfica | ortoepía/lexicografía | VERIFIED |

## 7. Fuentes

- Yanushevskaya, I., & Bunčić, D. (2015). Russian. *Journal of the International Phonetic Association, 45*(2), 221–228. https://doi.org/10.1017/S0025100314000395
- Каленчук, М. Л., Касаткин, Л. Л., & Касаткина, Р. Ф. (2017). *Большой орфоэпический словарь русского языка: Литературное произношение и ударение начала XXI века: норма и её варианты* (2-е изд.). АСТ-ПРЕСС КНИГА.

## 8. Nota editorial

“REFERENCE_FIXED” es una decisión MLS-SND de organización del perfil y no una afirmación de las fuentes.

## 9. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Límite:** ninguna transcripción del hablante de San Petersburgo se generaliza automáticamente a todo el ruso.

## Entradas relacionadas

- SND-RU-008 — Norma ortoépica y variantes.
- SND-RU-002 — Vocales: inventario analítico y realizaciones.

## Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** El perfil separa correctamente el alcance fonético de la Illustration y la referencia ortoépica; REFERENCE_FIXED queda limitado a esta última.
- **Control:** no se cambiaron source IDs, localizadores ni transcripciones; el cambio terminológico de RU-004 mantiene el mismo contenido analítico.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** claridad, jerarquía, navegación, terminología y visibilidad de límites entre descripción, análisis, norma y variación.
- **Cambios lingüísticos:** ninguno.
- **Claims R33 modificados:** ninguno.
- **Estado resultante:** EDITORIAL_REVIEW.
- **Siguiente gate:** composition-readiness; no se promueve automáticamente a READY_FOR_COMPOSITION.

## Composition readiness

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Versión evaluada (blob):** `34b197c06019fa5c60d6a119a0c4c400bff3a344`.
- **Handoff:** `docs/pronunciation/composition/handoffs/SND-RU-001.md`.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE`; esta entrada fija alcance descriptivo/normativo y no presenta una forma léxica concreta que justifique una pronunciación fácil derivada.
- **Reader-facing projection:** §§1–5, fuentes realmente utilizadas, navegación y la nota editorial necesaria para distinguir decisiones MLS-SND; tablas R33, auditorías y logs de revisión permanecen como metadata interna.
- **Control:** no se modificaron claims, fuentes, localizadores, transcripciones, análisis, variedad ni alcance.
