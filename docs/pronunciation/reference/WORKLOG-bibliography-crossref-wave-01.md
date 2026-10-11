# MLS-SND Reference — Bibliography & Cross-reference Wave 01

**Estado:** REVIEW_READY.

## IDs reclamados

- SND-REF-006 — Bibliografía general.
- SND-REF-007 — Bibliografías por perfil.

## Fuentes de verdad

- `MLS-SND-SOURCE-REGISTRY.md` para fuentes ya admitidas.
- `MLS-SND-MASTER-INVENTORY.md` para IDs y estados.
- `editorial/terminology.md` y `MLS-SND-TRANSCRIPTION-GUIDE.md` para relaciones conceptuales.

## Reglas

- no inventar referencias ausentes del Source Registry;
- no normalizar silenciosamente una referencia incompleta;
- distinguir bibliografía global de bibliografía específica por perfil;
- el grafo será documental: no cambiará estados editoriales ni relaciones lingüísticas no establecidas.
## Salida de Wave 01

- SND-REF-006 — bibliografía general generada desde 46 registros.
- SND-REF-007 — bibliografías por perfil derivadas del alcance registrado.
- Referencias con APA 7 registrado: 43.
- Registros METADATA_INCOMPLETE: SND-SRC-0004, SND-SRC-0026, SND-SRC-0032.
- IDs de entradas detectados en inventario: 144.
- Discrepancia global detectada: inventario declara 143; tablas suman 144 (95 perfiles, no 94).
- Dependencias a SND-SRC separadas del grafo de entradas.

## Pendientes de integración

1. Completar metadata APA de los tres registros incompletos en Source Registry.
2. Reconciliar conteo 143 vs 144 en Master Inventory.
3. Revisar clasificación por perfil cuando nuevas fuentes se integren.
4. Regenerar/actualizar el grafo después de merges grandes de perfiles.
## Coordinación REF-008

Durante esta wave apareció `snd/ref-cross-reference-graph-wave-01`, con un bootstrap más amplio (117 aristas y vocabulario controlado).
Esta rama **cede REF-008** al worker dedicado y elimina sus artefactos duplicados.

Hallazgos transferibles al integrador/worker REF-008:

- Master Inventory declara 143 unidades, pero las tablas actuales contienen 144 IDs únicos.
- El resumen declara 94 unidades de perfil, pero las tablas contienen 95.
- Dependencias `SND-* → SND-SRC-*` pertenecen a evidencia/R33 y no deben mezclarse con navegación entre entradas.