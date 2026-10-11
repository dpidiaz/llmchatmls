# MLS-SND — Estado del proyecto

Última actualización: 2026-10-11.

## Fundación

| Componente | Estado |
|---|---|
| Editorial Charter | DRAFTED |
| Transcription Guide | v0.2 — decisiones base cerradas |
| Varieties Policy | v0.2 — matriz de referencias creada |
| Master Inventory | v0.2 — 143 unidades editoriales candidatas |
| Source Registry | v0.4 — 24 fuentes registradas |
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

- SND-FND-002 — Fonética y fonología — EVIDENCE_CHECKED.
- SND-FND-004 — Producción del habla y tracto vocal — EVIDENCE_CHECKED.
- SND-FND-003 — Fonema, alófono, segmento y realización — EVIDENCE_CHECKED.
- SND-FND-006 — Consonantes: parámetros articulatorios — EVIDENCE_CHECKED.
- SND-FND-007 — Vocales: parámetros articulatorios — EVIDENCE_CHECKED.
- SND-FND-008 — Sílaba — EVIDENCE_CHECKED.
- SND-FND-009 — Fonotáctica — EVIDENCE_CHECKED.
- SND-FND-011 — Acento y prominencia — EVIDENCE_CHECKED.
- SND-FND-013 — Tono — EVIDENCE_CHECKED.
- SND-FND-015 — Entonación — EVIDENCE_CHECKED.

### Entradas de representación/perfiles auditadas

- SND-REP-002 — Qué es el AFI/IPA — EVIDENCE_CHECKED.
- SND-ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz — EVIDENCE_CHECKED.
- SND-ZHTW-007 — Zhuyin/Bopomofo — EVIDENCE_CHECKED.
- SND-KO-009 — Romanización Revisada del coreano — EVIDENCE_CHECKED.
- SND-JA-001 — Tokio como ancla de referencia y sus límites — EVIDENCE_CHECKED.

## Métricas

- 24 fuentes registradas.
- 143 unidades editoriales candidatas inventariadas.
- 10 perfiles lingüísticos inicializados.
- 15 entradas piloto redactadas.
- 15 entradas en EVIDENCE_CHECKED.
- 0 entradas todavía en LINGUISTIC_REVIEW, EDITORIAL_REVIEW o READY_FOR_COMPOSITION.

## Coordinación paralela

Los chats nuevos deben leer `COORDINATION.md`, trabajar en ramas independientes desde `feat/mls-snd-foundation` y abrir PR hacia esa rama, no hacia `main`.

## Próximos gates

1. **GATE CUMPLIDO:** 10 entradas de fundamentos en EVIDENCE_CHECKED;
2. **GATE CUMPLIDO:** SND-REP-002 y cuatro pilotos lingüísticos auditados;
3. producir pilotos es-GT, en-US y pt-BR-rio con clusters sustantivos;
4. ejecutar LINGUISTIC_REVIEW sobre la primera wave;
5. congelar arquitectura solo después del gate del piloto.


## Gate FND-01

**PASS provisional:** 10 entradas fundacionales y 5 entradas de representación/perfiles alcanzaron EVIDENCE_CHECKED. El siguiente paso es ejecutar LINGUISTIC_REVIEW sobre esta wave y avanzar clusters sustantivos de los tres perfiles piloto (es-GT, en-US, pt-BR-rio).
