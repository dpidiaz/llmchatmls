# MLS-SND — Linguistic Review Wave 01

**Fecha:** 2026-10-11  
**Rama:** `snd/linguistic-review-wave-01-current`  
**Base:** `feat/mls-snd-foundation`

## Objetivo

Ejecutar una segunda revisión lingüística del núcleo transversal después del gate R33 y sincronizarla con el trabajo concurrente ya incorporado a la rama matriz.

## Resultado global

### PASS — núcleo transversal

Quedan en `LINGUISTIC_REVIEW`:

- 12 entradas de fundamentos;
- 5 entradas de representación.

Total transversal revisado: **17 entradas**.

## Estado de perfiles

No se promueven automáticamente las entradas específicas de idiomas:

- 11 permanecen en `EVIDENCE_CHECKED`;
- ESGT-002 permanece en `SOURCE_MAPPED`;
- IT-004 permanece en `RESEARCHED` hasta registrar de forma canónica su fuente experimental.

## Controles lingüísticos aplicados

1. **Fonética ≠ fonología.**
2. **Pitch ≠ F0.**
3. **Tono ≠ entonación ≠ acento tonal.**
4. **Duración fonética ≠ cantidad fonológica automática.**
5. **Barras / / ≠ corchetes [ ].**
6. **Amplia/estrecha es un continuo de detalle, no una dicotomía mecánica basada en diacríticos.**
7. **Variación no se trata como desviación de una única norma.**
8. **Notación de la fuente se conserva cuando cambiarla implicaría imponer un análisis.**

## Ajustes de esta wave

### FND-011

La formulación pedagógica sobre intensidad, duración y pitch queda acotada. No se infiere que el acento exija universalmente un ascenso de F0.

### PTBR-001

La tabla R33 pasa a incluir evidencia sustantiva de variación regional/social en Callou (2009), no solo metadatos editoriales.

### PTBR-006

Se conserva la notación `/S/` empleada por la fuente para la sibilante postvocálica. No se normaliza silenciosamente a `/s/`. Los porcentajes de los corpus de los años 70/90 continúan explícitamente históricos.

## Concurrencia

La rama matriz evolucionó mientras se ejecutaba la revisión. Por ello esta wave se reconstruyó desde la versión actual de `feat/mls-snd-foundation` y evitó reintroducir duplicados ya resueltos por otros chats.

## Métricas del snapshot revisado

- 30 entradas únicas.
- 17 transversales en LINGUISTIC_REVIEW.
- 11 específicas de idioma en EVIDENCE_CHECKED.
- 1 SOURCE_MAPPED.
- 1 RESEARCHED.
- 0 READY_FOR_COMPOSITION.

## Siguiente gate

1. `EDITORIAL_REVIEW` del núcleo transversal;
2. revisión lingüística específica por idioma de los perfiles;
3. canonicalización de fuentes provisionales;
4. solo después, decidir qué entradas pueden pasar a `READY_FOR_COMPOSITION`.
