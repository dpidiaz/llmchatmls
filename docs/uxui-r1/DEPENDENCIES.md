# MLS EXPERIENCE REFINEMENT R1 — DEPENDENCIES

## Dependencias iniciales

### A → D
Navigation puede inspeccionar y trabajar lógica independiente, pero debe consumir tokens compartidos de D para cambios visuales globales.

### B
Puede avanzar de forma independiente mientras no modifique primitives visuales globales.

### C
Puede avanzar con related/semantic discovery manteniendo canonicalidad, idioma y fallbacks.

### E
Puede avanzar en offline/resilience sin tocar search/AI internals fuera de contratos públicos.

### F → D
Puede avanzar en microcopy/lógica UX de IA.
Para normalización visual compartida, debe consumir tokens/primitives de D.

### G → A–F
Puede construir baseline y QA matrix desde el inicio.
El pase correctivo transversal debe ocurrir sobre la integración conjunta.

## Formato de DEPENDENCY REQUEST

### DR-XXX
Requester:
Owner:
Need:
Why:
Files/contract involved:
Blocking: yes/no
Suggested minimal change:
Status: OPEN / ACCEPTED / RESOLVED / REJECTED

## Regla
El requester no hace un refactor del dominio del owner mientras el request permanezca OPEN.
