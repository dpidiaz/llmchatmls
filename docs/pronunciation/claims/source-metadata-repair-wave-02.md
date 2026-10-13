# MLS-SND work claim — Source metadata repair wave 02

**Branch:** `snd/source-metadata-repair-wave-02`  
**Base:** `feat/mls-snd-foundation`  
**Type:** Source Registry metadata repair  
**Estado:** REVIEW_READY

## Alcance

Esta wave no modifica IDs, tiers, cobertura, localizadores ni estados lingüísticos.

Reparaciones:

- SND-SRC-0004: normaliza el nombre del campo `APA 7 canónica para R33` → `APA 7`; la referencia no cambia.
- SND-SRC-0026: añade APA 7 institucional del Projeto NURC-RJ/UFRJ.
- SND-SRC-0032: añade APA 7 institucional de *표준 발음법* del National Institute of Korean Language.
- SND-SRC-0049: añade APA 7 institucional de UNGEGN.
- SND-SRC-0050: añade APA 7 institucional de Unicode CLDR.

## Gate de metadatos

Snapshot inicial:

- fuentes canónicas detectadas: 56;
- campos APA detectados antes de la reparación: 52;
- source IDs modificados: 0;
- alcances lingüísticos modificados: 0.

Resultado esperado tras esta wave: **56/56 registros con campo APA 7 explícito**.
