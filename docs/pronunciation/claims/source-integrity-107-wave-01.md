# Claim — SOURCE-ID-INTEGRITY 107/91

- Rama: `snd/source-integrity-107-wave-01`.
- Tipo: QA reproducible / source integrity.
- Estado: ACTIVE.

## Objetivo

Congelar el HEAD actual y reescanear todas las entradas físicas canónicas contra el Source Registry vigente.

## Checks

1. IDs físicos de entrada únicos;
2. filename ID = heading ID;
3. todos los `SND-SRC-NNNN` citados existen en el Registry;
4. ninguna entrada conserva IDs locales de wave;
5. distribución de estados derivada de encabezados físicos;
6. detectar entradas sin ninguna referencia canónica;
7. registrar SHA exacto; no proyectar el PASS a integraciones posteriores.

## Límites

- read-only sobre contenido lingüístico;
- no modificar Source Registry;
- no modificar STATUS/Inventory hasta cerrar diagnóstico;
- integridad referencial ≠ validación semántica R33.