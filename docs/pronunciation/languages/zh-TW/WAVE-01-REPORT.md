# zh-TW pilot wave 01 — Reporte de handoff

## Rama

`snd/zh-tw-pilot-wave-01`

## Objetivo

Construir un primer perfil auditable de Taiwan Mandarin sin tratarlo como una pronunciación homogénea ni mezclar:
- convención institucional;
- romanización;
- IPA;
- descripción fonética;
- análisis fonológico;
- variación.

## Entradas producidas o ampliadas

| ID | Estado local | Nota |
|---|---|---|
| SND-ZHTW-001 | EVIDENCE_CHECKED | alcance y variación norte/centro |
| SND-ZHTW-002 | EVIDENCE_CHECKED acotado | organización silábica descriptiva; teoría fonológica abierta |
| SND-ZHTW-003 | RESEARCHED_PARTIAL | iniciales/finales; inventario aún no cerrado |
| SND-ZHTW-004 | EVIDENCE_CHECKED acotado | mapa tonal; una wave paralela trabaja tono |
| SND-ZHTW-005 | EVIDENCE_CHECKED | Tone 1 norte/centro; wave paralela puede superponer |
| SND-ZHTW-006 | BLOCKED_BY_CONFLICTING_EVIDENCE | Tone 3 sandhi |
| SND-ZHTW-007 | EVIDENCE_CHECKED | heredada: Zhuyin |
| SND-ZHTW-009 | EVIDENCE_CHECKED / PROVISIONAL_ACCEPT | Hanyu Pinyin como capa auxiliar; decisión global pendiente |
| SND-ZHTW-010 | EVIDENCE_CHECKED | sibilantes y nasales finales |

## Coordinación con otras ramas

Existe `snd/zh-tw-tone-wave-01`.

Por tanto, este PR **cede al integrador la versión canónica** de:
- SND-ZHTW-004;
- SND-ZHTW-005;
- SND-ZHTW-008.

La contribución principal de esta rama debe considerarse:
- ZHTW-001;
- ZHTW-002;
- ZHTW-003;
- ZHTW-009;
- ZHTW-010;
- SOURCES.md;
- nota de conflicto de ZHTW-006.

No fusionar dos versiones competidoras de 004/005 sin revisión.

## Fuentes locales propuestas

- ZHTW-LOCAL-001 — MOE Revised Mandarin Chinese Dictionary.
- ZHTW-LOCAL-002 — Myers & Tsay (2003), Tone 3 / yi sandhi.
- ZHTW-LOCAL-003 — Huang (2017), análisis tonal.
- ZHTW-LOCAL-004 — Fon (2020), inventario y variantes.
- ZHTW-LOCAL-005 — Fon et al. (2011), nasales finales.
- ZHTW-LOCAL-006 — Chiu et al. (2020), sibilantes.
- ZHTW-LOCAL-007 — Zhang (2009), vocales de Taipei.
- ZHTW-LOCAL-008 — Chiu & Lu (2021), nasales finales articulatorias.
- ZHTW-LOCAL-009 — Wan et al. (2024), corpus/fonotáctica de Taiwan Mandarin.
- ZHTW-LOCAL-010 — Wan & Jaeger (2003), representación vocálica.
- ZHTW-LOCAL-011 — Ogasawara (2011), VOT en oclusivas.

No se asignaron IDs SND-SRC globales para evitar colisiones entre ramas.

## Hallazgos que deben sobrevivir integración

1. Taiwan Mandarin presenta variación interna; “Taiwan” no equivale a una única realización.
2. Zhuyin, Hanyu Pinyin e IPA cumplen funciones distintas.
3. El inventario canónico de Mandarin no debe copiarse automáticamente como inventario fonético exclusivo de Taiwán.
4. Los mergers de sibilantes y nasales pueden depender de hablante/contexto.
5. Un corpus natural de 202 h respalda una clasificación de 12 tipos silábicos de superficie, pero ese análisis no se convierte automáticamente en teoría universal.
6. Wan & Jaeger (2003) muestran que el análisis vocálico de Taiwan Mandarin requiere decisión analítica explícita.
7. La aspiración tiene respaldo corpus y acústico; no debe explicarse como simple oposición ortográfica.
8. Tone 3 sandhi conserva conflicto de evidencia y no debe simplificarse.
9. Una tabla futura debe separar categorías fonológicas de realizaciones fonéticas.

## Gate siguiente

Solicitar **LINGUISTIC_REVIEW independiente** de ZHTW-001/002/003/009/010.

No promover a READY_FOR_COMPOSITION en esta wave.
