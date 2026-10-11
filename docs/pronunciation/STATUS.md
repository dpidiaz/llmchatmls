# MLS-SND — Estado del proyecto

Última actualización: 2026-10-11.

## Fundación

| Componente | Estado |
|---|---|
| Editorial Charter | DRAFTED |
| Transcription Guide | v0.2 — decisiones base cerradas |
| Varieties Policy | v0.2 — matriz de referencias creada |
| Master Inventory | v0.2 — 143 unidades editoriales candidatas |
| Source Registry | v0.5 — 26 fuentes registradas |
| R33 gate | DRAFTED |
| Entry Template | v0.1 |
| R44 Work Plan | v0.1 |
| Coordination Protocol | ACTIVO |

## Referencias de variedad

| Perfil | Estado |
|---|---|
| 🇬🇹 es-GT | REFERENCE_PROVISIONAL |
| 🇺🇸 en-US | MULTI_REFERENCE |
| 🇧🇷 pt-BR-rio | REFERENCE_PROVISIONAL |
| 🇮🇹 it | REFERENCE_PROVISIONAL |
| 🇫🇷 fr | REFERENCE_OPEN |
| 🇩🇪 de | MULTI_REFERENCE |
| 🇹🇼 zh-TW | REFERENCE_PROVISIONAL |
| 🇰🇷 ko | REFERENCE_PROVISIONAL |
| 🇯🇵 ja | REFERENCE_FIXED para ancla prosódica Tokio/común |
| 🇷🇺 ru | REFERENCE_FIXED para referencia ortoépica |

## Wave de contenido actual

### Entradas de fundamento auditadas

- SND-FND-002 — Fonética y fonología — EDITORIAL_REVIEW.
- SND-FND-004 — Producción del habla y tracto vocal — EDITORIAL_REVIEW.
- SND-FND-003 — Fonema, alófono, segmento y realización — EDITORIAL_REVIEW.
- SND-FND-006 — Consonantes: parámetros articulatorios — EDITORIAL_REVIEW.
- SND-FND-007 — Vocales: parámetros articulatorios — EDITORIAL_REVIEW.
- SND-FND-008 — Sílaba — EDITORIAL_REVIEW.
- SND-FND-009 — Fonotáctica — EDITORIAL_REVIEW.
- SND-FND-011 — Acento y prominencia — EDITORIAL_REVIEW.
- SND-FND-013 — Tono — EDITORIAL_REVIEW.
- SND-FND-015 — Entonación — EDITORIAL_REVIEW.

### Entradas transversales de representación revisadas

- SND-REP-002 — Qué es el AFI/IPA — EDITORIAL_REVIEW.
- SND-REP-005 — Diacríticos del IPA — EDITORIAL_REVIEW.
- SND-REP-006 — Suprasegmentales, tonos y acentos de palabra en el IPA — EDITORIAL_REVIEW.

### Entradas específicas de idiomas auditadas
- SND-ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz — EVIDENCE_CHECKED.
- SND-ZHTW-007 — Zhuyin/Bopomofo — EVIDENCE_CHECKED.
- SND-KO-009 — Romanización Revisada del coreano — EVIDENCE_CHECKED.
- SND-JA-001 — Tokio como ancla de referencia y sus límites — EVIDENCE_CHECKED.

## Métricas

- 26 fuentes registradas.
- 143 unidades editoriales candidatas inventariadas.
- 10 perfiles lingüísticos inicializados.
- 22 entradas únicas redactadas.
- 13 entradas transversales en EDITORIAL_REVIEW.
- 9 entradas específicas de idiomas en EVIDENCE_CHECKED.
- 0 entradas en READY_FOR_COMPOSITION.

## Coordinación paralela

Los chats nuevos deben leer `COORDINATION.md`, trabajar en ramas independientes desde `feat/mls-snd-foundation` y abrir PR hacia esa rama, no hacia `main`.

## Próximos gates

1. **GATE CUMPLIDO:** 10 entradas de fundamentos en EVIDENCE_CHECKED;
2. **GATE CUMPLIDO:** SND-REP-002 y cuatro pilotos lingüísticos auditados;
3. **GATE CUMPLIDO:** los tres perfiles piloto tienen alcance y al menos un fenómeno sustantivo en EVIDENCE_CHECKED;
4. ejecutar LINGUISTIC_REVIEW sobre la primera wave;
5. congelar arquitectura solo después del gate del piloto.


## Gate FND-01

**PASS provisional:** 10 entradas fundacionales y 5 entradas de representación/perfiles alcanzaron EVIDENCE_CHECKED. El siguiente paso es ejecutar LINGUISTIC_REVIEW sobre esta wave y avanzar clusters sustantivos de los tres perfiles piloto (es-GT, en-US, pt-BR-rio).


### Otras entradas piloto

- SND-REP-002 — Qué es el AFI/IPA — EVIDENCE_CHECKED.
- SND-ESGT-001 — Alcance y variedades del español de Guatemala — EVIDENCE_CHECKED.
- SND-ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz — EVIDENCE_CHECKED.
- SND-ZHTW-007 — Zhuyin/Bopomofo — EVIDENCE_CHECKED.
- SND-KO-009 — Romanización Revisada del coreano — EVIDENCE_CHECKED.
- SND-JA-001 — Tokio como ancla de referencia y sus límites — EVIDENCE_CHECKED.
- SND-PTBR-001 — Portugués brasileño amplio vs. habla carioca — EVIDENCE_CHECKED.
- SND-ESGT-005 — /s/ y variación regional — EVIDENCE_CHECKED.
- SND-ENUS-009 — Southern Michigan como perfil documentado — EVIDENCE_CHECKED.
- SND-PTBR-006 — Sibilante /S/ en coda y variación carioca — EVIDENCE_CHECKED.


## Gate PILOT-SCOPE-01

- 🇬🇹 es-GT: EVIDENCE_CHECKED.
- 🇺🇸 en-US: EVIDENCE_CHECKED.
- 🇧🇷 pt-BR-rio: EVIDENCE_CHECKED.

**Estado:** PASS — 3/3 perfiles de alcance superan EVIDENCE_CHECKED.


## Gate PILOT-PHENOMENA-01

**PASS provisional.** Los tres perfiles piloto ya contienen un segundo nivel de evidencia:

- 🇬🇹 es-GT — SND-ESGT-005: /s/ y variación regional.
- 🇺🇸 en-US — SND-ENUS-009: Southern Michigan como perfil regional documentado.
- 🇧🇷 pt-BR-rio — SND-PTBR-006: /s/ en coda en los conjuntos históricos descritos por Callou.

Los tres están en **EVIDENCE_CHECKED**. El perfil carioca conserva advertencia temporal explícita: los porcentajes NURC de décadas de 1970/1990 no se presentan como mediciones actuales.

### Siguiente gate

Ejecutar **LINGUISTIC_REVIEW** independiente o de segunda pasada sobre la primera wave antes de congelar la arquitectura del tomo.


## Gate LINGUISTIC-REVIEW-WAVE-01

**PASS para el núcleo transversal.**

- 10 entradas de fundamentos: revisión lingüística de segunda pasada completada → EDITORIAL_REVIEW.
- 3 entradas transversales de representación: revisión lingüística completada → EDITORIAL_REVIEW.
- 9 entradas específicas de idiomas: permanecen en EVIDENCE_CHECKED hasta revisión especializada o segunda revisión específica por idioma.
- 3 conflictos de ID creados por concurrencia fueron consolidados: FND-004, FND-006 y FND-007.
- Correcciones sustantivas de la wave: distinción pitch/F0; cautela con correlatos del acento; conservación de /S/ en la notación fuente del portugués carioca; realineación de claims de alcance PTBR-001.

**No hay entradas READY_FOR_COMPOSITION todavía.** El siguiente gate es revisión editorial de las 13 entradas transversales y revisión lingüística especializada de los tres perfiles piloto.
