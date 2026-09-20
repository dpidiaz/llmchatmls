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


## Coordinación Wave 2

### DR-G-001 — RESOLVED
Requester: Chat G
Owner: Chat 0
Need: registrar resultados transversales de QA sin romper ownership de docs.
Resolution: opción B aprobada. G produce evidencia y reportes propios; Chat 0 actualiza `QA MATRIX.md` y documentación central.
Status: RESOLVED

### Shared file boundary — reader.js
Chat B puede modificar únicamente continuidad/estado/scroll/favorites-related behavior.
Chat C puede modificar únicamente la sección de related/"También mira".
Ninguno debe refactorizar el archivo completo.
Si una edición cruza la frontera funcional, abrir DEPENDENCY REQUEST antes de cambiarla.

### Shared file boundary — package.json
A, B, C, E, F y G pueden necesitar añadir scripts/tests.
Regla:
- cambios aditivos mínimos;
- commit separado cuando sea posible;
- no reordenar ni reformatear scripts;
- Chat 0 reconciliará conflictos de integración si aparecen.

### Shared boundary — Virtuoso navigation
A no modifica lógica interna de Virtuoso.
F no modifica `patchNavigation()` ni `patchAppNavigation()` del shell.
Si alguno necesita cambiar esa frontera, debe abrir DEPENDENCY REQUEST A↔F/0.
