# MLS-SND — Linguistic review JA-006/007 — wave 04

**Fecha:** 2026-10-11.  
**Target:** PR #7332 / `snd/japanese-accent-wave-03`.  
**Input blobs:** JA-006 `9a3e915c7060b63e9385bca43e357f5870c90c7b`; JA-007 `296f665ca390fa5f19288e1e28314bc92c5edd60`.  
**Resultado:** **2/2 PASS_WITH_NOTE**.

## 1. JA-006 — Acento de Tokio como referencia

### Evidence check

SND-SRC-0014 / NINJAL OJAD confirma que:

- el proyecto produjo un diccionario de acento en línea para docentes y estudiantes;
- toma como referencia la **lengua común (dialecto de Tokio)**;
- distingue el patrón de una palabra aislada de patrones después de flexión y conexión;
- el diseño del diccionario incluye información de formas de diccionario y formas flexionadas.

Los claims JA006-C01…C04 permanecen dentro de ese alcance.

### Terminología

La entrada hace bien en separar:

- la terminología institucional japonesa `アクセント`;
- la etiqueta española editorial **acento tonal**;
- tono léxico de lenguas tonales;
- entonación de frase.

**Nota de gate:** mientras FND-014 siga resolviendo la política general de “acento tonal / pitch accent”, JA-006 no debe usarse para convertir el japonés en ejemplo de una tercera categoría tipológica universal. La propia entrada ya contiene esa cautela.

### Veredicto

**PASS_WITH_NOTE.** No requiere cambio factual para superar la revisión lingüística.

## 2. JA-007 — Variación y cambio en el acento de Tokio

### Evidence check

SND-SRC-0013 / NINJAL `東京語アクセント資料` confirma:

- 12,803 palabras seleccionadas porque se esperaba variación acentual;
- 19 hablantes, seleccionados considerando edad, zona (Yamanote/Shitamachi) y sexo;
- investigación principal realizada entre 1982 y 1984;
- objetivo explícito de documentar la diversidad del acento de Tokio moderno, base del acento de lengua común;
- inclusión de patrones de cuatro diccionarios;
- análisis derivados que reportan diferencias por edad y diferencias respecto de diccionarios, además de procesos de cambio.

Los claims JA007-C01…C06 corresponden al recurso y sus localizadores.

### Control temporal

La entrada conserva correctamente la fecha de los datos y evita presentar el corpus 1982–1984 como evidencia automática del uso de 2026.

Este control es obligatorio para cualquier entrada futura que cite un patrón léxico concreto desde este recurso.

### Control de variedad

La distinción Yamanote/Shitamachi y la variación interna impiden tratar “Tokio” como una voz única. JA-007 respalda, en vez de contradecir, la política `REFERENCE_FIXED` limitada al papel de **ancla prosódica**, no a la totalidad del japonés.

### Veredicto

**PASS_WITH_NOTE.** No requiere cambio factual para superar la revisión lingüística.

## 3. Controles negativos

Esta revisión no autoriza a afirmar que:

- OJAD sea una descripción exhaustiva de la prosodia japonesa;
- Tokio represente todas las variedades japonesas;
- los datos de 1982–1984 sean automáticamente actuales en 2026;
- “acento tonal” sea una clase tipológica universal ya cerrada por MLS-SND;
- patrones de diccionario y patrones observados en hablantes sean idénticos.

## 4. Gate

Después de integrar el contenido de #7332 y esta auditoría:

- JA-006 puede promoverse de `EVIDENCE_CHECKED` a `LINGUISTIC_REVIEW`;
- JA-007 puede promoverse de `EVIDENCE_CHECKED` a `LINGUISTIC_REVIEW`;
- el siguiente gate es `EDITORIAL_REVIEW`;
- FND-014 continúa como dependencia terminológica general, no como bloqueo de los claims actuales.

No se incluye `READY_FOR_COMPOSITION`.
