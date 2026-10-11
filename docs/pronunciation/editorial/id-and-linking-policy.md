# MLS-SND — Política de IDs y referencias cruzadas

Estado: **norma editorial v0.1**.

## 1. Principio

El identificador de una entrada debe ser **estable aunque cambie la composición del libro**.

Por ello se separan:

- **ID canónico**: identidad persistente de la entrada;
- **número de capítulo/entrada impreso**: posición editorial en una edición concreta.

Renumerar capítulos no debe romper enlaces internos ni trazabilidad R33.

## 2. Formato canónico

Formato:

`SND-<ÁREA>-<NNN>`

Áreas actuales:

- FND — fundamentos;
- REP — representación/transcripción;
- ESGT — español de Guatemala;
- ENUS — inglés estadounidense;
- PTBR — portugués brasileño/carioca;
- IT — italiano;
- FR — francés;
- DE — alemán;
- ZHTW — mandarín de Taiwán;
- KO — coreano;
- JA — japonés;
- RU — ruso;
- CMP — comparación;
- REF — aparato de consulta.

## 3. Inmutabilidad

Una vez publicada o usada por evidencia/links, un ID:

- no se reutiliza para otro tema;
- no cambia por mover la entrada de capítulo;
- no se compacta para eliminar huecos.

Si una entrada se retira, el ID queda reservado con estado `RETIRED`.

## 4. División de entradas

Si una entrada se divide:

- el ID original se conserva para la parte que mantenga el núcleo semántico;
- las partes nuevas reciben IDs nuevos;
- la entrada original registra `SPLIT_INTO`.

## 5. Fusión

Si dos entradas se fusionan:

- se elige un ID superviviente según continuidad semántica;
- el otro pasa a `MERGED_INTO:<ID>`;
- nunca se borra silenciosamente el historial.

## 6. Tipos de enlace

Cada entrada puede declarar:

- **PREREQUISITE** — concepto que conviene entender antes;
- **RELATED** — relación temática;
- **COMPARE** — contraste útil;
- **SEE_ALSO_LANGUAGE** — mismo fenómeno en otro idioma;
- **REPRESENTATION** — sistema de escritura/transcripción relacionado;
- **EVIDENCE_CONTEXT** — entrada sobre variedad/alcance relevante.

## 7. Regla de enlaces

Los enlaces internos apuntan al **ID canónico**, no al número de página.

La composición final puede resolver el ID a:

- página;
- ancla HTML;
- ruta web;
- entrada de índice.

## 8. Enlaces entre idiomas

No crear enlaces comparativos solo porque dos entradas compartan una traducción terminológica.

Un enlace entre idiomas requiere una relación editorial explícita y no implica equivalencia fonética.

## 9. Compatibilidad con R33

Los claim IDs pertenecen a la versión evidencial de una entrada y no sustituyen el ID de entrada.

Ejemplo:

- entrada: `SND-ZHTW-005`;
- claim: `ZHTW005-C03`.

## 10. Compatibilidad con R44

Los work IDs organizan producción y pueden cambiar entre waves.

Nunca se usan como identidad pública de la entrada.
