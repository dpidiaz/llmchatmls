# SOURCE-CANONICALIZATION-EN-US-WAVE-04

Fecha: 2026-10-11.

## Base apilada

- parent: #7360 / `snd/source-canonicalization-ja-writing-wave-03`;
- rango previo: SND-SRC-0001…0060;
- rango de esta wave: SND-SRC-0061…0070.

## Deduplicación

No se encontraron DOI/URL/autor+título equivalentes en SND-SRC-0001…0060 para las diez fuentes admitidas.

## Mapeo

| ID local | ID canónico | Función |
|---|---|---|
| ENUS-CAND-002 | SND-SRC-0061 | sistemas vocálicos regionales |
| ENUS-W2-S01 | SND-SRC-0062 | schwa/duración |
| ENUS-W2-S02 | SND-SRC-0063 | stress/tempo/reducción |
| ENUS-CAND-006 | SND-SRC-0064 + 0065 | metodología Buckeye + corpus |
| ENUS-CAND-005 | SND-SRC-0066 | organización temporal regional |
| ENUS-CAND-004 | SND-SRC-0067 | prosodia Southern/Midland |
| ENUS-CAND-008 | SND-SRC-0068 | word stress / manual universitario |
| ENUS-CAND-009 | SND-SRC-0069 + 0070 | diccionario + formato/stress markers |

## Fuentes deliberadamente no promovidas

- ENUS-CAND-001 — Atlas of North American English: no es necesario para la integración mínima y los claims finos requerirían localizadores internos del libro.
- ENUS-CAND-003 — Nationwide Speech Project: útil, pero no necesario para las entradas seleccionadas.
- ENUS-CAND-007 — Johnson (2004): la wave especializada #7350 reemplaza la versión antigua de ENUS-004 y usa fuentes más específicas.

## Controles

- DOI de 0061/0062/0063/0064/0066/0067 comprobado contra publisher/PubMed/PMC.
- Buckeye 0065 comprobado contra sitio oficial de Ohio State.
- 0068 comprobado contra el libro abierto universitario y su licencia declarada.
- 0069/0070 comprobados directamente contra los repositorios `cmusphinx/cmudict` y `cmusphinx/cmudict-tools`.
- 0069 conserva la advertencia explícita de errores/omisiones/inconsistencias del proyecto.
- 0070 se usa solo para semántica del formato, no como fuente fonológica.

## Gate

**SOURCE_CANONICALIZATION_PASS**, condicionado al orden de merge de la cadena #7356 → #7360 → esta wave.

Este gate no promueve ninguna entrada. Después de integrar estas fuentes, los claims locales deben reescribirse a IDs canónicos y volver a auditarse.
