# MLS-SND — Audit R32 Pronunciation Quick Layer

**Fecha:** 2026-10-12  
**Rama:** `snd/r32-pronunciation-quick-layer`  
**PR:** #7480  
**Base auditada:** `feat/mls-snd-foundation@345ca37a6bd94079f5910dbf15963edb0c30e461`

## Resultado

**PASS — integración R32/composición.**

La wave incorpora una capa de acceso rápido a pronunciación como **reader-facing projection derivada**, sin modificar R33.

## Cambios de arquitectura

1. Nueva norma: `editorial/pronunciation-quick-layer.md`.
2. `composition-readiness.md` exige clasificar la capa como:
   - `PRESENT`
   - `NOT_APPLICABLE`
   - `OMITTED_WITH_REASON`
3. El Composition Handoff Manifest registra locale, forma fuente, glosa, pronunciación fácil, representación de origen, alcance y nota de derivación.
4. `page-composition.md` ubica la capa rápida antes del análisis profundo cuando aplica.
5. `reader-facing-evidence.md` declara que la respelling no es evidencia.
6. El gate written-only añade controles WRT-13/14.
7. QA de composición incorpora controles específicos.
8. La plantilla canónica aclara que la capa se deriva en composición y no sirve para rellenar gaps del contenido.

## Invariantes comprobadas

- No se modificó ninguna entrada lingüística `SND-*.md`.
- No se modificó ninguna tabla R33.
- No cambiaron `source_id`, localizadores ni claims.
- No se cambiaron estados editoriales.
- No se añadieron IPA, romanizaciones o pronunciaciones inventadas.
- La pronunciación fácil queda explícitamente marcada como aproximada y dependiente del reader locale.
- Una ausencia de datos se representa como `OMITTED_WITH_REASON`, nunca como inferencia de composición.

## Piloto

### SND-FND-002

`NOT_APPLICABLE`: fundamento conceptual; no contiene una forma léxica que justifique una caja rápida.

### SND-ENUS-001

`NOT_APPLICABLE`: entrada de alcance MULTI_REFERENCE; no debe fabricarse un ejemplo fonético.

### SND-ZHTW-007

`OMITTED_WITH_REASON`: la versión READY no contiene ejemplos Zhuyin reader-facing ni forma + IPA aprobados suficientes para derivar la capa.

## Compatibilidad hacia atrás

Las entradas ya `READY_FOR_COMPOSITION` no pierden automáticamente su estado.

La capa se clasifica en la siguiente composición/handoff. Solo se reabre revisión si producirla exige una decisión lingüística nueva.

## Conclusión

La arquitectura permite combinar:

`acceso inmediato para el lector + IPA/sistemas locales + detalle profundo + R33 auditable`

sin convertir la respelling pedagógica en representación canónica.
