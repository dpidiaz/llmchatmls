# SND-ZHTW-007 — Composition Readiness Audit

**Fecha:** 2026-10-11  
**Entrada:** SND-ZHTW-007 — Zhuyin/Bopomofo  
**Versión promovida:** 7e53b382e15dd5754ffb0b5aa9a37f008f1b23bb  
**Resultado:** **PASS → READY_FOR_COMPOSITION**

## 1. Precondiciones

- EVIDENCE_CHECKED: PASS.
- LINGUISTIC_REVIEW: PASS.
- EDITORIAL_REVIEW: PASS.
- Editorial recheck de la versión exacta posterior al micro-fix: PASS.
- No hubo cambios de claims, fuente, localizador, variedad ni análisis.

## 2. Identidad y alcance

- ID/título canónicos: PASS.
- Idioma: mandarín de Taiwán.
- Dominio: sistema local de anotación / escritura-pronunciación.
- Zhuyin se presenta como sistema local con función propia.
- IPA se mantiene como capa descriptiva distinta.
- Romanización se remite a SND-ZHTW-009 y no se mezcla con Zhuyin/IPA.

## 3. Evidencia R33

Claims materiales:
- ZHTW007-C01;
- ZHTW007-C02;
- ZHTW007-C03.

Fuente:
- SND-SRC-0011.

Localizadores:
- datos editoriales del MOE;
- “1. List of Phonetic Symbols”;
- “6. Reference Table of Chinese Characters with Mandarin Chinese Syllables”;
- Reader’s Guide, punto 5.

No hay claims UNSOURCED en la proyección reader-facing.

## 4. Revisión lingüística

- separación Zhuyin / IPA preservada;
- no se presenta Zhuyin como transcripción fonética universal;
- no se usa el manual MOE como descripción fonética integral de Taiwan Mandarin;
- no se introduce equivalencia automática entre caracteres, Zhuyin, romanización e IPA.

## 5. Revisión editorial

La versión 716e16e… recibió micro-recheck editorial PASS tras:
- actualizar la referencia obsoleta a romanización;
- añadir navegación canónica.

El contenido reader-facing puede leerse de forma autónoma.

## 6. Written-only gate

| Control | Resultado | Nota |
|---|---|---|
| WRT-01 | PASS | El objetivo se comprende sin audio. |
| WRT-02 | PASS | Idioma/alcance explícitos. |
| WRT-03 | PASS | Zhuyin, IPA y romanización se distinguen funcionalmente. |
| WRT-04 | PASS | Las convenciones se explican o enlazan mediante IDs canónicos. |
| WRT-05 | PASS | No hay práctica ni equivalencias auditivas inventadas. |
| WRT-06 | NOT_APPLICABLE | No hay diagramas/datos gráficos reader-facing. |
| WRT-07 | PASS | Límites metodológicos visibles. |
| WRT-08 | PASS | Referencias cruzadas canónicas añadidas. |
| WRT-09 | PASS | No depende de color ni disposición visual para distinguir capas. |
| WRT-10 | PASS | Claims materiales trazados a SND-SRC-0011. |
| WRT-11 | PASS | No hay ejercicios, pruebas ni instrucciones al lector. |
| WRT-12 | PASS | La versión fuente conserva Unicode/acentos y no sustituye IPA por ASCII. |

**Written-only result: PASS.**

## 7. Sistemas de escritura y Unicode

La entrada trata un sistema no latino, pero la versión reader-facing actual:
- nombra Zhuyin/Bopomofo;
- no reproduce todavía una tabla completa de glifos Zhuyin;
- no introduce glifos no auditados como ejemplos nuevos;
- conserva flecha Unicode “→” y puntuación Unicode correctamente en el source.

No hay blocker tipográfico para esta versión.

Si COMPOSITION añade una tabla de símbolos, eso sería contenido nuevo y requeriría volver al gate correspondiente; no puede inventarse en maquetación.

## 8. Navegación

IDs confirmados:
- SND-ZHTW-008;
- SND-ZHTW-009;
- SND-REP-010;
- SND-REP-012.

No hay redirects necesarios.

## 9. Reader-facing projection

### Incluido

- encabezado editorial;
- §§1–5;
- §7 Fuente;
- §8 Nota editorial.

### Excluido / interno

- §6 tabla raw de Evidencia R33;
- §9 Auditoría R33;
- §10 Revisión lingüística;
- §11 Revisión editorial;
- metadata de composition readiness.

### Fuentes y fundamento

Visible mediante §7 Fuente + §8 Nota editorial.

## 10. Ejemplos

No hay SOURCE_EXAMPLE, CORPUS_EXAMPLE ni EDITORIAL_EXAMPLE en esta versión.

La ausencia de ejemplo no bloquea esta entrada conceptual sobre función del sistema de representación.

## 11. Open questions

### Bloqueantes

Ninguno para el alcance aprobado.

### No bloqueantes

- una futura ampliación podría mostrar símbolos/ejemplos Zhuyin;
- cualquier tabla nueva deberá pasar Unicode/representación y evidencia antes de incorporarse.

## 12. Resultado

**PASS → READY_FOR_COMPOSITION.**

COMPOSITION puede ajustar jerarquía, espaciado y presentación visual, pero no puede:
- añadir símbolos Zhuyin no aprobados;
- cambiar claims;
- fusionar Zhuyin con IPA o romanización;
- modificar fuentes/localizadores;
- alterar el alcance de Taiwan Mandarin.
