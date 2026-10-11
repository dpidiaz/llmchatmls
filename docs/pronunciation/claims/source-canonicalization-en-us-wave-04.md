# MLS-SND claim — source-canonicalization-en-us-wave-04

- Área: integración de fuentes / en-US.
- Tipo: deduplicación + canonicalización.
- Base apilada: snd/source-canonicalization-ja-writing-wave-03 (#7360).
- Estado: ACTIVE.
- Fecha: 2026-10-11.

## Objetivo

Canonicalizar las fuentes ya investigadas por #7278 y #7350 que desbloquean ENUS-003…008, sin promover automáticamente ninguna entrada.

## Rango reservado en esta cadena

SND-SRC-0061…SND-SRC-0070.

## Fuentes objetivo

- Clopper, Pisoni & de Jong (2005) — vocales regionales;
- Cohen Priva & Strand (2023) — schwa/duración;
- Fourakis (1991) — tempo, stress y reducción;
- Pitt et al. (2005) — metodología Buckeye;
- Buckeye Corpus 2nd release (2007);
- Clopper & Smiljanic (2015) — organización temporal regional;
- Clopper & Smiljanic (2011) — prosodia regional;
- Broeders & Gussenhoven — manual abierto de fonética estadounidense;
- CMUdict;
- cmudict-tools — formato y stress markers.

## Exclusiones

No se canonicalizan todavía Atlas of North American English, Nationwide Speech Project ni Johnson (2004): ninguna es necesaria para desbloquear el núcleo más reciente de las entradas seleccionadas.

## Gate

Canonicalizar una fuente no promueve un claim. Después de esta wave, las entradas afectadas requieren reescritura atómica de source IDs y nueva auditoría R33.
