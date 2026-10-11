# MLS-SND — Linter estructural y evidencial

Estado: **QA v0.1**.

Comando propuesto:

`node scripts/validate-pronunciation.mjs`

Opciones:

- `--json` — salida estructurada;
- `--strict` — warnings también bloquean;
- `--root=<ruta>` — cambia el directorio MLS-SND.

## Reglas v0.1

### ERROR

- `ID_TITLE_MISSING` — archivo de entrada sin ID en H1.
- `ID_MISMATCH` — ID del nombre de archivo y del H1 no coinciden.
- `DUPLICATE_ENTRY_ID` — dos archivos reclaman el mismo ID.
- `UNICODE_REPLACEMENT` — aparece U+FFFD.
- `R33_SECTION_MISSING` — entrada EVIDENCE_CHECKED sin sección Evidencia R33.
- `UNKNOWN_SOURCE_ID` — se cita un SND-SRC no presente en Source Registry.
- `DANGLING_LOCAL_SOURCE_ID` — una entrada cita un ID local de fuente pero ese ID no está declarado en un `SOURCE-MAP`/`SOURCES-PROPOSED` del checkout validado.
- `DUPLICATE_CLAIM_ID` — el mismo claim_id aparece en entradas distintas.

### WARN

- `NON_NFC` — archivo no normalizado a NFC.
- `STATUS_MISSING` — entrada sin campo Estado.
- `NO_VERIFIED_CLAIM` — EVIDENCE_CHECKED sin ningún claim marcado VERIFIED.
- `UNDECLARED_INTERNAL_ID` — referencia a un ID que no existe como archivo ni en Master Inventory.

## Reglas de identidad

- `SND-SRC-xxxx` se excluye explícitamente del patrón de IDs de entrada.
- Los IDs de entrada exigen exactamente tres dígitos finales y no pueden consumir el prefijo de un Source ID.
- IDs locales recomendados como `JA-W04-S01`/`KO-W1-C04` y candidatos históricos `*-CAND-###`/`*-PROP-###` se detectan estructuralmente.
- Un ID local es válido en una branch solo si el checkout contiene su source map; antes de integración canónica debe resolverse a `SND-SRC-xxxx` según el protocolo de integración.

## Qué no valida

El linter **no** decide:

- si una afirmación es lingüísticamente verdadera;
- si una fuente es adecuada para el claim;
- si un localizador respalda realmente el texto;
- si una transcripción IPA es correcta;
- si una variedad está bien delimitada;
- si una entrada merece LINGUISTIC_REVIEW o EDITORIAL_REVIEW.

Es un control estructural. Los gates semánticos siguen siendo humanos/editoriales.

## Política de CI

Recomendación:

1. modo normal en cada PR;
2. ERROR bloquea integración;
3. WARN se registra pero no bloquea inicialmente;
4. cuando el corpus esté estabilizado, activar `--strict` en ramas de composición.

## Extensiones futuras

- validar sintaxis de tablas R33;
- comprobar localizador no vacío por claim VERIFIED;
- validar relaciones del grafo de referencias;
- comprobar metadatos canónicos;
- validar cobertura de índices;
- comprobar que READY_FOR_COMPOSITION tenga ambos reviews previos documentados.
