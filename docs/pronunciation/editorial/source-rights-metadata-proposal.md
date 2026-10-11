# MLS-SND — Campos de acceso/licencia para Source Registry

Propuesta de extensión no destructiva.

## Campos

- `access_status`: OPEN | FREE_TO_READ | RESTRICTED | UNKNOWN
- `license`: texto normalizado o UNKNOWN
- `fulltext_verified`: yes/no
- `evidence_surface`: FULLTEXT | ABSTRACT | METADATA | INSTITUTIONAL_PAGE | DATASET | LEXICON
- `reuse_status`: CLEAR | ATTRIBUTION_REQUIRED | REUSE_CONSTRAINED | UNKNOWN
- `derivative_allowed`: yes/no/unknown
- `redistribution_allowed`: yes/no/unknown
- `notes_rights`: observaciones
- `verified_date`: YYYY-MM-DD

## Regla

Estos campos describen condiciones editoriales de acceso/reutilización.

No cambian:
- tier académico;
- alcance lingüístico;
- estado R33;
- calidad evidencial.

Una fuente puede ser excelente evidencia y al mismo tiempo tener reutilización restringida.
