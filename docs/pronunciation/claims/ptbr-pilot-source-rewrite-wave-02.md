# MLS-SND claim — ptbr-pilot-source-rewrite-wave-02

- Perfil: pt-BR/rio.
- IDs: PTBR-001…010.
- Tipo: source-ID rewrite + clean integration.
- Base: feat/mls-snd-foundation con SND-SRC-0081…0091.
- Estado: ACTIVE.
- Fecha: 2026-10-11.

## Objetivo

Integrar las diez entradas del piloto histórico #7277 en `EVIDENCE_CHECKED`, sustituyendo IDs locales por IDs canónicos y preservando todos los HOLD/OPEN_QUESTION/date/sample warnings.

## Regla especial PTBR-002

`PTBR-W01-SRC-13` era catálogo/discovery aid. El claim C03 sobre Callou, Moraes & Leite (1996) se retira de la tabla R33 y pasa a research lead pendiente hasta auditar/canonicalizar la fuente primaria.

## No promoción

Esta wave no usa todavía el review lingüístico para subir a LINGUISTIC_REVIEW. Primero se exige source-ID integrity sobre la versión reescrita.