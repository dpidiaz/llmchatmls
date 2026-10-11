# MLS-SND — Composition readiness pilot wave 01

**Fecha:** 2026-10-11  
**Rama:** `snd/composition-readiness-pilot-wave-01`  
**Gate:** `EDITORIAL_REVIEW → READY_FOR_COMPOSITION`

## Alcance

- SND-FND-002 — Fonética y fonología
- SND-FND-003 — Fonema, alófono, segmento y realización
- SND-FND-004 — Producción del habla y tracto vocal

## Resultado

**3/3 PASS → READY_FOR_COMPOSITION en esta rama.**

## Precondiciones

Para las tres entradas se confirmó sobre la versión exacta evaluada:

- `EVIDENCE_CHECKED` registrado con claims VERIFIED, source_id y localizadores;
- `LINGUISTIC_REVIEW` PASS;
- `EDITORIAL_REVIEW` PASS;
- ausencia de cambio sustantivo posterior a esos gates;
- Source Registry contiene `SND-SRC-0024`;
- referencias cruzadas apuntan a IDs canónicos existentes.

## Controles de contenido

| Control | FND-002 | FND-003 | FND-004 |
|---|---|---|---|
| Identidad/alcance | PASS | PASS | PASS |
| Evidencia R33 | PASS | PASS | PASS |
| Revisión lingüística | PASS | PASS | PASS |
| Revisión editorial | PASS | PASS | PASS |
| Representación / IPA | N/A | N/A | N/A |
| Ejemplos materiales | N/A | N/A | N/A |
| Navegación | PASS | PASS | PASS |
| Unicode / legibilidad fuente | PASS | PASS | PASS |
| Independencia de audio | PASS | PASS | PASS |
| Blockers | ninguno | ninguno | ninguno |

## Reader-facing vs. metadata interna

`page-composition.md` y `reader-facing-evidence.md` permiten mantener estados, claims y logs de auditoría como metadata interna. La composición destinada al lector debe derivar el bloque “Fuentes y fundamento” sin publicar automáticamente los logs operativos.

Esto no delega una decisión lingüística al maquetador: la separación reader-facing/interna ya está definida por política canónica.

## Handoffs

- `composition/handoffs/SND-FND-002.md`
- `composition/handoffs/SND-FND-003.md`
- `composition/handoffs/SND-FND-004.md`

Cada manifiesto registra el blob `EDITORIAL_REVIEW` evaluado y el blob resultante `READY_FOR_COMPOSITION`.

## Cambios permitidos en COMPOSITION

Solo presentación: paginación, jerarquía visual, espaciado, tablas, cabeceras/pies e índices.

Un cambio a claims, fuentes/localizadores, análisis, alcance o wording lingüísticamente material exige rollback al gate correspondiente.

## No realizado

- no se modificó Source Registry;
- no se cambió ningún claim;
- no se alteró ninguna transcripción;
- no se actualizó STATUS/Master Inventory;
- no se declaró publicación final.