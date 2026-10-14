# Claim — SOURCE-ID-INTEGRITY 106/91

- Rama: `snd/source-integrity-107-wave-01`.
- Tipo: QA reproducible / source integrity.
- Estado: COMPLETE.
- SHA congelado: `f65fc8a87325de75014b07fbee83d34380e44669`.

## Corrección de universo

El conteo bruto inicial detectó 107 archivos con nombre `SND-*.md`, pero uno es un artefacto de revisión fuera de las raíces canónicas:

- `reviews/SND-FND-014-LINGUISTIC-REVIEW-20261011.md`.

El universo canónico correcto para este corte es **106 entradas** en `fundamentals/`, `representation/`, `comparative/`, `reference/` y `languages/`.

## Objetivo

Reescanear las 106 entradas físicas canónicas contra las 91 fuentes del Source Registry vigente.

## Checks

1. IDs físicos de entrada únicos;
2. filename ID = heading ID;
3. todos los `SND-SRC-NNNN` citados existen en el Registry;
4. detectar IDs locales de wave;
5. distribución de estados derivada de encabezados físicos;
6. detectar entradas sin ninguna referencia canónica;
7. cobertura física contra Master Inventory;
8. registrar SHA exacto; no proyectar el resultado a integraciones posteriores.

## Resultado resumido

- 106 entradas canónicas / 106 IDs únicos;
- 91 fuentes canónicas contiguas `SND-SRC-0001…0091`;
- 0 referencias canónicas inexistentes;
- 0 filename/heading mismatches;
- 0 entradas sin al menos una referencia canónica;
- 0 IDs físicos ausentes del Master Inventory;
- 1 token local conocido: `DE-PROP-003` en `DE-008`, estado `RESEARCHED`, explícitamente declarado como propuesta no canonicalizada y blocker de promoción;
- 0 tokens locales detectados en entradas promovidas más allá de ese caso pre-gate.

## Veredicto

`PASS_REFERENTIAL_WITH_PRE_GATE_NOTE`.

Integridad referencial no equivale a validación semántica R33 de claims, localizadores, alcance o licencias.