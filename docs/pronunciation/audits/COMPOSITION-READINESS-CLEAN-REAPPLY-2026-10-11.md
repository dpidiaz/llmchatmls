# Composition readiness — clean reapply audit

Fecha: **2026-10-11**.

## Contexto canónico

Corte de matriz al iniciar esta wave:

- 90 entradas físicas / 90 IDs únicos;
- 40 en `EDITORIAL_REVIEW`;
- 0 en `READY_FOR_COMPOSITION`.

## Resultado

**PASS_WORKFLOW_COMPATIBILITY**

Los documentos reaplicados son compatibles con el workflow vigente:

`INVENTORY → SOURCE_MAPPED → RESEARCHED → DRAFTED → EVIDENCE_CHECKED → LINGUISTIC_REVIEW → EDITORIAL_REVIEW → READY_FOR_COMPOSITION`

No se introduce un estado adicional.

## Regla central validada

`EDITORIAL_REVIEW` no implica readiness automática.

Para pasar a `READY_FOR_COMPOSITION`, una versión concreta debe:

1. conservar gates evidencial, lingüístico y editorial válidos para esa versión;
2. no tener blockers materiales abiertos;
3. superar controles de representación, navegación, ejemplos y Unicode;
4. llevar un Composition Handoff Manifest;
5. volver al gate afectado si composición detecta un problema material.

## Separación de responsabilidades

El carril COMPOSITION puede ajustar presentación visual, pero no puede cambiar sin rollback:

- claims;
- fuentes/localizadores;
- IPA/transcripciones;
- análisis;
- variedad/alcance;
- ejemplos lingüísticamente materiales.

## Relación con límites del tomo

El gate conserva:

- independencia obligatoria respecto de audio;
- modularidad por entrada;
- posibilidad de que una entrada ocupe más de una página;
- prohibición de usar composición para resolver problemas lingüísticos.

## No realizado

- no se promovió ninguna entrada;
- no se actualizó STATUS;
- no se modificó contenido lingüístico;
- no se modificó Source Registry;
- no se reinterpretó EDITORIAL_REVIEW como aprobación final.

## Recomendación de integración

Clean reapply directo de:

- `editorial/composition-readiness.md`;
- `editorial/composition-handoff-template.md`;
- este audit;
- claim de la wave.

Después de integrar, una wave independiente puede seleccionar un pequeño lote de entradas EDITORIAL_REVIEW y ejecutar el gate por versión concreta.
