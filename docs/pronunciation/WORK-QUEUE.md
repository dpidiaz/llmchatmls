# MLS-SND — Work Queue

Actualizado: 2026-10-11.

La rama matriz contiene **94 entradas canónicas únicas** y el Source Registry contiene **79 fuentes canónicas**. Antes de reclamar trabajo, revisar:

1. `STATUS.md`;
2. `INTEGRATION-QUEUE.md`;
3. PRs abiertos contra `feat/mls-snd-foundation`;
4. ramas `snd/*`;
5. existencia física del ID en la matriz.

## Reglas

- Base: `feat/mls-snd-foundation`.
- Cada worker usa `snd/<area>-<wave>`.
- PRs apuntan a la rama matriz, no a `main`.
- Si una entrada ya existe físicamente, una wave nueva debe declararse **review, ampliación compatible o corrección**, no segundo canónico.
- No editar hot files globales desde workers salvo claim explícito de integración/coordinación.
- Source IDs locales son válidos en ramas de trabajo; antes de promoción/integración deben deduplicarse y canonicalizarse.
- Un PR no-draft no implica merge automático.
- Una rama muy behind/diverged se integra por **clean reapply** de archivos/claims válidos, no por merge ciego.

## Ya canónico — no reclamar como draft nuevo

Las filas de trabajo por idioma que siguen son orientativas: **el estado exacto y los IDs físicos se consultan en `STATUS.md` y `MLS-SND-MASTER-INVENTORY.md`**, no se infieren de PRs abiertos.

### Fundamentos
**FND-001…FND-018** tienen archivo físico canónico.

- 10 están en `EDITORIAL_REVIEW`.
- 2 están en `LINGUISTIC_REVIEW`.
- 6 están en `EVIDENCE_CHECKED`.

Las waves #7300/#7304/#7311 y cualquier otra sobre estos IDs son revisión/ampliación, no nuevas rutas canónicas.

### Representación
Canónicos físicos:

- REP-001, REP-002;
- REP-005…REP-012.

REP-003 y REP-004 ya existen físicamente; el trabajo útil sobre ellos es revisión lingüística/editorial, corrección o ampliación compatible.

### Comparación
- CMP-001 es único, canónico y `EVIDENCE_CHECKED`.
- El checklist editorial ya está transferido.
- PRs #7294/#7297 quedaron cerrados tras reconciliación.
- CMP-002…CMP-011 siguen bloqueados por perfiles suficientes.

### Referencia
- REF-002 — índice IPA: `IN_PROGRESS`, ya canónico.
- #7310 quedó cerrado tras reaplicación limpia.

## Perfiles: estado físico y trabajo libre

### 🇬🇹 es-GT
Canónicos físicos: ESGT-001/002/003/004/005/009/010.

- 003/004: DRAFTED.
- 009/010: RESEARCHED.
- fuentes locales de estas waves ya fueron canonicalizadas hasta SND-SRC-0056.

**IDs todavía claramente abiertos:** ESGT-006/007/008.  
Róticas/asibilación tienen waves activas; revisar #7330/#7328 antes de reclamar.

### 🇺🇸 en-US
Canónicos físicos: ENUS-001, ENUS-003, ENUS-004, ENUS-005, ENUS-006, ENUS-007, ENUS-008 y ENUS-009.

**Abierto como entrada física:** ENUS-002, sujeto a claims/PRs activos.  
Las waves 003–008 ya fueron clean-reapplied; no crear segundos canónicos.

### 🇧🇷 pt-BR-rio
Canónicos físicos: PTBR-001/006.

**Abiertos:** PTBR-002/003/004/005/007/008/009/010, sujeto a claims de #7277.  
#7340 es review independiente; no crear duplicados de su contenido.

### 🇮🇹 it
Canónicos físicos: IT-001/004/005/008/009.

**Abiertos como entrada física:** IT-002/003/006/007. Revisar PRs/waves existentes antes de reclamar.

### 🇫🇷 fr
Canónicos físicos: FR-001/002/009.  
La revisión lingüística independiente ya está integrada con warnings de alcance.

**Abiertos:** FR-003…008; #7324 trabaja el core francés.

### 🇩🇪 de
Canónicos físicos: DE-001/007/008.

**Abiertos:** DE-002…006, sujeto a #7309.  
#7352 es review lingüística; no sustituye las entradas aún no integradas.

### 🇹🇼 zh-TW
Canónicos físicos: ZHTW-001/003/004/005/007/008/009/010.

- 001/004/005/007/008/010: LINGUISTIC_REVIEW.
- 003: RESEARCHED_PARTIAL.
- 009: DRAFTED.

**Abiertos:** ZHTW-002/006 y gates de 003/009.  
#7337 trabaja segmentales/sílaba; revisar antes de reclamar.

### 🇰🇷 ko
KO-001…010 ya tienen archivo físico canónico.

- KO-001/003…010: LINGUISTIC_REVIEW.
- KO-002: SOURCE_MAPPED.

No crear segundos drafts; trabajo útil = gate de KO-002, revisión editorial, correcciones o ampliaciones compatibles.

### 🇯🇵 ja
Canónicos físicos: JA-001/004/008/009.

Siguen abiertas otras rutas para mora/duración, acento y entradas faltantes. No reclamar JA-002/003/005/006/007/010 sin revisar PRs activos.

### 🇷🇺 ru
RU-001…008 están canónicos y en `LINGUISTIC_REVIEW`.

**Abierto:** RU-009 hasta integrar/canonicalizar su wave de escritura (#7292).

## Aparato de referencia y edición

Waves activas conocidas:

- REF-001 glosario — #7315;
- REF-003 índice por fenómeno — #7314;
- REF-004 índice por idioma — #7319;
- romanizaciones/transliteraciones — #7321;
- bibliografías — #7322;
- grafo de referencias cruzadas — #7325;
- apertura/guía de lectura — #7318;
- evidence display — #7308;
- editorial review foundations — #7326/#7329;
- editorial review representation — #7327;
- typography/Unicode QA — #7335;
- content linter — #7343.

Italia IT-001…009 ya tiene **nueve archivos físicos** en LINGUISTIC_REVIEW; no reclamar IT-002/003/006/007 como drafts nuevos.

## Trabajo de integración / QA

El corte actual está en `STATUS.md` y la auditoría `audits/SOURCE-ID-INTEGRITY-90-2026-10-11.md`. El inventario ya se sincronizó con los 90 encabezados físicos; **no repetir esa reconciliación a partir de snapshots antiguos**.

Prioridad actual:

1. mapear evidencia para ZHTW-009, todavía DRAFTED y sin SND-SRC;
2. ejecutar linter reproducible a SHA fijo y revisar localizadores R33 por claim;
3. continuar reviews y composición sin confundir EDITORIAL_REVIEW con READY_FOR_COMPOSITION;
4. reconciliar waves behind mediante clean reapply;
5. mantener un solo archivo físico por ID y verificar PRs antes de reclamar;
6. actualizar STATUS solo con un nuevo corte verificable.

## Criterio para elegir siguiente trabajo

1. no duplicado;
2. desbloquea dependencias;
3. tiene evidencia verificable;
4. reduce un gap claro;
5. termina con salida auditable;
6. respeta variedad y alcance;
7. no rebaja R33 para aumentar throughput.
