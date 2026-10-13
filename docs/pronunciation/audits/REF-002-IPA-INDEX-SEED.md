# MLS-SND — Auditoría inicial de SND-REF-002

**Fecha:** 2026-10-11  
**ID:** SND-REF-002 — Índice IPA

## Fuente oficial comprobada

La página oficial de la International Phonetic Association confirma:

- mantenimiento oficial del IPA y su tabla por la Asociación;
- necesidad de aprobación del Council para cambios oficiales;
- subtablas de consonantes, vocales, diacríticos, suprasegmentales y tonos/acentos de palabra;
- reemisión anual desde 2025 con indicación de revisión sustantiva 2015/2005;
- licencia CC BY-SA 4.0 para la tabla Kiel y sus subpartes.

La versión interactiva oficial proporciona además las categorías y formas de los signos usados para sembrar el índice.

## Seed comprobado contra entradas integradas

Se revisó una muestra deliberada de entradas ya presentes en `feat/mls-snd-foundation`:

- SND-FR-002;
- SND-RU-002;
- SND-RU-005;
- SND-KO-004;
- SND-PTBR-006;
- SND-REP-005;
- SND-REP-006.

El seed registra solo símbolos explícitamente observados en esas entradas y un pequeño pool suprasegmental explicado por REP-006.

## Control importante

`/S/` en PTBR-006 queda como **SOURCE_SPECIFIC**, no como IPA, hasta documentar su estatus analítico en Callou.

## Resultado

**PASS para iniciar REF-002 como índice vivo.**

No se considera completo. La expansión depende de la integración de nuevas waves y deberá repetirse antes de composición.
