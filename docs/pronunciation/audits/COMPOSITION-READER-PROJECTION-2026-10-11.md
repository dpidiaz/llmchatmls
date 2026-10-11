# MLS-SND — Composition reader-facing projection audit

**Fecha:** 2026-10-11
**Wave:** snd/composition-reader-projection-wave-01

## Problema

El pilot FND-002 detectó COMP-BLOCKER-001: una entrada puede contener contenido reader-facing y metadata interna de R33/reviews en el mismo archivo, mientras COMPOSITION no debe decidir qué mostrar.

## Políticas preexistentes

`reader-facing-evidence.md` ya distingue capa interna y capa de lectura.

`page-composition.md` ya establece que los metadatos internos de auditoría pueden permanecer en el repositorio sin cargar visualmente la página de lectura.

## Cambio

El gate de composición y el Composition Handoff Manifest incorporan una **proyección reader-facing explícita**.

El manifest debe clasificar:

- bloques incluidos en la edición de lectura;
- metadata interna excluida;
- tratamiento de Fuentes y fundamento;
- visibilidad de notas editoriales;
- cualquier sección ambigua.

## Resultado

**PASS_WORKFLOW_COMPATIBILITY.**

El cambio no altera R32, R33 ni R44, no modifica contenido lingüístico y no promueve entradas.

COMP-BLOCKER-001 pasa de ser un blocker estructural general a una condición verificable por entrada: si la proyección está definida inequívocamente, la coexistencia física de metadata interna en el archivo fuente no bloquea por sí sola la composición.

## Siguiente paso

Reejecutar el pilot de FND-002 usando el nuevo manifest. Si no aparecen otros blockers, puede evaluarse para READY_FOR_COMPOSITION.