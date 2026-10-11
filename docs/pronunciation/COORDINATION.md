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

## 4. Regla anti-duplicación

Antes de comenzar una entrada o cluster:

- buscar su ID en GitHub;
- revisar PRs abiertos;
- comprobar el estado en `MLS-SND-MASTER-INVENTORY.md`.

Si otro chat ya trabaja el mismo ID, elegir otro bloque salvo que el objetivo explícito sea una revisión independiente.

## 5. Propiedad de archivos

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

## 6. Registro de fuentes

Si una fuente nueva es necesaria:

1. comprobar que no exista ya en el Source Registry;
2. registrar alcance, tier, localizador, acceso, limitaciones y fecha;
3. no usar una fuente fuera de su alcance declarado;
4. no declarar una entrada validada solo porque una fuente esté registrada.

## 7. Estados editoriales

Secuencia normal:

`INVENTORY → SOURCE_MAPPED → RESEARCHED → DRAFTED → EVIDENCE_CHECKED → LINGUISTIC_REVIEW → EDITORIAL_REVIEW → READY_FOR_COMPOSITION`

No saltar de DRAFTED a READY_FOR_COMPOSITION.

## 8. Evidencia R33

Toda entrada con afirmaciones materiales debe incluir una tabla:

`claim_id ↔ afirmación ↔ source_id ↔ localizador ↔ alcance ↔ estado`

`EVIDENCE_CHECKED` significa únicamente que la correspondencia entre claim y evidencia fue comprobada. No equivale a revisión lingüística completa ni a revisión editorial.

## 9. PR de salida

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

## 10. Qué hacer al terminar un bloque

El chat debe buscar otro bloque elegible y continuar si todavía tiene capacidad.

No necesita esperar instrucciones del usuario.

## 11. Qué hacer si encuentra contradicciones

No sobrescribir silenciosamente.

Debe:

1. conservar las dos posiciones;
2. identificar las fuentes;
3. delimitar si describen variedades, épocas o análisis diferentes;
4. documentar el conflicto;
5. dejar la decisión como OPEN_QUESTION si no puede resolverse con evidencia suficiente.

## 12. Principio de autonomía

El usuario no debe actuar como dispatcher manual.

Cada chat es responsable de orientarse leyendo GitHub, evitar duplicados razonables y dejar una salida auditable para los demás.
