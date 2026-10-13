# PTBR-007 — Clean reapply audit — 2026-10-13

## Identidad
- **ID:** SND-PTBR-007
- **Origen:** PR #7277, `snd/pt-br-rio-pilot-wave-01`
- **Blob histórico:** `0d960005e29ab336bf4138647913ffb172742af8`
- **Destino:** `feat/mls-snd-foundation`
- **Tipo:** cobertura física por clean reapply
- **Estado de salida:** EVIDENCE_CHECKED

## Comprobación de ausencia
La matriz observada al reclamar no contenía un canónico físico SND-PTBR-007. La Work Queue lo registraba entre los gaps PTBR.

## Canonicalización de fuentes

| ID histórico | Fuente | ID canónico | Resultado |
|---|---|---|---|
| PTBR-W01-SRC-03 | Callou, Moraes & Leite (1998), R final | SND-SRC-0082 | MATCH |
| PTBR-W01-SRC-04 | Silva (2026), FavRio/coda (r) | SND-SRC-0083 | MATCH |

El Source Registry canónico conserva autores, obra, alcance y localizadores compatibles con los claims heredados.

## Claims preservados
- **PTBR007-C01…C04:** SND-SRC-0082; NURC histórico, pp. 61–72 y secciones ya declaradas.
- **PTBR007-C05:** SND-SRC-0083; resumen/registro institucional, únicamente alcance del estudio FavRio.

No se usa el resumen de Silva para afirmar resultados finos.

## Scope guards
- RIO_SUBSCOPE:NURC no se convierte en Río contemporáneo completo.
- FavRio/periferias no se convierten en toda la comunidad carioca.
- datos de 1970/1990 permanecen históricos.
- onset/intervocálico siguen abiertos.
- ninguna realización fonética concreta nueva se infiere.

## Cambios respecto del histórico
1. remapeo de IDs locales a `SND-SRC-0082/0083`;
2. bibliografía de Silva alineada con el registro canónico;
3. nota interna de clean reapply.

No se modifican claims materiales, análisis o localizadores.

## Gate
**PASS para integración física → EVIDENCE_CHECKED.**

La integración no equivale a LINGUISTIC_REVIEW. El siguiente gate debe revisar la versión canónica concreta.
