# DE-001 / DE-007 — Editorial clean reapply audit — 2026-10-12

## Origen

Reaplicación limpia de la revisión editorial ya completada en PR #7420 sobre la matriz vigente.

## Versiones

Matriz base real de esta wave: `c9da0d2421b36dd1499def147145bec161bc55e9`.

Entradas antes de la reaplicación:
- DE-001: `0b076c093aa5c1571b12e727754d43bc1bf28cf8`
- DE-007: `c72eb4bc577301a57ee03f7d3cd4ec7450cfee7b`

Inputs originales revisados en #7420:
- DE-001: `93b971521f6fe92721596187173330486b6be7a9`
- DE-007: `5266d14fa989d7c28ab681c88290f55d0adff20d`

La comparación mostró que el contenido lingüístico actual coincide con el input revisado; la diferencia previa era únicamente la normalización de la cabecera Estado/Idioma.

## Cambios reaplicados

- promoción de DE-001 y DE-007 a `EDITORIAL_REVIEW`;
- navegación explícita entre DE-001/007/008;
- sustitución de gates obsoletos por el resultado editorial ya auditado;
- preservación de `MULTI_REFERENCE` y del rol lexicográfico de Duden.

## Adaptación al estado actual

El texto antiguo de #7420 decía que DE-008 seguía en RESEARCHED. Esa afirmación ya no es vigente.

La reaplicación actual registra que DE-008 está en `READY_FOR_COMPOSITION — PASS_WITH_SCOPE_WARNING` como mapa de cobertura y evita inferir por ello que DE-001/007 o el perfil alemán completo estén automáticamente listos para composición.

## Invariantes

No se modificaron:
- claims R33;
- source IDs;
- localizadores;
- IPA;
- ejemplos lingüísticos;
- análisis fonológico/fonético;
- alcance nacional de las fuentes.

## Resultado

**PASS — clean reapply seguro de la revisión editorial existente.**

Esta wave integra trabajo previamente revisado en vez de duplicar una nueva revisión editorial.
