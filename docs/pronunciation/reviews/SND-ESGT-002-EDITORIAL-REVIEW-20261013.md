# SND-ESGT-002 — Editorial review — 2026-10-13

## Versión
- **Entrada:** SND-ESGT-002
- **Blob revisado:** `42181e98a6c5bd9bbd1897ba84b3c7c994cb51aa`
- **Gate de entrada:** LINGUISTIC_REVIEW — PASS_WITH_SCOPE_WARNING
- **Gate evaluado:** EDITORIAL_REVIEW

## Controles

### Identidad y alcance
PASS_WITH_SCOPE_WARNING. La entrada se lee como mapa de cobertura segmental y declara que no publica un inventario fonémico canónico.

### Estados internos del mapa
PASS. `SOURCE_MAPPED`, `EVIDENCE_MAPPED_WITH_CONTACT_SCOPE`, `EVIDENCE_CHECKED_CLUSTER`, `ACTIVE_RESEARCH` y `FULLTEXT_REQUIRED_FOR_SPECIFIC_CLAIMS` se mantienen como estados de cobertura evidencial, no como categorías fonémicas ni frecuencias nacionales.

### Contacto y muestras
PASS_WITH_SCOPE_WARNING. Las muestras español–k’ichee’ y español–kaqchikel permanecen delimitadas; no se extrapolan automáticamente al español de Guatemala en general.

### Evidencia incompleta
PASS_WITH_SCOPE_WARNING. Los claims finos de SND-SRC-0057 conservan `FULLTEXT_REQUIRED`; no se añaden valores, efectos estadísticos ni causalidad de contacto.

### Dominio
PASS. SND-SRC-0058 continúa fuera del mapa segmental porque corresponde a prosodia/entonación.

### Navegación
PASS. Las referencias a ESGT-001/003/004/005/009 y FND-017 son canónicas y ayudan a mantener separado el mapa de los clusters desarrollados.

## Invariantes
No se modificaron:
- claims R33;
- source IDs o localizadores;
- IPA;
- muestras o variedades;
- estados de cobertura interna;
- FULLTEXT_REQUIRED;
- análisis fonológico;
- condición de mapa.

## Resultado
**PASS_WITH_SCOPE_WARNING → EDITORIAL_REVIEW.**

Siguiente gate: composition readiness de esta versión como mapa de cobertura. Un inventario fonémico final requerirá otra versión y sus propios gates.
