# MLS-SND — Source-ID integrity / snapshot de 90 entradas

**Fecha:** 2026-10-11  
**Rama:** `feat/mls-snd-foundation`  
**Snapshot de reconciliación:** `f9ae21fff78c72d4079f6c4c0e168c0bba75c2f4`  
**Source Registry blob:** `c50e4682a4e76a56a33a27c4b1009e38b2b77a0d`  
**Tipo:** auditoría de integridad referencial y sincronización del inventario; **no** auditoría lingüística de claims.

## Resultado

**PASS_REFERENTIAL_WITH_ONE_DRAFT_WARNING** para los 90 archivos de entrada identificados en el árbol.

| Control | Resultado |
|---|---:|
| Archivos `SND-<AREA>-NNN-*.md` | 90 |
| IDs de entrada únicos | 90 |
| IDs de entrada duplicados | 0 |
| IDs de fuente canónicos definidos en Registry | 79 |
| Secuencia de fuentes | SND-SRC-0001…0079, sin huecos |
| Entradas con al menos un `SND-SRC-NNNN` | 89 |
| Entradas sin referencia `SND-SRC-NNNN` | 1 |
| Referencias `SND-SRC-NNNN` fuera del registro | 0 |
| Coincidencias con IDs locales de wave `<AREA>-W<NN>-S<N>` / `<AREA>-W<NN>-SRC-<N>` | 0 |
| Entradas sin fuente en etapa EVIDENCE_CHECKED o superior | 0 |

La única entrada sin ID de fuente es **SND-ZHTW-009**, que permanece en `DRAFTED`. No se la promueve ni se le inventa una fuente. Requiere source mapping antes de su gate R33.

## Distribución de estados canónicos

Los estados se tomaron del encabezado `**Estado:**` de cada entrada; no se infieren a partir del título o estado de un PR.

| Estado | Entradas |
|---|---:|
| EDITORIAL_REVIEW | 40 |
| LINGUISTIC_REVIEW | 10 |
| EVIDENCE_CHECKED | 32 |
| SOURCE_MAPPED | 3 |
| DRAFTED | 2 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **90** |

## Distribución física por área

| Área | Entradas |
|---|---:|
| FND | 18 |
| REP | 12 |
| CMP | 1 |
| REF | 1 |
| es-GT | 7 |
| en-US | 8 |
| pt-BR-rio | 2 |
| it | 5 |
| fr | 3 |
| de | 3 |
| zh-TW | 8 |
| ko | 10 |
| ja | 4 |
| ru | 8 |
| **Total** | **90** |

## Reconciliación

- Se inspeccionaron los 90 archivos físicos y los IDs `SND-SRC-NNNN` que contienen.
- El registro de fuentes contiene 79 encabezados canónicos únicos y contiguos.
- Las integraciones editoriales concurrentes de francés, coreano, ruso y la revisión japonesa fueron cotejadas con sus commits: las promociones de metadatos se trataron separadamente de la validación R33 de claims.
- Se sincronizaron **53 filas** de `MLS-SND-MASTER-INVENTORY.md` con el estado de los archivos físicos en el commit de reconciliación citado.
- El trabajo de otros chats no se reescribió ni se fusionaron ramas atrasadas.

## Alcance y límites del PASS

Este resultado certifica **integridad estructural y referencial** dentro del snapshot indicado, no la verdad de cada afirmación.

No certifica:

1. que cada localizador de cada claim sea exacto o accesible;
2. que una fuente cubra lingüísticamente toda la variedad atribuida;
3. que la licencia permita cualquier forma de reutilización;
4. que todos los enlaces externos sigan funcionando;
5. que una entrada en `EDITORIAL_REVIEW` haya aprobado el gate de composición;
6. que no existan formas de IDs locales distintas de los patrones examinados.

Los archivos se inspeccionaron en lecturas sucesivas de la rama viva; las modificaciones concurrentes relevantes a estados y notas se cotejaron con los commits de integración. Para reproducibilidad bit a bit, el siguiente linter automatizado debe leer el árbol desde un **SHA congelado** y emitir un manifiesto de archivo + blob SHA + hallazgos.

## Próximos controles

1. Mapear fuente(s) para ZHTW-009 sin promoverla a ciegas.
2. Ejecutar linter reproducible a SHA fijo y validar encabezados/claims con patrones exhaustivos.
3. Auditar localizadores y alcance de evidencia R33 por claim, independientemente del PASS referencial.
4. Mantener la unicidad de ID ante nuevas waves y actualizar el snapshot tras cada integración.
