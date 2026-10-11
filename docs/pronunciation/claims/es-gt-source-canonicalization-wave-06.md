# Claim — es-GT source canonicalization wave 06

- Área: source integration / es-GT.
- Tipo: canonicalización + reparación de IDs locales.
- Base exacta: `a06dad5868eaaaf6dcc1071581554ab904c1ad2b`.
- Rama: `snd/es-gt-source-canonicalization-wave-06`.
- Estado: ACTIVE.

## Alcance

- resolver `ESGT-SRC-P01` contra fuente ya canónica;
- canonicalizar `ESGT-SRC-P03` (McKinnon 2020);
- canonicalizar `ESGT-SRC-P04` (Congosto Martín 2020);
- sustituir esos IDs en `SND-ESGT-002`;
- actualizar el source map es-GT;
- no promover el estado de ESGT-002;
- no modificar STATUS/WORK-QUEUE/INTEGRATION-QUEUE.

## Coordinación

- `ESGT-SRC-P01` corresponde a Utgård 2010 → `SND-SRC-0025`.
- #7328 puede reutilizar la fuente de Congosto una vez canonicalizada.
- El objetivo es eliminar el residuo que invalidó el PASS local-ID del scan global.
