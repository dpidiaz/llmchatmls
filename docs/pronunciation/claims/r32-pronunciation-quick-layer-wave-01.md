# MLS-SND — Claim R32 pronunciation quick layer wave 01

**Estado:** CLAIMED  
**Fecha:** 2026-10-12  
**Rama:** `snd/r32-pronunciation-quick-layer`  
**Base:** `feat/mls-snd-foundation`

## Alcance

Integrar en R32/composición una capa de acceso inmediato a pronunciación dentro de la reader-facing projection.

Orden lector propuesto cuando aplique:

`forma original → significado → pronunciación fácil → IPA → variedad/nota breve → detalle opcional`

## Invariantes

- No modifica R33.
- No altera claims, fuentes, localizadores ni alcance lingüístico.
- IPA y evidencia continúan como capas canónicas.
- La pronunciación fácil / respelling es una ayuda pedagógica derivada y dependiente del idioma del lector.
- No se promoverán estados editoriales automáticamente.
- No se inventará pronunciación faltante para completar la capa.

## Rutas previstas

- `docs/pronunciation/editorial/`
- `docs/pronunciation/qa/`
- plantillas y handoff de composición

## Piloto documental

- SND-FND-002
- SND-ENUS-001
- SND-ZHTW-007

El piloto valida arquitectura de composición; no introduce claims lingüísticos nuevos.
