# ESGT-009 / ESGT-010 — Editorial clean reapply audit — 2026-10-12

## Origen

Reaplicación limpia de los outputs editoriales ya revisados en PR #7442.

## Base actual

`9c2bb7f88da9fc0d0028e56b33e6b2a8785c4250`

## Exact-version proof

- ESGT-009 actual antes de esta wave: `b1ea20609585933f8b4a2750573702afbc8530e9`
- ESGT-009 input revisado en #7442: `b1ea20609585933f8b4a2750573702afbc8530e9`
- output editorial reaplicado: `78933baf1340f366069cf05011b6f595444eda7e`

- ESGT-010 actual antes de esta wave: `ed6bdde7a2591606d5507fd56a1ddfcfda50d616`
- ESGT-010 input revisado en #7442: `ed6bdde7a2591606d5507fd56a1ddfcfda50d616`
- output editorial reaplicado: `68a2e777f49d112a3fbbed98744a88286cdf747a`

Los inputs coinciden byte a byte con las versiones que recibieron la revisión editorial original.

## Alcance reaplicado

### ESGT-009

- estado a `EDITORIAL_REVIEW`;
- normalización `sociophonética → sociofonética`;
- navegación y gate editorial;
- preservación de `CONTACT_SCOPE_WARNING`.

### ESGT-010

- estado a `EDITORIAL_REVIEW`;
- navegación normalizada;
- gate editorial explícito;
- preservación de ortografía ≠ transcripción fonética.

## Exclusión

ESGT-003 también formaba parte de #7442, pero queda fuera de esta reaplicación porque fue revisado e integrado por una wave posterior y ya avanzó a composición.

## Invariantes

No se modificaron claims R33, fuentes, localizadores, IPA, variedad ni análisis lingüístico.

## Resultado

**PASS — exact clean reapply de ESGT-009/010.**
