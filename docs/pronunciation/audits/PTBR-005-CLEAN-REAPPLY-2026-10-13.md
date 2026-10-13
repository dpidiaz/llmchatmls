# PTBR-005 — Clean reapply audit — 2026-10-13

## Identidad
- **ID:** SND-PTBR-005
- **Origen:** PR #7277
- **Blob histórico:** `f7a3041dc520fffef6d91ab06bec03c84ca5c54c`
- **Estado de salida:** EVIDENCE_CHECKED como mapa parcial

## Canonicalización
- `PTBR-W01-SRC-01 → SND-SRC-0007` (Callou 2009).
- `SND-SRC-0006` ya es referencia canónica PB basada en hablante no carioca.

## Claims
- PTBR005-C01/C02 → SND-SRC-0007, pp. 133–145.
- PTBR005-C03 → SND-SRC-0006, alcance PB_OTHER_VARIETY.
- PTBR005-C04 → límite editorial: no publicar tabla total con cobertura incompleta.

## Dependencias físicas
A la fecha de la integración ya existen:
- SND-PTBR-006 — /S/ en coda;
- SND-PTBR-007 — róticas/coda;
- SND-PTBR-008 — /l/ en coda.

Esto refuerza la coherencia del mapa, pero **no** completa oclusivas, africación/palatalización, otras fricativas, nasales, laterales fuera de coda ni róticas onset/intervocálicas.

## Guards
- no convertir tres clusters de coda en inventario consonántico completo;
- no usar São Paulo/Valinhos como sustituto de Río;
- no inferir realizaciones no auditadas;
- mantener la distinción RIO_CARIOCA / PB_OTHER_VARIETY.

## Resultado
**PASS para integración física → EVIDENCE_CHECKED.**

El inventario consonántico total continúa OPEN_QUESTION; no se hereda LINGUISTIC_REVIEW.
