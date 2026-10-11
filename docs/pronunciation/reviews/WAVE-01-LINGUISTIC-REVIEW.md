# MLS-SND — Linguistic Review Wave 01

**Fecha:** 2026-10-11  
**Rama:** `snd/linguistic-review-wave-01`  
**Base:** `feat/mls-snd-foundation`

## Objetivo

Ejecutar una segunda pasada lingüística sobre la primera wave después de R33, sin confundir evidencia comprobada con revisión especializada por idioma.

## Resultado

### PASS — núcleo transversal

Las siguientes entradas superan esta revisión y avanzan a `EDITORIAL_REVIEW`:

- SND-FND-002 — Fonética y fonología.
- SND-FND-003 — Fonema, alófono, segmento y realización.
- SND-FND-004 — Producción del habla y tracto vocal.
- SND-FND-006 — Consonantes: parámetros articulatorios.
- SND-FND-007 — Vocales: parámetros articulatorios.
- SND-FND-008 — Sílaba.
- SND-FND-009 — Fonotáctica.
- SND-FND-011 — Acento y prominencia.
- SND-FND-013 — Tono.
- SND-FND-015 — Entonación.
- SND-REP-002 — Qué es el AFI/IPA.
- SND-REP-005 — Diacríticos del IPA.
- SND-REP-006 — Suprasegmentales, tonos y acentos de palabra en el IPA.

## HOLD — perfiles lingüísticos

Las 9 entradas específicas de idiomas permanecen en `EVIDENCE_CHECKED`.

Esto no indica un error. Indica que R33 y una segunda pasada interna no sustituyen revisión competente del idioma/variedad.

Incluye:

- ESGT-001, ESGT-005;
- ENUS-001, ENUS-009;
- PTBR-001, PTBR-006;
- ZHTW-007;
- KO-009;
- JA-001.

## Conflictos de concurrencia resueltos

Se encontraron tres IDs duplicados creados por chats paralelos.

### FND-004

Canónico: `SND-FND-004-produccion-y-tracto-vocal.md`.

La versión paralela sobre aparato vocal fue consolidada y eliminada. Se conservaron la referencia a diagramas mediosagitales y el papel de los pliegues vocales.

### FND-006

Canónico: `SND-FND-006-consonantes-parametros-articulatorios.md`.

Se incorporó la advertencia contra confundir sonoridad/voicing con intensidad.

### FND-007

Canónico: `SND-FND-007-vocales-parametros.md`.

Se incorporaron continuidad del espacio vocálico, nasalidad y duración como dimensiones posibles sin convertirlas en contrastes universales.

## Correcciones lingüísticas importantes

1. **Pitch ≠ F0.** FND-013 distingue ahora la percepción/categorización de altura de su correlato acústico de frecuencia fundamental.
2. **Acento.** FND-011 conserva el resumen pedagógico de la fuente sobre intensidad, duración y pitch, pero prohíbe convertir “higher pitch” en regla universal.
3. **Portugués carioca.** PTBR-006 conserva `/S/`, la notación analítica de la fuente para la sibilante postvocálica, en lugar de normalizarla silenciosamente a `/s/`.
4. **PTBR-001.** Los claims de alcance se realinearon con pasajes sustantivos de Callou (2009), no solo con metadatos editoriales.
5. **Temporalidad.** Los porcentajes cariocas de los corpus de los 70/90 permanecen explícitamente históricos.

## Criterio de salida

Esta wave **no** autoriza todavía composición final.

Siguiente trabajo:

1. EDITORIAL_REVIEW de las 13 entradas transversales;
2. revisión lingüística específica/especializada de los perfiles piloto;
3. solo después, decidir si se congela la arquitectura del tomo.
