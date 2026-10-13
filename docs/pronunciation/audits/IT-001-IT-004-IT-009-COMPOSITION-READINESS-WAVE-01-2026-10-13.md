# Auditoría — IT-001 / IT-004 / IT-009 composition readiness wave 01

**Fecha:** 2026-10-13  
**Base de evaluación:** `6449c3f240d2ee59d52cee373be2fa8b3f081513`  
**Política:** `docs/pronunciation/editorial/composition-readiness.md` v0.3.

## Resultado resumido

| Entrada | Estado de entrada al gate | Resultado | Estado de salida |
|---|---|---|---|
| SND-IT-001 | EDITORIAL_REVIEW | BLOCKED | EDITORIAL_REVIEW |
| SND-IT-004 | EDITORIAL_REVIEW | BLOCKED | EDITORIAL_REVIEW |
| SND-IT-009 | EDITORIAL_REVIEW | PASS | READY_FOR_COMPOSITION |

## SND-IT-001 — BLOCKED

La entrada conserva explícitamente **REFERENCE_PROVISIONAL** y declara que todavía no decide si “mainstream Italian” debe adoptarse como referencia principal ni cómo se jerarquizarán las variedades regionales.

Ese punto afecta el **alcance central** de la entrada. Conforme a §8 de la política de composition readiness, una open question que puede cambiar variedad/alcance bloquea el gate.

### Condición de desbloqueo
Reconciliar la arquitectura de referencia del perfil italiano y sustituir `REFERENCE_PROVISIONAL` por una decisión editorial estable o por una formulación reader-facing que no obligue a COMPOSITION a decidir la referencia.

## SND-IT-004 — BLOCKED

La entrada declara todavía abierta la **política definitiva de transcripción /Cː/ frente a otros análisis**, además del análisis fonológico exacto de las geminadas.

La representación de la geminación es material al fenómeno central de la entrada. COMPOSITION no puede elegir por sí misma una representación fonológica ni una convención de transcripción.

### Condición de desbloqueo
Cerrar o acotar editorialmente la política de representación de geminadas de forma que la versión reader-facing tenga una convención aprobada y no dependa de una decisión fonológica nueva.

## SND-IT-009 — PASS

Los claims materiales IT009-C01…C04 están VERIFIED y las advertencias de alcance ya forman parte del contenido aprobado. La entrada no necesita resolver una referencia única para Italia: su objeto es precisamente **documentar y separar referencia, mainstream y comparadores regionales**.

La proyección reader-facing excluye metadata de auditoría y conserva la advertencia de que FI/MI/RI no constituyen una taxonomía exhaustiva.

- **Pronunciation Quick Layer:** NOT_APPLICABLE.
- **Handoff:** `docs/pronunciation/composition/handoffs/SND-IT-009.md`.

## Regla de no promoción masiva

No se modificaron IT-001 ni IT-004. El PASS de IT-009 no se extrapola a otras entradas italianas.
