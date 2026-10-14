# MLS-SND — SOURCE-ID-INTEGRITY 106/91

**Fecha:** 2026-10-11  
**Rama:** `snd/source-integrity-107-wave-01`  
**SHA congelado:** `f65fc8a87325de75014b07fbee83d34380e44669`  
**Resultado:** `PASS_REFERENTIAL_WITH_PRE_GATE_NOTE`

## 1. Universo auditado

El árbol contiene 107 archivos cuyo basename coincide con `SND-*.md`, pero uno no es una entrada canónica:

- `docs/pronunciation/reviews/SND-FND-014-LINGUISTIC-REVIEW-20261011.md`.

Las raíces canónicas auditadas fueron:

- `fundamentals/` — 18;
- `representation/` — 12;
- `comparative/` — 1;
- `reference/` — 1;
- `languages/` — 74.

**Total canónico: 106 entradas.**

## 2. Source Registry

- fuentes canónicas detectadas: **91**;
- rango: `SND-SRC-0001…SND-SRC-0091`;
- huecos numéricos: **0**.

## 3. Integridad física

- IDs físicos únicos: **106/106**;
- IDs físicos duplicados: **0**;
- filename ID ≠ heading ID: **0**;
- IDs físicos no presentes en Master Inventory: **0**.

El Master Inventory contiene 144 IDs; 38 candidatas aún no tienen archivo físico. Eso es consistente con un inventario prospectivo y no se cuenta como pérdida.

## 4. Integridad de fuentes

- referencias `SND-SRC-NNNN` a IDs inexistentes: **0**;
- entradas sin ninguna referencia canónica: **0**;
- tokens locales detectados: **1**.

### Token local conocido

`SND-DE-008` contiene `DE-PROP-003` en dos menciones textuales.

El propio archivo declara que:

- `DE-PROP-003` todavía no tiene metadatos canónicos completos;
- la propuesta solo podría aportar contexto futuro;
- `DE-008` permanece en `RESEARCHED` y esa carencia es uno de sus blockers.

Por tanto, el token no se interpreta como Source ID canónico ni como fuga silenciosa de una entrada promovida. Debe resolverse antes de cualquier promoción de `DE-008`.

## 5. Distribución de estados físicos

| Estado | Entradas |
|---|---:|
| EDITORIAL_REVIEW | 44 |
| LINGUISTIC_REVIEW | 35 |
| EVIDENCE_CHECKED | 21 |
| SOURCE_MAPPED | 2 |
| RESEARCHED | 1 |
| DRAFTED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **106** |

## 6. Drift documental detectado

`STATUS.md` del parent aún describe cortes anteriores (96/90 en distintas secciones), mientras este SHA congelado contiene 106 entradas canónicas y 91 fuentes.

Este audit **no** modifica `STATUS.md` ni Master Inventory. La reconciliación debe hacerse después de integrar o congelar el siguiente corte, para evitar escribir un snapshot móvil.

## 7. Límites del PASS

Este resultado certifica únicamente integridad estructural/referencial para el SHA auditado.

No certifica automáticamente:

- exactitud semántica de cada claim;
- precisión de cada localizador;
- corrección de una transcripción;
- adecuación del alcance dialectal;
- licencias de reutilización;
- READY_FOR_COMPOSITION.

## 8. Reglas para el siguiente corte

Repetir el scan si cambia cualquiera de estos elementos:

- número de entradas físicas;
- Source Registry;
- estados de entrada por integración de reviews;
- canonicalización de nuevas fuentes;
- resolución de `DE-PROP-003`.