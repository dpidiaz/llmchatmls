# MLS-SND — Work Queue

Actualizado: 2026-10-11.  
Corte de coordinación: **106 entradas / 91 fuentes**.

Antes de reclamar trabajo:

1. leer `STATUS.md`;
2. revisar `INTEGRATION-QUEUE.md`;
3. buscar ramas/PRs sobre el mismo ID;
4. comprobar si el archivo canónico ya existe;
5. distinguir draft nuevo de review/ampliación.

## Reglas

- Base: `feat/mls-snd-foundation`.
- Workers: `snd/<area>-<wave>`.
- PRs apuntan a la rama matriz.
- Si un ID ya existe, el trabajo nuevo debe ser revisión, corrección o ampliación compatible.
- No editar hot files globales salvo claim explícito de integración/coordinación.
- IDs locales de fuentes deben canonicalizarse antes de promoción.
- Ramas muy behind/diverged se integran por clean reapply, no por merge ciego.
- No rebajar R33 para aumentar throughput.

## Ya canónico — no reclamar como draft nuevo

### Fundamentos
FND-001…FND-018: **18/18 físicos**.

### Representación
REP-001…REP-012: **12/12 físicos**.

### Comparación
- CMP-001 físico.
- CMP-002…CMP-011 todavía bloqueados por perfiles suficientes.

### Referencia
- REF-002 físico e IN_PROGRESS.
- REF-001 y REF-003…REF-008 siguen pendientes de integración/cobertura según sus waves.

## Perfiles: cobertura física

### 🇬🇹 ESGT
Físicos:
- ESGT-001/002/003/004/005/009/010.

Ausentes:
- ESGT-006/007/008.

Estados pre-gate:
- ESGT-002 SOURCE_MAPPED.
- ESGT-004 DRAFTED.

Antes de reclamar 006/007/008, revisar waves activas de róticas/prosodia.

### 🇺🇸 ENUS
Físicos:
- ENUS-001;
- ENUS-003…009.

Ausente:
- ENUS-002.

No crear segundos canónicos de 003–009.

### 🇧🇷 PTBR
Físicos:
- PTBR-001/006.

Ausentes:
- PTBR-002/003/004/005/007/008/009/010.

La pilot wave histórica contiene material; integrar por ID y scope, no por merge masivo.

### 🇮🇹 IT
IT-001…IT-009: **9/9 físicos**, todos en LINGUISTIC_REVIEW.

### 🇫🇷 FR
FR-001…FR-009: **9/9 físicos**.

- FR-001/002/009: EDITORIAL_REVIEW.
- FR-003…008: LINGUISTIC_REVIEW.

### 🇩🇪 DE
Físicos:
- DE-001/002/003/004/006/007/008.

Ausente:
- DE-005.

Pre-gate:
- DE-008 RESEARCHED.

### 🇹🇼 ZHTW
Físicos:
- ZHTW-001/003/004/005/007/008/009/010.

Ausentes:
- ZHTW-002/006.

Pre-gate:
- ZHTW-003 RESEARCHED_PARTIAL.

ZHTW-009 ya está EVIDENCE_CHECKED con fuente canónica; no volver a tratarlo como draft.

### 🇰🇷 KO
KO-001…KO-010: **10/10 físicos**.

KO-002 ya está EVIDENCE_CHECKED como **mapa de evidencia**, no inventario final.

### 🇯🇵 JA
Físicos:
- JA-001/004/006/007/008/009.

Ausentes:
- JA-002/003/005/010.

Revisar waves activas de mora/duración/romanización antes de reclamar.

### 🇷🇺 RU
Físicos:
- RU-001…RU-008.

Ausente:
- RU-009.

## Conteo de cobertura

Inventario candidato: 143.  
Entradas físicas: 106.  
Unidades candidatas todavía sin archivo físico: **37**.

Desglose de gaps físicos:

- CMP: 10.
- REF: 7.
- ESGT: 3.
- ENUS: 1.
- PTBR: 8.
- DE: 1.
- ZHTW: 2.
- JA: 4.
- RU: 1.

## Trabajo prioritario no meramente volumétrico

### 1. Cerrar estados pre-gate
- ESGT-002.
- ESGT-004.
- DE-008.
- ZHTW-003.
- REF-002 como aparato de referencia.

### 2. Integrar cobertura ya investigada
Preferir clean reapply de waves con contenido útil ya producido antes de abrir investigación redundante.

### 3. Composition readiness
El proyecto tiene 44 entradas en EDITORIAL_REVIEW y 0 en READY_FOR_COMPOSITION.

La wave de gate de composición debe integrarse antes de promover cualquier entrada.

### 4. QA
Repetir:
- unicidad de IDs;
- existencia de Source IDs;
- estados;
- localizadores;
- Unicode/IPA;
- referencias cruzadas;

sobre un SHA congelado.

## Criterio para elegir siguiente trabajo

1. no duplicado;
2. desbloquea dependencias;
3. evidencia verificable;
4. reduce un gap real;
5. salida auditable;
6. conserva variedad/alcance;
7. no rebaja gates.
