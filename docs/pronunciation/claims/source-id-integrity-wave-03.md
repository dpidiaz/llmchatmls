# Claim — Source-ID integrity wave 03

- Área: QA / source integrity.
- Base exacta: `ac5dd2e5584580b46fd39ddb92215c31f5db969b`.
- Rama: `snd/source-id-integrity-wave-03`.
- Tipo: read-only audit + report.
- Estado: ACTIVE.

## Objetivo

Reejecutar la integridad global después de la canonicalización es-GT que llevó el Source Registry a 58 fuentes.

## Checks

1. todos los `SND-SRC-NNNN` usados por entradas existen en el Registry;
2. ninguna entrada física integrada conserva IDs locales `*-SRC-*`;
3. entradas en gates promovidos conservan al menos una fuente canónica cuando contienen claims materiales;
4. IDs físicos de entrada son únicos;
5. el audit registra el SHA exacto y no se proyecta a integraciones futuras.

## Límites

- no modifica contenido lingüístico;
- no modifica STATUS/WORK-QUEUE/INTEGRATION-QUEUE;
- no sustituye fuentes automáticamente;
- no declara verdad lingüística: solo integridad referencial.
