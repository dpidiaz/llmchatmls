# MLS EXPERIENCE REFINEMENT R1 — OWNERSHIP

## Chat 0 — Coordination / Integration
Propiedad:
- docs/uxui-r1/*
- integración entre ramas
- revisión de contratos
- resolución de conflictos entre workstreams

No debe apropiarse de features de otros chats salvo para resolver integración.

## Chat A — Navigation & Orientation
Propiedad funcional:
- Home
- header
- sidebar
- navegación global
- navegación móvil del shell
- jerarquía Buscar / Explorar / Continuar
- microcopy global de navegación

No posee:
- reader state
- búsqueda semántica
- Virtuoso backend
- offline
- design tokens compartidos

## Chat B — Continuity & Personal Library
Propiedad funcional:
- Continuar leyendo
- restauración de posición
- recientes
- guardados/favoritos
- estado local de lectura
- regreso al contexto de lectura

## Chat C — Discovery & Learning
Propiedad funcional:
- También mira
- related content
- semantic neighbors
- relaciones entre entradas
- candidatos de prerrequisitos / siguiente tema, cuando se aprueben

## Chat D — Visual System
Propiedad:
- design tokens
- typography primitives
- spacing scale
- radius scale
- shared focus styles
- shared button/input primitives
- iconography guidelines/primitives

No debe rediseñar pantallas de A–F.

## Chat E — Offline & Resilience
Propiedad:
- PWA/offline UX
- selección/descarga local cuando aplique
- mensajes de red
- estados degradados por conectividad
- resiliencia UX no-AI

## Chat F — AI Experience
Propiedad:
- UX de Virtuoso
- UX de Profesor IA
- microcopy IA
- diferenciación editorial/IA
- estados IA existentes
- rutas guardables como propuesta/feature cuando se autorice

No puede cambiar modelos/proveedores/garantías canónicas sin decisión compartida.

## Chat G — Accessibility & Responsive QA
Propiedad transversal:
- auditoría keyboard
- focus/focus-visible
- screen reader semantics
- zoom/reflow
- contraste
- touch targets
- responsive QA
- reduced motion

G no debe hacer grandes refactors de dominios ajenos sin DEPENDENCY REQUEST.

## Regla para archivos compartidos
Si dos workstreams necesitan el mismo archivo:
1. identificar owner funcional;
2. evitar refactor cruzado;
3. registrar DEPENDENCY REQUEST;
4. acordar hook/token/API mínimo;
5. integrar mediante PR pequeño.
