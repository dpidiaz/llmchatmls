# MLS-SND — Protocolo de coordinación entre chats

Estado: **activo**.

Este archivo permite que múltiples chats trabajen en MLS-SND usando GitHub como medio común de coordinación, sin depender de conversación directa entre chats.

## 1. Rama matriz

La rama de integración es:

`feat/mls-snd-foundation`

Los chats paralelos **no deben trabajar directamente sobre esta rama** salvo que estén actuando expresamente como integradores.

## 2. Inicio de un chat trabajador

Cada chat debe:

1. leer `README.md`, `STATUS.md`, `MLS-SND-MASTER-INVENTORY.md`, `MLS-SND-SOURCE-REGISTRY.md` y las políticas editoriales;
2. buscar ramas y PRs abiertos relacionados con MLS-SND;
3. identificar trabajo útil no duplicado;
4. crear una rama propia desde la rama matriz actual;
5. trabajar solo en esa rama;
6. abrir PR hacia `feat/mls-snd-foundation`, nunca directamente hacia `main`.

## 3. Nombre de ramas

Formato recomendado:

`snd/<area>-<slug-corto>`

Ejemplos:

- `snd/foundations-articulation`
- `snd/es-gt-vowels`
- `snd/pt-br-rio-prosody`
- `snd/r33-audit-wave-01`

Si el nombre ya existe, añadir un sufijo corto.

## 4. Claim visible mediante PR borrador

Inmediatamente después de crear su rama, cada chat trabajador debe abrir un PR **borrador** hacia `feat/mls-snd-foundation` antes de producir trabajo sustantivo.

Título recomendado:

`[MLS-SND][CLAIM] <alcance concreto>`

El cuerpo debe declarar:

- área o IDs reclamados;
- rutas principales que piensa editar;
- tipo de trabajo: investigación / redacción / auditoría / integración;
- dependencias conocidas.

Ese PR borrador funciona como claim visible. Si otro chat encuentra un claim activo sobre el mismo bloque, debe cambiar de frente salvo que esté realizando una revisión independiente.

## 5. Regla anti-duplicación

Antes de comenzar una entrada o cluster:

- buscar su ID en GitHub;
- revisar PRs abiertos;
- comprobar el estado en `MLS-SND-MASTER-INVENTORY.md`.

Si otro chat ya trabaja el mismo ID, elegir otro bloque salvo que el objetivo explícito sea una revisión independiente.

## 6. Propiedad de archivos

Los chats trabajadores deben preferir archivos de su propio dominio:

- `fundamentals/`
- `representation/`
- `languages/<idioma>/`
- futuros directorios `comparative/`

Los siguientes archivos son **globales** y deben modificarse con cautela:

- `STATUS.md`
- `MLS-SND-MASTER-INVENTORY.md`
- `MLS-SND-SOURCE-REGISTRY.md`
- políticas en `editorial/`

Un chat trabajador puede proponer cambios globales en su PR, pero debe minimizar conflictos y explicar la necesidad.

## 7. Registro de fuentes

Si una fuente nueva es necesaria:

1. comprobar que no exista ya en el Source Registry;
2. registrar alcance, tier, localizador, acceso, limitaciones y fecha;
3. no usar una fuente fuera de su alcance declarado;
4. no declarar una entrada validada solo porque una fuente esté registrada.

## 8. Estados editoriales

Secuencia normal:

`INVENTORY → SOURCE_MAPPED → RESEARCHED → DRAFTED → EVIDENCE_CHECKED → LINGUISTIC_REVIEW → EDITORIAL_REVIEW → READY_FOR_COMPOSITION`

No saltar de DRAFTED a READY_FOR_COMPOSITION.

## 9. Evidencia R33

Toda entrada con afirmaciones materiales debe incluir una tabla:

`claim_id ↔ afirmación ↔ source_id ↔ localizador ↔ alcance ↔ estado`

`EVIDENCE_CHECKED` significa únicamente que la correspondencia entre claim y evidencia fue comprobada. No equivale a revisión lingüística completa ni a revisión editorial.

## 10. PR de salida

Cada PR debe indicar:

- IDs trabajados;
- archivos creados/modificados;
- fuentes añadidas;
- claims promovidos a EVIDENCE_CHECKED;
- asuntos todavía abiertos;
- decisiones editoriales que requieren integración;
- conflictos o solapamientos detectados.

Base del PR:

`feat/mls-snd-foundation`

## 11. Qué hacer al terminar un bloque

El chat debe buscar otro bloque elegible y continuar si todavía tiene capacidad.

No necesita esperar instrucciones del usuario.

## 12. Qué hacer si encuentra contradicciones

No sobrescribir silenciosamente.

Debe:

1. conservar las dos posiciones;
2. identificar las fuentes;
3. delimitar si describen variedades, épocas o análisis diferentes;
4. documentar el conflicto;
5. dejar la decisión como OPEN_QUESTION si no puede resolverse con evidencia suficiente.

## 13. Principio de autonomía

El usuario no debe actuar como dispatcher manual.

Cada chat es responsable de orientarse leyendo GitHub, evitar duplicados razonables y dejar una salida auditable para los demás.


## 14. Snapshot operativo — 2026-10-11 01:50–02:00 America/Guatemala

Observado desde GitHub:

- **36 PRs abiertos** hacia `feat/mls-snd-foundation`;
- **33** siguen en draft;
- **3** están no-draft: #7294, #7310 y #7323;
- **33 branches `snd/*`** existen sin PR abierto hacia la base en este snapshot.

### PRs no-draft

- **#7294** — SND-CMP-001, comparación sin asumir identidad.
- **#7310** — REF-002, índice vivo IPA.
- **#7323** — es-GT, vocales y mapa consonántico.

**Regla de integración:** no-draft no equivale a merge automático. Antes de integrar se revisan mergeability, cambios globales arrastrados, Source Registry y gates R33.

### Frentes con PRs abiertos

- fundamentos: percepción, duración/cantidad, variación, sonido/acento tonal;
- comparación: método y equivalencias;
- representación: escritura/sistemas locales, romanización/transliteración;
- referencias: glosario, IPA, idioma, fenómeno, romanizaciones, cross-reference graph, bibliografía;
- es-GT, en-US, pt-BR-rio, italiano, francés, alemán, japonés y ruso;
- revisión editorial y gate de composición.

### Frentes con branches activas pero sin PR abierto en este snapshot

Incluyen trabajo en zh-TW, coreano, ruso, alemán/italiano/francés de referencia, IPA/diacríticos, auditorías R33, revisión lingüística e integración de fundamentos.

Antes de abrir trabajo nuevo en esas áreas, comprobar primero las branches activas.

## 15. IDs de fuentes en trabajo paralelo

Para reducir colisiones, una rama trabajadora **no debe asignar un nuevo ID canónico `SND-SRC-xxxx`** si la fuente todavía no existe en el Source Registry común.

Debe usar un ID local collision-safe, por ejemplo:

- `ESGT-W2-S01`;
- `CMP-PROP-001`;
- `JA-W3-S02`.

Durante integración:

1. se comprueban metadatos y alcance;
2. se asigna el ID canónico;
3. se sustituyen los IDs locales en claims/entradas;
4. se vuelve a comprobar claim ↔ source ↔ locator;
5. solo después puede promoverse el gate R33 aplicable.

## 16. Regla para archivos globales

Las ramas de dominio deben evitar reescribir por arrastre estados no relacionados en:

- `MLS-SND-MASTER-INVENTORY.md`;
- `MLS-SND-SOURCE-REGISTRY.md`;
- `STATUS.md`;
- `editorial/*`.

Si una branch parte de una base antigua y su diff muestra retrocesos de estados ajenos, el integrador debe preservar el estado más reciente de la base e integrar selectivamente el contenido de dominio.
