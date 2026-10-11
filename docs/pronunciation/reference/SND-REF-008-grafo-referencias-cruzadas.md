# SND-REF-008 — Grafo de referencias cruzadas

**Estado:** v0.1 — structural graph.

## Alcance

Este grafo usa únicamente relaciones explícitas del inventario y unas pocas relaciones estructurales ya fijadas por las políticas/guía de transcripción. **No infiere relaciones lingüísticas nuevas.**

- Nodos inventariados detectados: **144**.
- Aristas explícitas/estructurales entre entradas: **23**.

## Tipos de arista

- `depends_on`: dependencia editorial explícita del Master Inventory.
- `conceptual_link`: relación conceptual ya establecida por la arquitectura.
- `method_link`: una entrada comparativa depende de un principio metodológico.
- `profile_to_foundation`: fenómeno de perfil enlaza a fundamento común.
- `profile_to_representation`: perfil enlaza a sistema de representación.

## Aristas

| Desde | Hacia | Tipo |
|---|---|---|
| SND-CMP-001 | SND-FND-017 | method_link |
| SND-CMP-007 | SND-FND-013 | conceptual_link |
| SND-CMP-007 | SND-FND-014 | conceptual_link |
| SND-CMP-009 | SND-FND-015 | conceptual_link |
| SND-FND-003 | SND-FND-002 | depends_on |
| SND-FND-009 | SND-FND-008 | depends_on |
| SND-FND-014 | SND-FND-011 | depends_on |
| SND-FND-014 | SND-FND-013 | depends_on |
| SND-FND-016 | SND-FND-008 | depends_on |
| SND-FND-016 | SND-FND-009 | depends_on |
| SND-FND-018 | SND-FND-017 | depends_on |
| SND-JA-006 | SND-FND-014 | profile_to_foundation |
| SND-KO-009 | SND-REP-010 | profile_to_representation |
| SND-PTBR-010 | SND-FND-015 | profile_to_foundation |
| SND-REP-003 | SND-REP-002 | depends_on |
| SND-REP-004 | SND-REP-002 | depends_on |
| SND-REP-005 | SND-REP-002 | depends_on |
| SND-REP-006 | SND-REP-002 | depends_on |
| SND-REP-007 | SND-FND-002 | conceptual_link |
| SND-REP-008 | SND-REP-007 | conceptual_link |
| SND-REP-009 | SND-REP-001 | conceptual_link |
| SND-ZHTW-004 | SND-FND-013 | profile_to_foundation |
| SND-ZHTW-007 | SND-REP-012 | profile_to_representation |

## Limitaciones

- Las entradas sin dependencia explícita en el inventario no reciben aristas automáticas.
- No se generan enlaces por semejanza de título.
- Los enlaces entre perfiles y fundamentos se ampliarán solo cuando las entradas los declaren explícitamente.
- El grafo no cambia estados editoriales ni gates R33.
## Auditoría de conteo

El Master Inventory declara **143 unidades editoriales candidatas**, pero sus tablas actuales contienen **144 IDs únicos**:

- Fundamentos: 18
- Representación: 12
- Perfiles lingüísticos: **95** (el resumen global todavía dice 94)
- Comparación: 11
- Referencia: 8

Total detectado: **144**.

Este archivo **no corrige** el Master Inventory desde una rama trabajadora. El integrador debe reconciliar el conteo global.

## Separación de evidencias

Dependencias como `SND-REP-002 → SND-SRC-0001/0002` pertenecen a la capa de evidencia, no al grafo de referencias entre entradas. Se conservan en Source Registry/tablas R33 y quedan fuera de este grafo.