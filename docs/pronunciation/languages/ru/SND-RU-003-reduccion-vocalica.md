# SND-RU-003 — Reducción vocálica

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** ruso.  
**Dominio:** vocales / acento / procesos contextuales.  
**Alcance:** análisis y estándar descritos por SND-SRC-0015; las diferencias Moscú–San Petersburgo se etiquetan.

## 1. Acento y calidad vocálica

En la descripción de Yanushevskaya y Bunčić, la calidad de las vocales cambia de manera importante según aparezcan en sílaba tónica o átona. El artículo señala que las vocales en sílabas átonas están sujetas a reducción.

Este fenómeno no debe explicarse como una simple “lectura distinta de letras”: depende de estructura prosódica, contexto consonántico y del análisis adoptado.

## 2. Dos grados de reducción en la descripción citada

El artículo distingue generalmente dos grados de reducción según la posición de la vocal con respecto a la sílaba tónica.

- **primer grado:** inmediatamente antes de la sílaba tónica y también en vocal átona inicial de palabra; aparece además de forma variable en ciertas sílabas abiertas finales de frase;
- **segundo grado:** las demás sílabas átonas.

## 3. Una diferencia regional que debe conservarse

Para /a/ en el primer grado de reducción, el artículo contrasta realizaciones que identifica como características de San Petersburgo y de Moscú. MLS-SND conservará esta etiqueta regional en vez de fusionarlas en una sola transcripción “rusa”.

## 4. Duración

La misma fuente señala una tendencia de las vocales átonas a ser más cortas que las tónicas y de las vocales del segundo grado a ser más cortas que las del primero, con una salvedad explícita respecto de la relación duración–acento fuera de determinados contextos.

Por ello, MLS-SND no enseñará que “tónica = siempre más larga” como regla absoluta.

## 5. /e/ y /o/ en sílabas átonas

Dentro de la “standard pronunciation” descrita por el artículo, /e/ y /o/ no aparecen en sílabas átonas salvo un pequeño conjunto de préstamos señalado por los autores; el análisis fonológico del artículo representa las alternancias correspondientes mediante otros fonemas.

Esta formulación se conserva como **análisis de la fuente**, no como deducción automática desde la ortografía rusa.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| RU003-C01 | En sílabas átonas, las vocales están sujetas a reducción en la descripción del artículo | SND-SRC-0015 | p. 224, sección “Vowels”, párrafo tras la tabla vocálica | análisis del artículo | VERIFIED |
| RU003-C02 | Se describen generalmente dos grados de reducción condicionados por la posición respecto al acento | SND-SRC-0015 | p. 225, párrafo “Generally, there are two degrees…” | standard pronunciation descrita | VERIFIED |
| RU003-C03 | El primer grado aparece inmediatamente antes de la tónica y en vocal átona inicial; el segundo en las demás sílabas átonas | SND-SRC-0015 | p. 225, mismo párrafo | distribución descrita | VERIFIED |
| RU003-C04 | Para /a/ de primer grado, la fuente distingue una realización característica de San Petersburgo y otra de Moscú | SND-SRC-0015 | p. 225, discusión de /a/ y first-degree reduction | diferencia regional explícita | VERIFIED |
| RU003-C05 | Las vocales átonas tienden a ser más cortas que las tónicas, con matices contextuales | SND-SRC-0015 | p. 225, párrafo sobre duración; nota entre paréntesis | tendencia descrita | VERIFIED |
| RU003-C06 | En la standard pronunciation del artículo, /e/ y /o/ no ocurren normalmente en sílabas átonas, salvo préstamos excepcionales | SND-SRC-0015 | p. 225, inicio del párrafo sobre unstressed syllables | análisis de la fuente | VERIFIED |

## 7. Fuente

Yanushevskaya, I., & Bunčić, D. (2015). Russian. *Journal of the International Phonetic Association, 45*(2), 221–228. https://doi.org/10.1017/S0025100314000395

## 8. Nota editorial

La entrada evita fijar una única transcripción reducida para todo contexto y variedad. Las formas léxicas concretas deberán documentarse por separado.

## 9. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## Entradas relacionadas

- SND-RU-006 — Acento léxico.
- SND-RU-002 — Vocales: inventario analítico y realizaciones.

## Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** La reducción se vincula a acento, posición y variedad; Moscú/San Petersburgo permanecen etiquetados y la duración se formula como tendencia, no absoluto.
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
- **Versión evaluada (blob):** `1d7967d1df9caf5141992eaa90f14e5b574bdbe2`.
- **Handoff:** `docs/pronunciation/composition/handoffs/SND-RU-003.md`.
- **Pronunciation Quick Layer:** `OMITTED_WITH_REASON`; esta versión describe un sistema/fenómeno y no fija una única pareja forma–glosa con respelling derivada aprobada. No se inventa una ayuda fonética para llenar la capa.
- **Reader-facing projection:** contenido explicativo aprobado, fuentes utilizadas, navegación y notas editoriales necesarias; tablas R33, auditorías y logs de revisión quedan como metadata interna.
- **Control:** no se modificaron claims, fuentes, localizadores, transcripciones, análisis, variedad ni alcance.
